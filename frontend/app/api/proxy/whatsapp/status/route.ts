import { NextResponse } from 'next/server';

export async function GET() {
    const waUrl = process.env.WA_API_URL || 'http://localhost:7002';
    const resp = await fetch(`${waUrl}/status`);
    const data = await resp.json();
    return NextResponse.json(data);
}
