import { getAuthenticatedUserId } from '@/lib/auth-utils';
import { ChatThread } from '@/models';
import { streamAssistantMessage } from '@/lib/chatbot-service';
import dbConnect from '@/lib/db';

interface Payload {
  threadId?: string;
  message: string;
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = (await request.json()) as Payload;
    const userMessage = body?.message?.trim();
    if (!userMessage) {
      return new Response('Message is required', { status: 400 });
    }

    await dbConnect();

    let thread = body.threadId
      ? await ChatThread.findOne({ threadId: body.threadId, userId })
      : null;

    if (!thread) {
      thread = new ChatThread({ userId, title: 'New chat', messages: [] });
    }

    // Store user message immediately
    thread.messages.push({ role: 'user', content: userMessage, createdAt: new Date() });

    // Create a readable stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = '';
        const toolCalls: any[] = [];

        try {
          for await (const chunk of streamAssistantMessage(
            thread!.messages ?? [],
            userMessage,
            userId
          )) {
            if (chunk.type === 'text' && chunk.content) {
              fullResponse += chunk.content;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'text', content: chunk.content })}\n\n`)
              );
            } else if (chunk.type === 'tool_call' && chunk.toolCall) {
              toolCalls.push(chunk.toolCall);
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'tool_call', toolCall: chunk.toolCall })}\n\n`)
              );
            } else if (chunk.type === 'tool_result' && chunk.toolResult) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'tool_result', toolResult: chunk.toolResult })}\n\n`)
              );
            } else if (chunk.type === 'done') {
              // Save assistant message to database
              if (toolCalls.length > 0) {
                for (const toolCall of toolCalls) {
                  thread!.messages.push({
                    role: 'tool',
                    content: JSON.stringify(toolCall),
                    name: toolCall.name,
                    createdAt: new Date(),
                  });
                }
              }

              thread!.messages.push({
                role: 'assistant',
                content: fullResponse,
                createdAt: new Date(),
              });

              if (!thread!.title || thread!.title === 'New chat') {
                thread!.title = userMessage.slice(0, 60) || 'New chat';
              }

              await thread!.save();

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: 'done',
                    threadId: thread!.threadId,
                    title: thread!.title,
                  })}\n\n`
                )
              );
            }
          }
        } catch (error) {
          console.error('Stream error:', error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Streaming failed' })}\n\n`)
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in stream endpoint:', error);
    return new Response('Failed to stream message', { status: 500 });
  }
}
