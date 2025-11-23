import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAuthenticatedUserId } from '@/lib/auth-utils';
import { ChatThread } from '@/models';
import { generateAssistantMessage } from '@/lib/chatbot-service';

interface Payload {
  threadId?: string;
  message: string;
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as Payload;
    const userMessage = body?.message?.trim();
    if (!userMessage) {
      return NextResponse.json({ message: 'Message is required' }, { status: 400 });
    }

    await dbConnect();

    let thread: any = body.threadId
      ? await ChatThread.findOne({ threadId: body.threadId, userId })
      : null;

    if (!thread) {
      // --- FIX: Cast the new Mongoose Document to 'any' to bypass TS compiler complexity ---
      thread = new ChatThread({ userId, title: 'New chat', messages: [] }) as any;
    }

    // Use the enhanced service with tool support
    const result = await generateAssistantMessage(
      thread?.messages ?? [],
      userMessage,
      userId
    );

    const assistantReply = result.response;

    thread.messages.push({ role: 'user', content: userMessage, createdAt: new Date() });
    
    // Store tool calls if any
    if (result.toolCalls && result.toolCalls.length > 0) {
      for (const toolCall of result.toolCalls) {
        thread.messages.push({
          role: 'tool',
          content: JSON.stringify(toolCall),
          name: toolCall.name,
          createdAt: new Date(),
        });
      }
    }
    
    thread.messages.push({ role: 'assistant', content: assistantReply, createdAt: new Date() });

    if (!thread.title || thread.title === 'New chat') {
      thread.title = userMessage.slice(0, 60) || 'New chat';
    }

    await thread.save();

    return NextResponse.json({
      threadId: thread.threadId,
      title: thread.title,
      messages: thread.messages.map((message: any) => ({
        role: message.role,
        content: message.content,
        name: message.name,
        createdAt: message.createdAt,
      })),
      assistantMessage: assistantReply,
    });
  } catch (error) {
    console.error('Error sending chatbot message:', error);
    return NextResponse.json({ message: 'Failed to send message' }, { status: 500 });
  }
}