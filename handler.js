const {prepareTopics} = require('./lambda-functions/prepareTopics-1');
const {fetchTopicsAndMerge} = require('./lambda-functions/mergeTopics-2');
const topicData = require('./lambda-functions/mergeTopics-2/spec/topicData')

module.exports= {prepareTopics, fetchTopicsAndMerge}