import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export const runtime = 'nodejs';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

interface ActionRequest {
  action: string;
  body: string;
  prompt: string;
}

export async function POST(request: NextRequest) {
  try {
    const data = (await request.json()) as ActionRequest;

    if (!data.body || !data.prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: body, prompt' },
        { status: 400 }
      );
    }

    // Use streaming for real-time generation
    const response = await groq.messages.stream({
      model: 'mixtral-8x7b-32768',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: data.prompt,
        },
      ],
    });

    // Create a ReadableStream to send the response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            if (chunk.type === 'content_block_delta') {
              const delta = chunk.delta as { type: string; text?: string };
              if (delta.type === 'text_delta' && delta.text) {
                controller.enqueue(encoder.encode(delta.text));
              }
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('[API] Action generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate' },
      { status: 500 }
    );
  }
}
