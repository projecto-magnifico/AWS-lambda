const NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');
var nlu = new NaturalLanguageUnderstandingV1({
    username: '9dcbde29-933b-4955-aa18-025681cee1da',
    password: '1ns5rCS5KK1x',
    version_date: NaturalLanguageUnderstandingV1.VERSION_DATE_2017_02_27
})

module.exports = nlu;