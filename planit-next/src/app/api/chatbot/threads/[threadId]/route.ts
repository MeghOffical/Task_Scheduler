import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAuthenticatedUserId } from '@/lib/auth-utils';
import { ChatThread } from '@/models';

interface Params {
  threadId: string;
}

export async function GET(
  _request: Request,
  { params }: { params: Params }
) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const thread = await ChatThread.findOne({ threadId: params.threadId, userId }).lean();
    if (!thread) {
      return NextResponse.json({ message: 'Thread not found' }, { status: 404 });
    }

    return NextResponse.json({
      threadId: thread.threadId,
      title: thread.title,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
      messages: thread.messages?.map((message: any) => ({
        role: message.role,
        content: message.content,
        createdAt: message.createdAt,
      })) ?? [],
    });
  } catch (error) {
    console.error('Error loading chatbot thread:', error);
    return NextResponse.json({ message: 'Failed to load thread' }, { status: 500 });
  }
}
