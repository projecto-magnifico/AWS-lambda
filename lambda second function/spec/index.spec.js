const { expect } = require('chai');
const { getKeywordSets, formulateInsertionSchema } = require('../utils');
const { threadTextAndId2 } = require('../spec/threadData2');
const { topicKeywords, keywordSets } = require('../spec/formattedTestData');


describe('getKeywordSets', () => {
    it('converts an array of arrays into larger array of power set arrays', () => {
        expect(getKeywordSets(topicKeywords)).to.eql(keywordSets);
    });
});

describe('formulateInsertionSchema', () => {
    it('converts an array of arrays into', () => {
        expect(formulateInsertionSchema(keywordSets, threadTextAndId2)).to.eql([]);
    });
});



