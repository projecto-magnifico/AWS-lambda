const {prepareTopics} = require('./lambda-functions/prepareTopics-1');
const {fetchTopicsAndMerge} = require('./lambda-functions/mergeTopics-2');
const testLambda = require('./lambda-functions/test-lambda');
const topicData = require('./lambda-functions/mergeTopics-2/spec/topicData')

module.exports= {prepareTopics, fetchTopicsAndMerge, testLambda}