'use strict';

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { awsCredentialsProvider } = require('@vercel/functions/oidc');

const tableName = process.env.SUMMARY_TABLE || 'sports-scores-summaries';
const region = process.env.SUMMARY_AWS_REGION || 'us-east-1';

let docClient = null;

async function getDocClient() {
  if (docClient) return docClient;

  let credentialsOption = undefined;

  if (process.env.AWS_ROLE_ARN && process.env.VERCEL_OIDC_TOKEN) {
    credentialsOption = await awsCredentialsProvider({ roleArn: process.env.AWS_ROLE_ARN });
  }

  const dynamoDbClient = new DynamoDBClient({
    region,
    ...(credentialsOption && { credentials: credentialsOption }),
  });

  docClient = DynamoDBDocumentClient.from(dynamoDbClient);
  return docClient;
}

async function getSummary(cacheKey) {
  const client = await getDocClient();
  const command = new GetCommand({
    TableName: tableName,
    Key: { cacheKey },
  });

  try {
    const response = await client.send(command);
    return response.Item || null;
  } catch (error) {
    console.error('Error getting summary from DynamoDB:', error);
    return null;
  }
}

async function putSummary(cacheKey, record) {
  const client = await getDocClient();
  const expiresAt = Math.floor(Date.now() / 1000) + 86400; // 1 day from now

  const command = new PutCommand({
    TableName: tableName,
    Item: {
      ...record,
      cacheKey,
      expiresAt,
    },
  });

  try {
    await client.send(command);
  } catch (error) {
    console.error('Error putting summary to DynamoDB:', error);
  }
}

async function tryLock(cacheKey) {
  const client = await getDocClient();
  const lockKey = `${cacheKey}#lock`;
  const expiresAt = Math.floor(Date.now() / 1000) + 60; // 60 seconds from now
  const now = Math.floor(Date.now() / 1000);

  const command = new PutCommand({
    TableName: tableName,
    Item: {
      cacheKey: lockKey,
      expiresAt,
    },
    ConditionExpression: 'attribute_not_exists(cacheKey) OR expiresAt < :now',
    ExpressionAttributeValues: {
      ':now': now,
    },
  });

  try {
    await client.send(command);
    return true;
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      return false;
    }
    console.error('Error acquiring lock:', error);
    return false;
  }
}

module.exports = { getSummary, putSummary, tryLock };
