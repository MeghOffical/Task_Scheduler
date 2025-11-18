import { NextResponse } from 'next/server';

const notImplemented = NextResponse.json(
	{ error: 'chatbot-python streaming endpoint not implemented' },
	{ status: 501 },
);

export function GET() {
	return notImplemented;
}

export function POST() {
	return notImplemented;
}
