import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAuthenticatedUserId } from '@/lib/auth-utils';
import { ChatThread } from '@/models';

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const threads = await ChatThread.find({ userId })
      .sort({ updatedAt: -1 })
      .lean();

    const payload = threads.map((thread: any) => ({
      threadId: thread.threadId,
      title: thread.title,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
      messageCount: thread.messages?.length ?? 0,
    }));

    return NextResponse.json(payload);
  } catch (error) {
    console.error('Error fetching chatbot threads:', error);
    return NextResponse.json({ message: 'Failed to load threads' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const title = typeof body?.title === 'string' ? body.title.trim() : '';

    await dbConnect();

    const thread = await ChatThread.create({
      userId,
      title: title || 'New chat',
    });

    return NextResponse.json({
      threadId: thread.threadId,
      title: thread.title,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
      messageCount: 0,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating chatbot thread:', error);
    return NextResponse.json({ message: 'Failed to create thread' }, { status: 500 });
  }
}
