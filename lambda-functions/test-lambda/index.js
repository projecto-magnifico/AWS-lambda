const AWS = require('aws-sdk');
const s3 = new AWS.S3();

const testLambda = () => {
  s3.getObject({Bucket: 'topic-data', Key: '2017-11-01T09:31:45.043Z.json'}, (err, topics) => {
    console.log('TOPICS:',topics);
    if(err) console.error(err);
  });
}

module.exports = testLambda;