const {fetchTopicsAndMerge, getKeywords} = require('../../lambda-functions/mergeTopics-2/index'); 
const expect = require('chai').expect;
const dbConfig = require('../../lambda-functions/mergeTopics-2/config');
const pgp = require('pg-promise');
const db = pgp(dbConfig)({promiseLib: Promise});

describe('#mergetopicsWithThreads', () => {
  beforeEach(() => {
    db.none(`INSERT INTO threads (score) VALUES 
    (0.2);`)
    .then(() => {
      db.none(`INSERT INTO keywords (word, thread_id, relevance) VALUES
      ('Arthur', 1, 0.8),
      ('Hey', 1, 0.22),
      ('Like', 1, 0.1);`);
    })
    db.none(`INSERT INTO sources (name) VALUES
    ('abc-news-au'),
    ('al-jazeera-english'),
    ('associated-press'),
    ('bbc-news'),
    ('cnn'),
    ('the-guardian-uk'),
    ('the-huffington-post'),
    ('independent'),
    ('metro'),
    ('mirror'),
    ('newsweek'),
    ('new-york-magazine'),
    ('the-new-york-times'),
    ('reuters'),
    ('the-telegraph'),
    ('usa-today'),
    ('the-washington-post');`)
  });
  describe('#getKeywords', () => {
    it('returns an array of keyword objects', () => {
      const keywords = [
        {word: 'Arthur', thread_id: 1},
        {word: 'Hey', thread_id: 1},
        {word: 'Like', thread_id: 1}
      ]
      getKeywords()
      .then(data => {
        expect(data).to.eql(keywords);
      })
    });
  });
});