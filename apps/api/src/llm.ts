import type { EnhancedDescription } from '@todo/types';

/**
 * Call OpenAI API to generate enhanced task description
 */
export async function enhanceTaskWithLLM(
  title: string,
  notes: string | null | undefined,
  apiKey: string
): Promise<EnhancedDescription> {
  const prompt = `Title: "${title}"\nNotes: "${notes || 'None'}"\n\nPlease return JSON with keys: summary (<=40 words), steps (array of short imperatives), risks (array), and estimateHours (integer 0..20). Keep it concise.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are an assistant helping users elaborate tasks into actionable checklists. Always return valid JSON only, no markdown formatting.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content?.trim();

  if (!content) {
    throw new Error('No content returned from OpenAI');
  }

  // Parse JSON (remove markdown code blocks if present)
  let jsonString = content;
  if (content.startsWith('```')) {
    jsonString = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  }

  try {
    const parsed = JSON.parse(jsonString);
    return {
      summary: parsed.summary || '',
      steps: Array.isArray(parsed.steps) ? parsed.steps : [],
      risks: Array.isArray(parsed.risks) ? parsed.risks : [],
      estimateHours: typeof parsed.estimateHours === 'number' ? parsed.estimateHours : 0,
    };
  } catch (error) {
    throw new Error(`Failed to parse LLM response: ${error}`);
  }
}

