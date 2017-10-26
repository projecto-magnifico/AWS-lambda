const { getKeywordSets, formulateInsertionSchema } = require('./utils');
const topicData = require('./spec/topicData');
const { threadTextAndId2 } = require('./spec/threadData2');

const mergeTopicsWithThreads = (topics) => {

    const allTopicsKeywords = Object.keys(topics).map(topic => topics[topic].keywords);
    const keywordSets = getKeywordSets(allTopicsKeywords);
    const schema = formulateInsertionSchema(keywordSets, threadTextAndId2);
    console.log(schema.newThreadSchema);
   console.log(schema.insertionSchema)
    //return insertionSchema;
};

module.exports = {mergeTopicsWithThreads};