const utils = require('./utils');
const topicData = require('./spec/topicData');
// const { threadTextAndId2 } = require('./spec/threadData2');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const pgp = require('pg-promise')({ promiseLib: Promise });
const bucket = 'topic-storage';
const dbConfig = require('./config');
const db = pgp(dbConfig);
const keywordDecay = 0.6;
const keywordsThreshold = 0.12;
const articlesThreshold = 174;
const threadDecay = 0.5;

const mergeTopicsWithThreads = (topics, threadKeywords) => {
    const allTopicsKeywords = Object.keys(topics).map(topic => topics[topic].keywords);
    const keywordSets = utils.getKeywordSets(allTopicsKeywords);
    const schemas = utils.formulateInsertionSchema(keywordSets, threadKeywords);
    schemas.insertionSchema.articles = topics[schemas.insertionSchema.fromTopic].articles;
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

console.log(typeof s3.getObject);

const replaceColons = (str) => {
    return str.replace(/:/g, '-');
}

const fetchTopicsAndMerge = (event, context, callback) => {
    const lastCreatedFile = replaceColons(event.Records[0].s3.object.key);
    console.log('LAST CREATED FILE', lastCreatedFile);
    db.any('SELECT word, thread_id FROM keywords;')
        .then(threadKeywords => {
            let newSchema;
            let newTopics
            console.log('THREADKEYWORDS', threadKeywords);
            s3.getObject({ Bucket: bucket, Key: lastCreatedFile }, (err, topics) => {
                console.log('TOPICS1:', topics);
                if (err) console.log('THIS IS AN S3 ERROR:', err);
                console.log('TOPICS', topics)
                const schemas = mergeTopicsWithThreads(topics, threadKeywords);
                if (schemas.insertionSchema.length === 0) return { newThreadSchema: schemas.newThreadSchema, topics: topics };
                schemas.insertionSchema.forEach(topic => {
                    console.log('TOPIC', topic)
                    const threadScore = topics[topic.targetThread].score;
                    db.none('UPDATE threads SET score = score + $1 WHERE thread_id = $2;', [threadScore, topic.targetThread])
                        .then(() => {
                            console.log(`Thread ${topic.targetThread} score updated`);
                        })
                        .catch(console.error);
                    topic.boostKeywords.forEach(word => {
                        db.none('UPDATE keywords SET relevance = relevance + $1 WHERE thread_id = $2 AND word = $3;', [word.relevance, topic.targetThread, word.text])
                            .catch(console.error);
                    });
                    topic.newKeywords.forEach(word => {
                        db.none('INSERT INTO keywords (word, thread_id, relevance) VALUES ($1, $2, $3);', [word.text, topic.targetThread, word.relevance])
                            .catch(console.error);
                    });
                    topic.articles.forEach(article => {
                        db.one('SELECT source_id FROM sources WHERE name = $1;', article.source)
                            .then(source => {
                                db.none('INSERT INTO articles (thread_id, title, description, url, age, source_id, img_url) VALUES ($1, $2, $3, $4, $5, $6, $7);'[topic.targetThread, article.title, article.description, article.url, article.age, source.source_id, article.urlToImage])
                                    .catch(console.error);
                            })
                    });
                });
                newTopics = topics;
                newSchema = schemas.newThreadSchema;
            })
            return { newThreadSchema: newSchema, topics: newTopics };
        })
        .then((newData) => {
            console.log('SCHEMA*******************',newData.newThreadSchema);
            console.log('TOPICS*******************', newData.topics);
            console.log('OUTPUT*******************', newData.topics.output);
            console.log('DATA*******************', newData);
            newData.newThreadSchema.forEach(i => {
                db.one('INSERT INTO threads (score) VALUES ($1) RETURNING thread_id;', newData.topics[i].score)
                    .then((thread) => {
                        newData.topics[i].articles.forEach(article => {
                            db.one('SELECT source_id FROM sources WHERE name = $1;', article.source)
                                .then((source) => {
                                    db.none('INSERT INTO articles (thread_id, title, description, url, age, source_id, img_url) VALUES ($1, $2, $3, $4, $5, $6, $7);'[thread.thread_id, article.title, article.description, article.url, article.age, source.source_id, article.urlToImage])
                                })
                                .catch(console.error);
                        })
                        newData.topics[i].keywords.forEach(keyword => {
                            db.none('INSERT INTO keywords (word, thread_id, relevance) VALUES ($1, $2, $3);', [keyword.text, thread.thread_id, keyword.relevance])
                        })

                    })
                    .catch(console.error);
            })
        })
        .then(() => {
            //decay according to modifier
            db.none('UPDATE articles SET age = age + 1;')
                .catch(console.error);
            db.none('UPDATE threads SET score = score * $1;', [threadDecay])
                .catch(console.error);
            db.none('UPDATE keywords SET relevance = relevance * $1;', [keywordDecay])
                .catch(console.error);
        })
        .then(() => {
            //delete according to threshold
            db.none('DELETE FROM articles WHERE age >= $1;', articlesThreshold)
                .catch(console.error);
            db.none('DELETE FROM keywords WHERE relevance <= $1;', keywordsThreshold)
                .catch(console.error);
        })
        .catch(console.error);
}



module.exports = { fetchTopicsAndMerge, getKeywords, updateThreads, boostKeywords, addNewKeywords, addNewThread };
