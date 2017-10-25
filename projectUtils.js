const axios = require('axios');
const _ = require('underscore');
const fs = require('fs-extra');



// nlu.analyze({
//     'html': ,
//     'features': {
//         'concepts': {},
//         'keywords': {}
//     }
// }, function (err, response) {
//     if (err) console.error;
//     console.log(response)
// })


// Promise.all([
// //         //BBC NEWS
// //         // axios.get('https://newsapi.org/v1/articles?source=bbc-news&sortBy=top&apiKey=3c987396588c4a848a262ed47ba9d61b')
// //         //AP
// //         // axios.get('https://newsapi.org/v1/articles?source=associated-press&sortBy=top&apiKey=3c987396588c4a848a262ed47ba9d61b'),
// //         // //AL JAZEERA
// //         // axios.get('https://newsapi.org/v1/articles?source=al-jazeera-english&sortBy=top&apiKey=3c987396588c4a848a262ed47ba9d61b'),
// //         // //REUTERS
// //         // axios.get('https://newsapi.org/v1/articles?source=reuters&sortBy=top&apiKey=3c987396588c4a848a262ed47ba9d61b'),
// //         // //WASHINGTON POST
// //         // axios.get('https://newsapi.org/v1/articles?source=the-washington-post&sortBy=top&apiKey=3c987396588c4a848a262ed47ba9d61b'),
// //         //GUARDIAN UK
//         axios.get('https://newsapi.org/v1/articles?source=the-guardian-uk&sortBy=top&apiKey=3c987396588c4a848a262ed47ba9d61b'),
// //         //INDEPENDENT UK
//         axios.get('https://newsapi.org/v1/articles?source=independent&sortBy=top&apiKey=3c987396588c4a848a262ed47ba9d61b')

//     ])
//     .then(info => {
//         countTitleDescWords(info);
//         // countSimilarStrings(info);
//     })
//     .catch(err => console.log(err));

// const countTitleDescWords = info => {
//     info.forEach(source => {
//         let titleDesc = '';
//         source.data.articles.forEach(article => {

//             let titleDesc = "";
//             titleDesc += article.title + " " + article.description;
//             nlu.analyze({
//                 'html': titleDesc,
//                 'features': {
//                     'concepts': {},
//                     'keywords': {}
//                 }
//             }, function (err, response) {
//                 // console.log(response);
//                 // let keywords = response.keywords;
//                 if (err) console.error;
//                     fs.appendFile('./newsData13.json', JSON.stringify(response,null,2), "utf8", (err) => {
//                         if (err) throw err;
//                 })
//             })
//         })
//     });
// }


const data =
    [{
        "author": "BBC News",
        "title": "Attacks on Afghan mosques kill scores",
        "description": "Some 60 people are killed as worshippers are targeted in two separate attacks on mosques.",
        "url": "http://www.bbc.co.uk/news/world-asia-41699320", "urlToImage": "https://ichef-1.bbci.co.uk/news/1024/cpsprodpb/B522/production/_98407364_soldiers.gif",
        "publishedAt": "2017-10-20T19:04:36Z",
        "code": "1",
        "source": "bbc-news",
        "score": 9,
        "age": 0,
        "assigned": false
    }, {
        "author": "AMIR SHAH",
        "title": "Suicide bombings in Afghanistan hit mosques, killing 63", "description":
        "KABUL, Afghanistan (AP) — Suicide bombers struck two mosques in Afghanistan during Friday prayers, a Shiite mosque in Kabul and a Sunni mosque in western Ghor province, killing at least 63 people at the end of a particularly deadly week for the troubled nation. The Afghan president issued a statement condemning both attacks and saying that country's security forces would step up the fight to \"eliminate the terrorists who target Afghans of all religions and tribes.\"",
        "url": "https://apnews.com/c6e694defb854f7f897b4224a737a270",
        "urlToImage": "",
        "publishedAt":
        "2017-10-20T21:07:43Z",
        "code": "17",
        "source": "associated-press",
        "score": 3,
        "age": 0,
        "assigned": false
    }, {
        "author": "Al Jazeera",
        "title": "Deadly attacks hit mosques in Kabul and Ghor",
        "description": "Shia mosque in Kabul and Sunni mosque in Ghor province targeted in separate incidents, claiming more than 60 lives.",
        "url": "http://www.aljazeera.com/news/2017/10/dozens-feared-dead-attacks-afghanistan-171020142936566.html",
        "urlToImage": "http://www.aljazeera.com/mritems/Images/2017/10/1/877c095c5d2946d1a4b6e7f4da3d9b48_18.jpg",
        "publishedAt": "2017-10-20T14:46:00Z",
        "code": "20",
        "source": "al-jazeera-english",
        "score": 10,
        "age": 0,
        "assigned": false
    }, {
        "author": null,
        "title": "Suicide bombers kill at least 63 people in Afghanistan mosque attacks",
        "description": "Suicide bombers strike two mosques in Afghanistan during Friday prayers, killing at least 63 people at the end of a particularly deadly week for the troubled nation.",
        "url": "http://www.abc.net.au/news/2017-10-21/suicide-bombers-kill-at-least-63-people-in-afghanistan/9072802",
        "urlToImage": "http://www.abc.net.au/news/image/8761664-1x1-700x700.jpg",
        "publishedAt": "2017-10-20T20:17:01Z",
        "code": "78",
        "source": "abc-news-au",
        "score": 2,
        "age": 0,
        "assigned": false
    }, {
        "author": "Sune Engel Rasmussen",
        "title": "Dozens killed in twin bombings of mosques in Afghanistan",
        "description": "Suicide bombings in capital Kabul and Ghor province leave at least 70 dead, the latest in a series of attacks across the country",
        "url": "https://www.theguardian.com/world/2017/oct/20/dozens-killed-in-twin-bombings-of-mosques-in-afghanistan",
        "urlToImage": "https://i.guim.co.uk/img/media/7643575f86bef422bda50d713cdddc1534f3cdd0/0_44_3501_2102/master/3501.jpg?w=1200&h=630&q=55&auto=format&usm=12&fit=crop&crop=faces%2Centropy&bm=normal&ba=bottom%2Cleft&blend64=aHR0cHM6Ly91cGxvYWRzLmd1aW0uY28udWsvMjAxNi8wNS8yNS9vdmVybGF5LWxvZ28tMTIwMC05MF9vcHQucG5n&s=4fe1a34a75f6e232da9616de1a39b433",
        "publishedAt": "2017-10-20T18:22:16Z",
        "code": "136",
        "source": "the-guardian-au",
        "score": 4,
        "age": 0,
        "assigned": false
    }]

