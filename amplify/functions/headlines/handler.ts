import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { buildGeneralHeadlines } from './general-headlines';
import { buildTeamHeadlines } from './team-headlines';

const corsHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
};

export const handler = async (
    event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
    const method = event.requestContext?.http?.method ?? 'GET';

    if (method === 'OPTIONS') {
        return {
            statusCode: 204,
            headers: {
                ...corsHeaders,
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'content-type, authorization',
            },
            body: '',
        };
    }

    if (method !== 'GET') {
        return {
            statusCode: 405,
            headers: corsHeaders,
            body: JSON.stringify({ headlines: [] }),
        };
    }

    const team = event.queryStringParameters?.team?.trim() ?? '';
    const sport = event.queryStringParameters?.sport?.trim() ?? '';

    try {
        const result =
            team.length > 0
                ? await buildTeamHeadlines(team, sport || 'americanfootball_nfl')
                : await buildGeneralHeadlines();

        console.log('headlines', {
            team: team || null,
            count: result.headlines.length,
            source: result.source,
        });

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({ headlines: result.headlines }),
        };
    } catch (err) {
        console.error('headlines handler error', err);
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({ headlines: [] }),
        };
    }
};
