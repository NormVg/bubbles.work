import { generateObject } from 'ai'
import { createOllama } from 'ai-sdk-ollama'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { prompt, ollamaApiKey, aiModel, previousDraft, revisionPrompt } = body

  if (!prompt && !revisionPrompt) {
    throw createError({
      statusCode: 400,
      message: 'Input is required'
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
  
  let aiPrompt = ''
  if (previousDraft && revisionPrompt) {
    aiPrompt = `You previously drafted these tasks:\n"""\n${JSON.stringify(previousDraft, null, 2)}\n"""\n\nThe user wants you to revise this draft based on these instructions:\n"""\n${revisionPrompt}\n"""\n\nPlease output the complete, newly revised list of tasks. Apply the user's requested changes to the previous draft.`
  } else {
    aiPrompt = `Extract structured tasks from the following input.\n\nInput:\n"""\n${prompt}\n"""`
  }
  
  aiPrompt += `\n\nIMPORTANT: You must return ONLY raw valid JSON matching the requested schema. Do not include markdown code blocks, conversational text, or explanations. Just the JSON object.\n\nExpected JSON format:\n{\n  "tasks": [\n    {\n      "title": "Task title",\n      "priority": "opt-h" | "opt-m" | "opt-l",\n      "context": "today" | "tomorrow" | "someday",\n      "description": "Optional description"\n    }\n  ]\n}`

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
      prompt: aiPrompt
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