const data2 =
    [{
        "author": null,
        "title": "Suicide bombers kill at least 63 people in Afghanistan mosque attacks",
        "description": "Suicide bombers strike two mosques in Afghanistan during Friday prayers, killing at least 63 people at the end of a particularly deadly week for the troubled nation.",
        "url": "http://www.abc.net.au/news/2017-10-21/suicide-bombers-kill-at-least-63-people-in-afghanistan/9072802",
        "urlToImage": "http://www.abc.net.au/news/image/8761664-1x1-700x700.jpg",
        "publishedAt": "2017-10-20T20:17:01Z",
        "code": "78",
        "source": "abc-news-au",
        "score": 2,
        "age": 0,
        "assigned": false
    }, {
        "author": "Sune Engel Rasmussen",
        "title": "Dozens killed in twin bombings of mosques in Afghanistan",
        "description": "Suicide bombings in capital Kabul and Ghor province leave at least 70 dead, the latest in a series of attacks across the country",
        "url": "https://www.theguardian.com/world/2017/oct/20/dozens-killed-in-twin-bombings-of-mosques-in-afghanistan",
        "urlToImage": "https://i.guim.co.uk/img/media/7643575f86bef422bda50d713cdddc1534f3cdd0/0_44_3501_2102/master/3501.jpg?w=1200&h=630&q=55&auto=format&usm=12&fit=crop&crop=faces%2Centropy&bm=normal&ba=bottom%2Cleft&blend64=aHR0cHM6Ly91cGxvYWRzLmd1aW0uY28udWsvMjAxNi8wNS8yNS9vdmVybGF5LWxvZ28tMTIwMC05MF9vcHQucG5n&s=4fe1a34a75f6e232da9616de1a39b433",
        "publishedAt": "2017-10-20T18:22:16Z",
        "code": "136",
        "source": "the-guardian-au",
        "score": 4,
        "age": 0,
        "assigned": false
    }]

const data3 =

    [{
        "author": "BBC News",
        "title": "Attacks on Afghan mosques kill scores",
        "description": "Some 60 people are killed as worshippers are targeted in two separate attacks on mosques.",
        "url": "http://www.bbc.co.uk/news/world-asia-41699320", "urlToImage": "https://ichef-1.bbci.co.uk/news/1024/cpsprodpb/B522/production/_98407364_soldiers.gif",
        "publishedAt": "2017-10-20T19:04:36Z",
        "code": "1",
        "source": "bbc-news",
        "score": 9,
        "age": 0,
        "assigned": false
    }, {
        "author": "AMIR SHAH",
        "title": "Suicide bombings in Afghanistan hit mosques, killing 63", "description":
        "KABUL, Afghanistan (AP) — Suicide bombers struck two mosques in Afghanistan during Friday prayers, a Shiite mosque in Kabul and a Sunni mosque in western Ghor province, killing at least 63 people at the end of a particularly deadly week for the troubled nation. The Afghan president issued a statement condemning both attacks and saying that country's security forces would step up the fight to \"eliminate the terrorists who target Afghans of all religions and tribes.\"",
        "url": "https://apnews.com/c6e694defb854f7f897b4224a737a270",
        "urlToImage": "",
        "publishedAt":
        "2017-10-20T21:07:43Z",
        "code": "17",
        "source": "associated-press",
        "score": 3,
        "age": 0,
        "assigned": false
    }, {
        "author": "Al Jazeera",
        "title": "Deadly attacks hit mosques in Kabul and Ghor",
        "description": "Shia mosque in Kabul and Sunni mosque in Ghor province targeted in separate incidents, claiming more than 60 lives.",
        "url": "http://www.aljazeera.com/news/2017/10/dozens-feared-dead-attacks-afghanistan-171020142936566.html",
        "urlToImage": "http://www.aljazeera.com/mritems/Images/2017/10/1/877c095c5d2946d1a4b6e7f4da3d9b48_18.jpg",
        "publishedAt": "2017-10-20T14:46:00Z",
        "code": "20",
        "source": "al-jazeera-english",
        "score": 10,
        "age": 0,
        "assigned": false
    }]


// grabStoryInfo(data);
// getTopicsObject(data3);

