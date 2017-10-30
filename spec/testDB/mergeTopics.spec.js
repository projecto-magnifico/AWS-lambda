const { fetchTopicsAndMerge, getKeywords, updateThreads, boostKeywords, addNewKeywords } = require('../../lambda-functions/mergeTopics-2/index');
const expect = require('chai').expect;
const dbConfig = require('../../lambda-functions/mergeTopics-2/config');
const pgp = require('pg-promise')({ promiseLib: Promise });
const db = pgp(dbConfig);

describe('#mergetopicsWithThreads', () => {
    before((done) => {
        db.none(`INSERT INTO threads (score) VALUES 
    (0.2);`)
            .then(() => {
                db.none(`INSERT INTO keywords (word, thread_id, relevance) VALUES
      ('Arthur', 1, 0.8),
      ('Hey', 1, 0.22),
      ('Like', 1, 0.1);`);
            })
            .then(done, done)
            .catch(console.error);
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
        it('returns a promise which resolves to an array of keyword objects', (done) => {
            const keywords = [
                { word: 'Arthur', thread_id: 1 },
                { word: 'Hey', thread_id: 1 },
                { word: 'Like', thread_id: 1 }
            ]
            getKeywords()
                .then(data => {
                    expect(data).to.eql(keywords);
                })
                .then(done, done)
                .catch(console.error);
        });
    });
    describe('#updateThreads', () => {
        before(() => {

        });
        it('updates the threads table and returns a promise', (done) => {
            let threadScore = 0;
            updateThreads(15, 1)
                .then(() => {
                    db.one('SELECT * FROM threads WHERE thread_id = 1')
                        .then((thread) => {
                            threadScore = thread.score;
                            expect(threadScore).to.equal('15.2');
                        })
                        .then(done, done)
                        .catch(console.error)
                })
                .catch(console.error);
        });
    });
    describe('#boostKeywords', () => {
        before(() => {
            const keywords = [{ text: 'Arthur', relevance: 0.4 }, { text: 'Like', relevance: 0.1 }, { text: 'Hey', relevance: 0.2 }]
            return boostKeywords(keywords, 1)
        })

        it('updates existing keywords and returns a promise', () => {
            return db.any('SELECT * FROM keywords') 
                .then((data) => {
                    expect(data[0].word).to.equal('Arthur');
                    expect(data[0].relevance).to.equal('1.2');                    
                })
        });
    });
    describe('#addNewKeywords', () => {
        before(() => {
            const keywords = [{text: 'James', relevance: 0.8}, {text: "Testing", relevance: 0.8}]
            return addNewKeywords(keywords, 1)
        })
        it('adds new keywords to an existing thread', () => {
            return db.any("SELECT * FROM keywords WHERE word = 'James'")
                .then(data => {
                    expect(data[0].word).to.equal('James');
                    expect(data[0].relevance).to.equal('0.8');
                })
        });
    });

});