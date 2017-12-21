const utils = require('./utils');
const topicData = require('./spec/topicData');
// const { threadTextAndId2 } = require('./spec/threadData2');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const pgp = require('pg-promise')({ promiseLib: Promise });
const bucket = 'topic-storage';
const dbConfig = require('./config');
const db = pgp(dbConfig);
const keywordDecay = 0.5;
const keywordsThreshold = 0.15;
const articlesThreshold = 56;
const threadDecay = 0.5;

const mergeTopicsWithThreads = (topics, threadKeywords) => {
    const allTopicsKeywords = Object.keys(topics).map(topic => topics[topic].keywords);
    const keywordSets = utils.getKeywordSets(allTopicsKeywords);
    const schemas = utils.formulateInsertionSchema(keywordSets, threadKeywords);
    if(schemas.insertionSchema.length > 0){
        schemas.insertionSchema.articles = topics[schemas.insertionSchema[0].fromTopic].articles;
    }
    schemas.insertionSchema = schemas.insertionSchema.map(insertionObj => {
        insertionObj.articles = topics[insertionObj.fromTopic].articles;
        return insertionObj;
    });
    console.log('SCHEMAS',schemas);
    console.log('INSERTION SCHEMAS',schemas.insertionSchema);
    console.log('NT SCHEMAS',schemas.newThreadSchema);

    return schemas;
};

const getKeywords = () => db.any('SELECT word, thread_id FROM KEYWORDS;')


const updateThreads = (threadScore, targetThread) => {
    console.log(`Thread ${targetThread} score updated`);
    return db.none('UPDATE threads SET score = score + $1 WHERE thread_id = $2;', [threadScore, targetThread]);
}

const boostKeywords = (keywords, targetThread) => {
    return Promise.all(keywords.map(word => {
        return db.none('UPDATE keywords SET relevance = relevance + $1 WHERE thread_id = $2 AND word = $3;', [word.relevance, targetThread, word.text])
            .catch(console.error)
    }))
}
const addNewKeywords = (keywords, targetThread) => {
    return Promise.all(keywords.map(word => {
        return db.none('INSERT INTO keywords (word, thread_id, relevance) VALUES ($1, $2, $3);', [word.text, targetThread, word.relevance])
            .catch(console.error);
    }))
}

const addNewThread = (score) => {
    return db.one('INSERT INTO threads (score) VALUES ($1) RETURNING thread_id;', score)
}


const fetchTopicsAndMerge = (event, context, callback) => {
    // setTimeout(() => {
        const lastCreatedFile = event.Records[0].s3.object.key.replace(/%3A/g, ':');
        db.any('SELECT word, thread_id FROM keywords;')
            .then(threadKeywords => {
                const threadKeywordSetsObj = threadKeywords.reduce((acc, tkw) => {
                    if(acc[tkw.thread_id]){
                        acc[tkw.thread_id].push(tkw);
                    }
                    else{
                        acc[tkw.thread_id] = [tkw];
                    };
                    return acc;
                }, {})
                const threadKeywordSets = Object.keys(threadKeywordSetsObj).map((key) => {
                    return threadKeywordSetsObj[key];
                })
                s3.getObject({ Bucket: bucket, Key: lastCreatedFile }, (err, topics) => {
                    if (err) {
                        console.error('THIS IS AN S3 ERROR:', err);
                    }
                    let parsedTopics = JSON.parse(topics.Body.toString("utf8"));
                    const schemas = mergeTopicsWithThreads(parsedTopics, threadKeywordSets);
                    Promise.all([
                        schemas.insertionSchema.map((topic, i) => {
                            console.log('PARSED', parsedTopics);
                            return Promise.all([
                                db.one('UPDATE threads SET score = score + $1 WHERE thread_id = $2 RETURNING *;', [parsedTopics[topic.fromTopic].score, topic.targetThread])
                                    .then((res) => {
                                        return console.log(`Thread ${topic.targetThread} score updated`);
                                    })
                                    .catch((err) => console.log(err)),
                                Promise.all(
                                    topic.boostKeywords.map(word => {
                                        return db.none('UPDATE keywords SET relevance = relevance + $1 WHERE thread_id = $2 AND word = $3;', [word.relevance, topic.targetThread, word.text])
                                        .catch((err) => console.log(err));
                                    })
                                ),
                                Promise.all(
                                    topic.newKeywords.map(word => {
                                        return db.none('INSERT INTO keywords (word, thread_id, relevance) VALUES ($1, $2, $3);', [word.text, topic.targetThread, word.relevance])
                                        .catch((err) => console.log(err));                                    
                                    })
                                ),
                                Promise.all(
                                    topic.articles.map(article => {
                                    return db.one('SELECT source_id FROM sources WHERE name = $1;', article.source)
                                        .then(source => {
                                            return db.none('INSERT INTO articles (thread_id, title, description, url, age, source_id, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7);',[topic.targetThread, article.title, article.description, article.url, article.age, source.source_id, article.urlToImage])
                                            .catch((err) => console.log(err));                                        
                                        })
                                    })
                                )
                            ])
                        }),
    
                        schemas.newThreadSchema.map(i => {
                            return db.one('INSERT INTO threads (score) VALUES ($1) RETURNING thread_id;', parsedTopics[i].score)
                                .then((thread) => {
                                    Promise.all([
                                        parsedTopics[i].articles.map(article => {
                                            console.log('ARTICLE', article);
                                            return db.any('SELECT url FROM articles WHERE url = $1;', article.url)
                                                .then(res => {
                                                    console.log(res);
                                                    if (res.length === 0) {
                                                        return db.one('SELECT source_id FROM sources WHERE name = $1;', article.source)
                                                            .then((source) => {
                                                                return db.none('INSERT INTO articles (thread_id, title, description, url, age, source_id, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7);',[thread.thread_id, article.title, article.description, article.url, article.age, source.source_id, article.urlToImage])
                                                            })
                                                            .catch((err) => console.log(err));                                        
                                                    }
                                                    else{ 
                                                        return db.none('UPDATE articles SET age = 0 WHERE url = $1;', res.url)
                                                            .catch((err) => console.log(err));                                        
                                                    }
                                                })
                                            }),
                                        parsedTopics[i].keywords.map(keyword => {
                                            return db.none('INSERT INTO keywords (word, thread_id, relevance) VALUES ($1, $2, $3);', [keyword.text, thread.thread_id, keyword.relevance])
                                        })
                                    ])
                                })
                                .catch((err) => console.log(err));                        
                            })
                    ])
                    .then(() => {
                        Promise.all([
                            db.none('UPDATE articles SET age = age + 1;')
                            .catch((err) => console.log(err)),
                            db.none('UPDATE threads SET score = score * $1;', [threadDecay])
                            .catch((err) => console.log(err)),
                            db.none('UPDATE keywords SET relevance = relevance * $1;', [keywordDecay])
                            .catch((err) => console.log(err))
                        ])
                    })
                    .then(() => {
                        db.none('DELETE FROM articles WHERE age >= $1;', articlesThreshold)
                        .catch((err) => console.log(err));
                        db.none('DELETE FROM keywords WHERE relevance <= $1;', keywordsThreshold)
                        .catch((err) => console.log(err));
                        console.log('***** Database update complete *****') 
                    })
                    .catch((err) => console.log(err));
                })
            })
    // }, 4000)
}
        

module.exports = { fetchTopicsAndMerge, getKeywords, updateThreads, boostKeywords, addNewKeywords, addNewThread };
