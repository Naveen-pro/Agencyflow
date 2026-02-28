import { NextRequest } from 'next/server';

export async function GET(
    req: NextRequest,
    { params }: { params: { campaignId: string } }
) {
    const waUrl = process.env.WA_API_URL || 'http://localhost:7002';
    const waKey = process.env.WA_API_KEY!;

    const upstream = await fetch(`${waUrl}/stream/${params.campaignId}`, {
        headers: { 'x-api-key': waKey, 'Accept': 'text/event-stream' },
    });

    return new Response(upstream.body, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
        },
    });
}
