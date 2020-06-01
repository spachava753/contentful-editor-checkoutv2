'use strict';

const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.changeState = (event, context, callback) => {
  const requestBody = JSON.parse(event.body);
  console.log(`event body: ${JSON.stringify(requestBody)}`);
  const entryId = requestBody.entryId;

  console.log(`validating body`);
  if (typeof entryId !== 'string') {
    console.error('Validation Failed');
    callback(new Error('Couldn\'t submit entry because of validation errors.'));
    return;
  }
  console.log(`validated body`);

  submitEntryState(requestBody)
    .then(() => {
      callback(null, {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*', // <-- Add your specific origin here
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({
          message: `Successfully submitted entry with id ${entryId}`,
          input: event,
        })
      });
    })
    .catch(err => {
      console.log(err);
      callback(null, {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*', // <-- Add your specific origin here
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({
          message: `Unable to submit entry with id ${entryId}`,
          input: event,
        })
      })
    });

};

module.exports.getState = (event, context, callback) => {
  const entryId = event.pathParameters.entryId;
  console.log(`entryId param: ${entryId}`);

  console.log(`validating body`);
  if (typeof entryId !== 'string') {
    console.error(`Validation Failed. Type is ${typeof entryId}`);
    callback(new Error(`Couldn't submit entry because of validation errors.`));
    return;
  }
  console.log(`validated body`);

  getEntryState(entryId)
    .then(result => {
      console.log(`result returned was ${result}`);
      const response = {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*', // <-- Add your specific origin here
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify(result.Item),
      };
      callback(null, response);
    })
    .catch(error => {
      console.error(error);
      callback(new Error('Couldn\'t fetch candidate.'));
    });
};

const getEntryState = (entryId) => {
  console.log('Getting entry state');
  const itemInfo = {
    TableName: process.env.TABLE,
    Key: {
      entryId: entryId
    }
  };
  return dynamoDb.get(itemInfo).promise();
};

const submitEntryState = (entry) => {
  console.log('Submitting entry state');
  const itemInfo = {
    TableName: process.env.TABLE,
    Item: entry,
  };
  return dynamoDb.put(itemInfo).promise()
    .then();
};
