import { defineBackend, defineFunction } from '@aws-amplify/backend';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { FunctionUrlAuthType, HttpMethod } from 'aws-cdk-lib/aws-lambda';

/** Defined here (not in a separate `resource.ts`) so Node ESM can resolve imports during CDK assembly. */
const headlines = defineFunction({
    name: 'headlines',
    entry: './functions/headlines/handler.ts',
    timeoutSeconds: 30,
    memoryMB: 512,
    environment: {
        HEADLINES_MODEL_ID: 'us.anthropic.claude-haiku-4-5-20251001-v1:0',
        HEADLINES_AI_ENABLED: 'true',
    },
});

const backend = defineBackend({
    headlines,
});

backend.headlines.resources.lambda.addToRolePolicy(
    new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['bedrock:InvokeModel', 'bedrock:Converse'],
        resources: ['*'],
    })
);

const headlinesUrl = backend.headlines.resources.lambda.addFunctionUrl({
    authType: FunctionUrlAuthType.NONE,
    cors: {
        allowedOrigins: ['*'],
        // CloudFormation allows only GET|PUT|HEAD|POST|PATCH|DELETE|* — not OPTIONS
        allowedMethods: [HttpMethod.GET],
    },
});

backend.addOutput({
    custom: {
        headlinesUrl: headlinesUrl.url,
    },
});
