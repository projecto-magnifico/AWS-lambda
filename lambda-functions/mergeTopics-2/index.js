const { getKeywordSets, formulateInsertionSchema } = require('./utils');
const topicData = require('./spec/topicData');
const { threadTextAndId2 } = require('./spec/threadData2');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const pgp = require('pg-promise');
const bucket = 'topic-storage';
const dbConfig = require('./config/db.config.js');
const db = pgp(dbConfig);


const mergeTopicsWithThreads = (topics, threads) => {
    const allTopicsKeywords = Object.keys(topics).map(topic => topics[topic].keywords);
    const keywordSets = getKeywordSets(allTopicsKeywords);
    const {newThreadSchema, insertionSchema} = formulateInsertionSchema(keywordSets, threads);
    console.log(newThreadSchema);
    console.log(insertionSchema);
    insertionSchema.articles = topics[insertionSchema.fromTopic].articles;
    return {insertionSchema, newThreadSchema};
};

module.exports = {mergeTopicsWithThreads};