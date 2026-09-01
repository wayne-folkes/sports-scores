'use strict';

const { BedrockRuntimeClient, ConverseCommand } = require('@aws-sdk/client-bedrock-runtime');
const { awsCredentialsProvider } = require('@vercel/functions/oidc');

const region = process.env.SUMMARY_AWS_REGION || 'us-east-1';
const modelFinal = process.env.SUMMARY_MODEL_FINAL || 'zai.glm-5';
const modelLive = process.env.SUMMARY_MODEL_LIVE || 'us.anthropic.claude-haiku-4-5-20251001-v1:0';

let cachedClient = null;

function getClient() {
  if (cachedClient) return cachedClient;

  const options = { region };
  // VERCEL_OIDC_TOKEN is only an env var locally/at build; at runtime the
  // provider fetches the token from the request context itself.
  if (process.env.AWS_ROLE_ARN) {
    options.credentials = awsCredentialsProvider({ roleArn: process.env.AWS_ROLE_ARN });
  }

  cachedClient = new BedrockRuntimeClient(options);
  return cachedClient;
}

function selectModelAndPrompt(gameState) {
  if (gameState === 'final' || gameState === 'post') {
    return {
      model: modelFinal,
      systemPrompt:
        'You are a sports desk writer. Provide a concise 3-4 sentence recap of this game based on the provided statistics. Never invent stats not present in the input.',
    };
  }
  if (gameState === 'in') {
    return {
      model: modelLive,
      systemPrompt:
        'You are a sports desk writer covering a live game. Provide a 2-3 sentence "state of the game" update based on the current statistics. Never invent stats not present in the input.',
    };
  }
  return {
    model: modelLive,
    systemPrompt:
      'You are a sports desk writer. Provide a 1-2 sentence preview of this upcoming game. Never invent stats not present in the input.',
  };
}

async function generateSummary(normalizedBoxscore, gameState) {
  const client = getClient();
  const { model, systemPrompt } = selectModelAndPrompt(gameState);

  const response = await client.send(
    new ConverseCommand({
      modelId: model,
      system: [{ text: systemPrompt }],
      messages: [{ role: 'user', content: [{ text: JSON.stringify(normalizedBoxscore) }] }],
      inferenceConfig: { maxTokens: 1024 },
    })
  );

  const summary = (response.output?.message?.content || [])
    .filter((block) => block.text)
    .map((block) => block.text)
    .join('');

  return { summary, model };
}

module.exports = { generateSummary, selectModelAndPrompt };
