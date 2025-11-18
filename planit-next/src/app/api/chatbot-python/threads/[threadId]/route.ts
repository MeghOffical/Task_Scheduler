import { NextResponse } from 'next/server';

const notImplemented = NextResponse.json(
	{ error: 'chatbot-python thread detail endpoint not implemented' },
	{ status: 501 },
);

export function GET() {
	return notImplemented;
}

export function DELETE() {
	return notImplemented;
}

export function PATCH() {
	return notImplemented;
}
