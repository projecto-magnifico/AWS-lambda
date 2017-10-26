const _ = require('underscore');

const { getSets } = require('../helpers');

const getKeywordSets = (topicsKeywords) => {
    const keywordSets = topicsKeywords.map(topicKeywords => {
        const keywordsRelevanceArray = topicKeywords.map(topicKeyword => {
            let topicKeywordArray = getSets(topicKeyword.text);
            // console.log(topicKeywordArray);
            const splitKeywordsWithRelevance = topicKeywordArray.map(topicKeywordWord => {
                return {
                    text : topicKeywordWord.toLowerCase(),
                    relevance : topicKeywordWord === topicKeyword.text ? topicKeyword.relevance : topicKeyword.relevance / 2
                };
            });
            // console.log(splitKeywordsWithRelevance);
            
            return splitKeywordsWithRelevance;
        });
        // console.log('********')
        let unique = _.uniq(_.flatten(keywordsRelevanceArray), false, extractKeywords);
        // console.log(unique);
        return unique;
    });
    return keywordSets;
};

function extractKeywords (object) {
    return object.text;
}

const formulateInsertionSchema = ( topicKeywordSets, threadKeywordSets ) => {
    let insertionSchema = [];
    let newThreadSchema = [];
    topicKeywordSets.forEach((topicKeywords,i) => {
        newThreadSchema.push(i);
        threadKeywordSets.forEach((threadKeywords) => {
            let topicKeywordsText = _.pluck(topicKeywords,'text');
            let threadKeywordsText = _.pluck(threadKeywords,'text');
            let intersection = _.uniq(_.intersection(topicKeywordsText,threadKeywordsText));
            let difference = _.uniq(_.difference(topicKeywordsText,threadKeywordsText));
            if (intersection.length > 3) {
                let intersectedWordObjects = topicKeywordSets[i].filter(wordObject => {
                    return _.contains(intersection, wordObject.text);
                });
                let differentWordObjects = topicKeywordSets[i].filter(wordObject => {
                    return _.contains(difference, wordObject.text);
                });
                insertionSchema.push({
                    target: threadKeywords[0].id,
                    boostKeywords : intersectedWordObjects,
                    newKeywords : differentWordObjects
                });
                newThreadSchema = _.without(newThreadSchema, i);
            }
        });
    });
    return {newThreadSchema, insertionSchema};
};

module.exports = { getKeywordSets, formulateInsertionSchema };