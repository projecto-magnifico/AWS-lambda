const { getKeywordSets, formulateInsertionSchema } = require('./utils');
const topicData = require('./spec/topicData');
const { threadTextAndId2 } = require('./spec/threadData2');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const pgp = require('pg-promise');
const bucket = 'topic-storage';
const dbConfig = require('./config/db.config.js');
const db = pgp(dbConfig);


const mergeTopicsWithThreads = (topics, threadKeywords) => {
    const allTopicsKeywords = Object.keys(topics).map(topic => topics[topic].keywords);
    const keywordSets = getKeywordSets(allTopicsKeywords);
    const {newThreadSchema, insertionSchema} = formulateInsertionSchema(keywordSets, threadKeywords);
    console.log(newThreadSchema);
    console.log(insertionSchema);
    insertionSchema.articles = topics[insertionSchema.fromTopic].articles;
    return {insertionSchema, newThreadSchema};
};

const fetchTopicsAndMerge = (event, context, callback) => {
    const lastCreatedFile = event.Records[0].s3.object.key;
    db.any('SELECT word, thread_id FROM KEYWORDS;')
        .then(threadKeywords => {
            s3.getObject({Bucket: bucket, Key: lastCreatedFile}, (err, topics) => {
                if (err) reject(err);
            const {insertionSchema, newThreadSchema} = mergeTopicsWithThreads(topics, threadKeywords);
                insertionSchema.forEach(topic => {
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
                        db.none('INSERT INTO articles (thread_id, title, description, url, age, source_id, img_url) VALUES ($1, $2, $3, $4, $5, $6, $7);' [topic.targetThread, article.title, article.description, article.url, article.age, ####, article.urlToImage])
                            .catch(console.error);
                    });
                    return {newThreadSchema, topics};
                });
            })
        })
        .then(({newThreadSchema, topics}) => {
            newThreadSchema.forEach(i => {
                db.one('INSERT INTO threads (score) VALUES ($1) RETURNING thread_id;', topics[i])
                    .then((thread) => {
                        topics[i].articles.forEach(article => {
                            db.one('SELECT source_id FROM sources WHERE name = $1', article.source)
                                .then((source) => {
                                    db.none('INSERT INTO articles (thread_id, title, description, url, age, source_id, img_url) VALUES ($1, $2, $3, $4, $5, $6, $7);' [thread.thread_id, aritcle.title, aritcle.description, aritcle.url, aritcle.age, source.source_id, aritcle.urlToImage])
                                })

                        })

                    })
                    .catch(console.error); 
            })
        })
        .then(() => {
            db.any('')
        })
}



module.exports = {mergeTopicsWithThreads};