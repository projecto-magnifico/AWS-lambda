'use strict';

const axios = require('axios');
const _ = require('lodash');
const stringSimilarity = require('string-similarity');
const fs = require('fs');
const path = require('path');
const threshhold = 0.45;
const htmlToText = require('html-to-text');
const Promise = require("bluebird");
const nlu = require("./config/watson.config");
const promisify = require("es6-promisify");
const async = require("async");
const AWS = require('aws-sdk');
const {putObjectToS3} = require('./helpers'); 


const {mapArticles, graphArticleLinks, groupArticles,addDataForWatson} = require('./utils/createTopics');
const { newsApi } = require('./config/api.config.js');

const prepareTopics = () => {
    const sourceKeys = Object.keys(newsApi.sources);
    Promise.map(sourceKeys, (sourceKey) => {
        return axios.get(`${newsApi.url}?source=${newsApi.sources[sourceKey]}&sortBy=top&apiKey=${newsApi.apiKey}`);
    })
    .then(sources => {  
        const mappedArticles = mapArticles(sources);
        const graphedCodes = graphArticleLinks(mappedArticles);
        const code1 = Object.keys(graphedCodes)[0];
        const groupedArticles = groupArticles(graphedCodes, mappedArticles, [code1]);
        
        addDataForWatson(groupedArticles).then(res => {
            const fileName = new Date().toISOString(); 
            putObjectToS3('topic-storage', `${fileName}.json`, JSON.stringify(res, null, 2))
            // fs.appendFile('threads.json', JSON.stringify(res,null,2), "utf8", (err) => {
            //             if (err) throw err;
            // })
        })
        .catch(err => {
            if (err) console.log("err");
        })
    }).catch(err => console.log("You've had an error!"));
}

module.exports= {prepareTopics};
