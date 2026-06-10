import { generateObject } from 'ai'
import { createOllama } from 'ai-sdk-ollama'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { prompt, ollamaApiKey, aiModel } = body

  if (!prompt || !prompt.trim()) {
    throw createError({
      statusCode: 400,
      message: 'Prompt is required'
    })
  }

  if (!ollamaApiKey) {
    throw createError({
      statusCode: 401,
      message: 'Ollama API key is missing'
    })
  }

  // Configure Ollama to use the cloud API with the user's API key
  const ollama = createOllama({
    baseURL: 'https://ollama.com',
    headers: {
      Authorization: `Bearer ${ollamaApiKey}`
    }
  })

  const model = ollama(aiModel || 'llama3.1')

  try {
    const result = await generateObject({
      model,
      schema: z.object({
        tasks: z.array(z.object({
          title: z.string().describe('A concise, actionable title for the task.'),
          priority: z.enum(['opt-h', 'opt-m', 'opt-l']).describe('opt-h for High, opt-m for Medium, opt-l for Low.'),
          context: z.enum(['today', 'tomorrow', 'someday']).describe('today, tomorrow, or someday based on the urgency mentioned in the prompt. default to today if unspecified.'),
          description: z.string().optional().describe('Additional context or details about the task.')
        }))
      }),
      prompt: `Extract structured tasks from the following brain dump.\n\nBrain Dump:\n"""\n${prompt}\n"""\n\nIMPORTANT: You must return ONLY raw valid JSON matching the requested schema. Do not include markdown code blocks, conversational text, or explanations. Just the JSON object.\n\nExpected JSON format:\n{\n  "tasks": [\n    {\n      "title": "Task title",\n      "priority": "opt-h" | "opt-m" | "opt-l",\n      "context": "today" | "tomorrow" | "someday",\n      "description": "Optional description"\n    }\n  ]\n}`
    })

    return { tasks: result.object.tasks }
  } catch (error: any) {
    console.error('[AI Task Extraction Error]:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to extract tasks'
    })
  }
})
