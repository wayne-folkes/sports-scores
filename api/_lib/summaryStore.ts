import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { awsCredentialsProvider } from '@vercel/functions/oidc';
import type { SummaryGameState } from './types';

// What is cached per game state; the lock rows share the table but only carry
// cacheKey + expiresAt.
export interface SummaryRecord {
  summary: string;
  gameState: SummaryGameState;
  model: string;
  generatedAt: string;
}

const tableName = process.env.SUMMARY_TABLE || 'sports-scores-summaries';
const region = process.env.SUMMARY_AWS_REGION || 'us-east-1';

let docClient: DynamoDBDocumentClient | null = null;

async function getDocClient(): Promise<DynamoDBDocumentClient> {
  if (docClient) return docClient;

  let credentialsOption: ReturnType<typeof awsCredentialsProvider> | undefined;

  // VERCEL_OIDC_TOKEN is only an env var locally/at build; at runtime the
  // provider fetches the token from the request context itself.
  if (process.env.AWS_ROLE_ARN) {
    credentialsOption = awsCredentialsProvider({ roleArn: process.env.AWS_ROLE_ARN });
  }

  const dynamoDbClient = new DynamoDBClient({
    region,
    ...(credentialsOption && { credentials: credentialsOption }),
  });

  docClient = DynamoDBDocumentClient.from(dynamoDbClient);
  return docClient;
}

export async function getSummary(cacheKey: string): Promise<SummaryRecord | null> {
  const client = await getDocClient();
  const command = new GetCommand({
    TableName: tableName,
    Key: { cacheKey },
  });

  try {
    const response = await client.send(command);
    return (response.Item as SummaryRecord | undefined) || null;
  } catch (error) {
    console.error('Error getting summary from DynamoDB:', error);
    return null;
  }
}

export async function putSummary(cacheKey: string, record: SummaryRecord): Promise<void> {
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

export async function tryLock(cacheKey: string): Promise<boolean> {
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
    if (error instanceof Error && error.name === 'ConditionalCheckFailedException') {
      return false;
    }
    console.error('Error acquiring lock:', error);
    return false;
  }
}
