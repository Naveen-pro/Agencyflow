import { NextRequest } from 'next/server';

export async function GET(
    req: NextRequest,
    { params }: { params: { campaignId: string } }
) {
    const emailApiUrl = process.env.EMAIL_API_URL || 'http://localhost:7003';
    const emailApiKey = process.env.EMAIL_API_KEY!;

    const upstream = await fetch(
        `${emailApiUrl}/stream/${params.campaignId}`,
        {
            headers: {
                'x-api-key': emailApiKey,
                'Accept': 'text/event-stream',
                'Cache-Control': 'no-cache',
            },
        }
    );

    return new Response(upstream.body, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
        },
    });
}
