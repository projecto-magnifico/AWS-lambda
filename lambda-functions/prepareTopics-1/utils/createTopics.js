const {
    concatArrays,
    getStringSimilarity,
    createEmptyGraph,
    filterGraphOrphans,
    sum
} = require('../helpers');
const nlu = require("../config/watson.config");
const promisify = require("es6-promisify");

//mapArticles takes the array of JSONs produced by the API call and extracts the articles, giving them some extra properties to be used later, and reduces them into a flat array.
const mapArticles = sources => {
    console.log(concatArrays)
    const mappedSources = sources.map((source, sourceIndex) => {
        return source.data.articles.map((article, articleIndex) => {
            return Object.assign({}, article, {
                code: (sourceIndex * 10 + articleIndex).toString(),
                source: source.data.source,
                score: source.data.articles.length - articleIndex,
                age: 0,
            })
        })
    })
    return mappedSources.reduce(concatArrays);
};

//graphArticleLinks creates a reference graph from the articles by comparing their headlines. Each article headline is compared with every other, and if the similarities meet a threshold, a link is created between the nodes. Finally, it filters out any orphans - stories that haven't found any related stories through the alogrithm
const graphArticleLinks = articles => {
    const headlineSimilarityThreshold = 0.475;

    const graph = createEmptyGraph(articles.length);
    for (let i = 0; i < articles.length; i++) {
        for (let j = i + 1; j < articles.length; j++) {
            let headlineSimilarity = getStringSimilarity(articles[i].title, articles[j].title);
            if (headlineSimilarity > headlineSimilarityThreshold) {
                graph[articles[i].code].push(articles[j].code);
                graph[articles[j].code].push(articles[i].code);
            }
        }
    }
    return filterGraphOrphans(graph);
}

//groupArticles takes the information from the graph of article relationships and applies this to the articles themselves. It creates an object with an indexed array of collections of linked stories, by a breadth-first search algorithm that extrapolates all links between articles. The index is for reference only, it doesn't denote any sort of precedence.
const groupArticles = (graph, articles, queue, collections = {
    1: []
}, iteration = 1, visited = []) => {
    if (collections[iteration] === undefined) collections[iteration] = [];

    const code = queue[0];
    visited.push(code);
    collections[iteration].push(articles[code]);
    queue = queue.concat(graph[code]);

    queue = queue.filter(elem => !visited.includes(elem));

    if (queue.length > 0) {
        return groupArticles(graph, articles, queue, collections, iteration, visited);
    } else {
        visited.forEach(visit => delete graph[visit]);
        const newKeys = Object.keys(graph);
        if (newKeys.length === 0) {
            return collections;
        } else {
            const nextKey = newKeys[0];
            return groupArticles(graph, articles, [nextKey], collections, iteration + 1, [])
        }
    }
}

const addDataForWatson = (topics) => {
    return new Promise((resolve, reject) => {

        if (!topics) reject();

        Promise.all(Object.keys(topics).map((topicKey) => {
            let string = getStringForWatson(topics[topicKey]);
            return getKeywords(string);
        }))
            .then((keywordCollections) => {

                resolve(keywordCollections.reduce((acc, keywordCollection, i) => {

                    acc[i] = {
                        articles: topics[i + 1],
                        keywords: keywordCollection.keywords,
                        score: getScore(topics[i + 1])
                    }
                    return acc;
                }, {}))
            })
            .catch(err => console.log(err))
    })
}


const getStringForWatson = (stories) => {

    return stories.reduce((acc, currentStory) => {
        let currentTitle = currentStory.title;
        let currentDescription = currentStory.description;
        acc += `${currentTitle} ${currentDescription} `;
        return acc;
    }, "");

}

const getKeywords = (string) => {
    return new Promise((resolve, reject) => {
        if (!string) reject()

        nlu.analyze({
            'html': string,
            'features': {
                'concepts': {},
                'keywords': {}
            }
        }, function (err, response) {
            if (err) throw err;
            resolve(response)
        })
    })
}
//collate all of the story headlines and descriptions into one big string for watson

const getScore = (articles) => {
    return articles.map(article => article.score).reduce(sum);
}

module.exports = {
    mapArticles,
    graphArticleLinks,
    groupArticles,
    addDataForWatson,
}