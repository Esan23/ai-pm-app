import type { Handler } from '@netlify/functions'
import Anthropic from '@anthropic-ai/sdk'

/**
 * Deconstruct a free-text description into user stories + tasks using Claude.
 * Falls back to a "demo" signal when ANTHROPIC_API_KEY is unset, so the client
 * can use its local heuristic and the app still works with no backend config.
 */

const PROVIDERS = ['Human', 'Claude', 'ChatGPT', 'Copilot', 'Gemini'] as const
const PRIORITIES = ['low', 'medium', 'high'] as const

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    stories: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          asA: { type: 'string' },
          iWant: { type: 'string' },
          soThat: { type: 'string' },
          priority: { type: 'string', enum: PRIORITIES },
          tasks: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                title: { type: 'string' },
                provider: { type: 'string', enum: PROVIDERS },
              },
              required: ['title', 'provider'],
            },
          },
        },
        required: ['title', 'asA', 'iWant', 'soThat', 'priority', 'tasks'],
      },
    },
  },
  required: ['stories'],
}

const SYSTEM = `You are Cairn, an AI project-management assistant for teams shipping AI products.
Turn the user's free-text description of what they're building into a small, legible backlog.

Rules:
- Produce 1–4 user stories, each with a concise title and an "As a <role>, I want <capability>, so that <benefit>" breakdown. The asA/iWant/soThat fields hold ONLY the clause text (no "As a" prefix).
- Order stories by importance and set priority accordingly (first = high).
- Give each story 2–4 concrete, buildable tasks.
- Attribute each task to the provider best suited to produce it: "Copilot" for implementation/coding, "Claude" for prompts/reasoning/drafting/summarizing/classification, "ChatGPT" for research/exploration/specs, "Gemini" for broad multimodal/research, "Human" for design, decisions, and review.
- Be specific to the described product. No filler.`

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  let description = ''
  try {
    description = (JSON.parse(event.body || '{}').description || '').toString().trim()
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) }
  }
  if (!description) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing "description"' }) }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    // No key configured — tell the client to use its local demo heuristic.
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ source: 'demo', stories: null }),
    }
  }

  try {
    const client = new Anthropic({ apiKey })
    // Force structured output via a single required tool — version-proof across
    // SDK releases and guarantees a parsed JSON object back.
    const response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 2048,
      system: SYSTEM,
      tools: [
        {
          name: 'record_backlog',
          description: 'Record the deconstructed user stories and tasks for the project.',
          input_schema: SCHEMA as Anthropic.Tool.InputSchema,
        },
      ],
      tool_choice: { type: 'tool', name: 'record_backlog' },
      messages: [{ role: 'user', content: description.slice(0, 4000) }],
    })

    const toolUse = response.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
    )
    if (!toolUse) throw new Error('No tool_use block in response')
    const parsed = toolUse.input as { stories?: unknown }

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ source: 'ai', stories: parsed.stories ?? [] }),
    }
  } catch (err) {
    // Any model/parse failure: fall back to the client's local heuristic.
    console.error('capture function error:', err)
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ source: 'demo', stories: null, error: String(err) }),
    }
  }
}
