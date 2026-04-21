/**
 * AI-assisted email generation utilities
 */

export async function generateEmailWithAction(
  action: string,
  body: string,
  context: string,
  tone: string,
  length: string,
  personalizationDepth: string
): Promise<ReadableStream<Uint8Array> | null> {
  const prompts: Record<string, (body: string, context: string) => string> = {
    regenerate: (body, context) =>
      `Generate a completely different cold email with the same parameters. The previous email was:\n\n${body}\n\nContext:\n${context}`,

    shorten: (body) =>
      `Shorten this email to 2-3 sentences while keeping the key message intact:\n\n${body}`,

    formalize: (body) =>
      `Make this email more formal and professional:\n\n${body}`,

    'add-cta': (body) =>
      `Add a clear, persuasive call-to-action to the end of this email:\n\n${body}`,

    'tone:professional': (body) =>
      `Rewrite this email in a professional and business-like tone:\n\n${body}`,

    'tone:casual': (body) =>
      `Rewrite this email in a casual and relaxed tone:\n\n${body}`,

    'tone:friendly': (body) =>
      `Rewrite this email in a warm and friendly tone:\n\n${body}`,

    'tone:formal': (body) =>
      `Rewrite this email in a formal and courteous tone:\n\n${body}`,

    'length:short': (body) =>
      `Condense this email to 2-3 sentences:\n\n${body}`,

    'length:medium': (body) =>
      `Adjust this email to be 4-5 sentences long:\n\n${body}`,

    'length:long': (body) =>
      `Expand this email to 6-8 sentences with more detail:\n\n${body}`,
  };

  const prompt = prompts[action]
    ? prompts[action](body, context)
    : `Improve this email:\n\n${body}`;

  try {
    const response = await fetch('/api/generate-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        body,
        prompt,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate');
    }

    return response.body;
  } catch (error) {
    console.error('[AI Utils] Error:', error);
    return null;
  }
}

export function extractFirstName(email: string): string {
  const match = email.match(/^([a-zA-Z]+)/);
  return match ? match[1] : 'there';
}

export function extractPersonName(email: string): string {
  // Simple extraction from email like "john.doe@company.com" -> "John Doe"
  const match = email.match(/^([a-zA-Z]+)\.?([a-zA-Z]*)/);
  if (match) {
    const [, first, last] = match;
    if (last) {
      return `${first.charAt(0).toUpperCase() + first.slice(1)} ${last.charAt(0).toUpperCase() + last.slice(1)}`;
    }
    return first.charAt(0).toUpperCase() + first.slice(1);
  }
  return 'there';
}

export function estimateReadingTime(text: string): string {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / wordsPerMinute));
  return `${minutes} min read`;
}

export function getEmailStats(text: string): {
  words: number;
  sentences: number;
  paragraphs: number;
} {
  const words = text.trim().split(/\s+/).length;
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;
  const paragraphs = text
    .split(/\n\n+/)
    .filter((p) => p.trim().length > 0).length;

  return { words, sentences, paragraphs };
}
