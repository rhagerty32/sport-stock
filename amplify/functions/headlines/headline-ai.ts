import {
    BedrockRuntimeClient,
    ConverseCommand,
} from '@aws-sdk/client-bedrock-runtime';
import {
    isAllowedHeadline,
    normalizeKind,
    truncateText,
    type HeadlineItem,
    type HeadlineSubjectKind,
} from './headline-utils';

const BEDROCK_TIMEOUT_MS = 10_000;
const MIN_VALID_PICKS = 4;
const TARGET_COUNT = 8;
const TITLE_MAX = 72;
const SUBJECT_MAX = 28;

export type CurateContext =
    | { mode: 'general' }
    | { mode: 'team'; teamName: string };

type AiPick = {
    index: number;
    displayTitle: string;
    excitement: number;
    kind?: HeadlineSubjectKind;
    subject?: string;
};

type AiResponse = {
    picks: AiPick[];
};

let bedrockClient: BedrockRuntimeClient | null = null;

function isAiEnabled(): boolean {
    if (process.env.HEADLINES_AI_ENABLED === 'false') return false;
    const modelId = process.env.HEADLINES_MODEL_ID?.trim();
    return Boolean(modelId);
}

function getBedrockClient(): BedrockRuntimeClient {
    if (!bedrockClient) {
        bedrockClient = new BedrockRuntimeClient({
            region: process.env.AWS_REGION ?? 'us-east-1',
        });
    }
    return bedrockClient;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('bedrock timeout')), ms);
        promise
            .then((v) => {
                clearTimeout(timer);
                resolve(v);
            })
            .catch((err) => {
                clearTimeout(timer);
                reject(err);
            });
    });
}

function buildPrompt(candidates: HeadlineItem[], context: CurateContext): string {
    const indexed = candidates.map((c, i) => ({
        index: i,
        title: c.title,
        subject: c.subject,
        kind: c.kind,
        publishedHoursAgo: c.publishedHoursAgo,
    }));

    const modeInstructions =
        context.mode === 'team'
            ? `Prioritize stories about "${context.teamName}". Pick up to ${TARGET_COUNT} headlines.`
            : `Pick ${TARGET_COUNT} headlines with variety across league, team, and player stories (NFL, NBA, college football, college basketball only).`;

    return `You are a sports news editor for a fantasy stock app. ${modeInstructions}

Rewrite each selected headline title in a punchy sports-ticker voice (active, energetic, factual). Rules:
- displayTitle must preserve facts from the original title (no invented scores, trades, injuries, or players).
- Max ${TITLE_MAX} characters per displayTitle.
- subject max ${SUBJECT_MAX} characters if you refine it.
- excitement is 1-10 (10 = most important or exciting right now).
- Only use candidate indices listed below.

Respond with JSON only, no markdown:
{"picks":[{"index":0,"displayTitle":"...","excitement":9,"kind":"team","subject":"..."}]}

Candidates:
${JSON.stringify(indexed)}`;
}

function extractJson(text: string): unknown {
    const trimmed = text.trim();
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const raw = fenced ? fenced[1].trim() : trimmed;
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start >= 0 && end > start) {
        return JSON.parse(raw.slice(start, end + 1));
    }
    return JSON.parse(raw);
}

function parseAiResponse(raw: unknown): AiPick[] {
    if (!raw || typeof raw !== 'object') return [];
    const picks = (raw as AiResponse).picks;
    if (!Array.isArray(picks)) return [];
    return picks;
}

function applyPicks(candidates: HeadlineItem[], picks: AiPick[]): HeadlineItem[] {
    const usedIndices = new Set<number>();
    const out: HeadlineItem[] = [];

    const sorted = [...picks].sort((a, b) => (b.excitement ?? 0) - (a.excitement ?? 0));

    for (const pick of sorted) {
        if (out.length >= TARGET_COUNT) break;
        const idx = pick.index;
        if (!Number.isInteger(idx) || idx < 0 || idx >= candidates.length) continue;
        if (usedIndices.has(idx)) continue;

        const source = candidates[idx];
        const displayTitle = truncateText(
            typeof pick.displayTitle === 'string' ? pick.displayTitle : source.title,
            TITLE_MAX
        );
        if (!displayTitle) continue;

        const kind = normalizeKind(pick.kind) ?? source.kind;
        const subject = truncateText(
            typeof pick.subject === 'string' && pick.subject.trim()
                ? pick.subject.trim()
                : source.subject,
            SUBJECT_MAX
        );

        const item: HeadlineItem = {
            title: displayTitle,
            url: source.url,
            kind,
            subject,
            publishedHoursAgo: source.publishedHoursAgo,
        };

        if (!isAllowedHeadline(item.subject, item.title)) continue;

        usedIndices.add(idx);
        out.push(item);
    }

    return out;
}

async function callBedrock(prompt: string): Promise<string> {
    const modelId = process.env.HEADLINES_MODEL_ID?.trim();
    if (!modelId) throw new Error('HEADLINES_MODEL_ID not set');

    const command = new ConverseCommand({
        modelId,
        messages: [
            {
                role: 'user',
                content: [{ text: prompt }],
            },
        ],
        inferenceConfig: {
            maxTokens: 2048,
            temperature: 0.35,
        },
    });

    const response = await withTimeout(getBedrockClient().send(command), BEDROCK_TIMEOUT_MS);
    const block = response.output?.message?.content?.[0];
    if (!block || !('text' in block) || typeof block.text !== 'string') {
        throw new Error('empty bedrock response');
    }
    return block.text;
}

/** Returns curated headlines or null to signal RSS-only fallback. */
export async function curateHeadlines(
    candidates: HeadlineItem[],
    context: CurateContext
): Promise<HeadlineItem[] | null> {
    if (!isAiEnabled() || candidates.length < MIN_VALID_PICKS) return null;

    try {
        const prompt = buildPrompt(candidates, context);
        const text = await callBedrock(prompt);
        const parsed = parseAiResponse(extractJson(text));
        const curated = applyPicks(candidates, parsed);
        if (curated.length < MIN_VALID_PICKS) return null;
        return curated.slice(0, TARGET_COUNT);
    } catch (err) {
        console.warn('headlines AI curation failed', err);
        return null;
    }
}
