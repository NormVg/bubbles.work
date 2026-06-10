import { generateText, Output } from 'ai'
import { createOllama } from 'ai-sdk-ollama'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { prompt, ollamaApiKey, aiModel, previousDraft, revisionPrompt, categoryContext, existingTasks, propertiesSchema, currentDateTime, workspaces } = body

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

  const model = ollama(aiModel)

  // ─── SYSTEM PROMPT ───
  // Follows the Role → Task → Context → Constraints → Output Format pattern
  const systemPrompt = `# ROLE
You are a task extraction assistant. You read unstructured text and convert it into structured task objects.

# TASK
Parse the user's input and output a JSON object containing an array of tasks.
Each task must have ALL required fields filled in. No field should be empty or missing.

# CONSTRAINTS
Follow these rules strictly:

1. ACTION: Always set action to "create". Only use "update" if the user literally says "update task X" or "change task X" and provides an existing task ID.
2. CONTEXT: Default is "someday". Only use "today" if the user says "today", "now", "urgent", or "ASAP". Only use "tomorrow" if the user says "tomorrow". Everything else is "someday".
3. CATEGORY: Every task MUST have a categoryName. This is a project area like "Health", "Work", "Side Projects", "Engineering", "Design". Never leave it empty.
4. TOPIC: Every task MUST have a topicName. This is a sub-area like "Fitness", "Frontend", "Backend", "Branding". Never leave it empty.
5. WORKSPACE: Use "personal" for personal life tasks (health, hobbies, errands). Use "professional" for work tasks (engineering, design, meetings).
6. PRIORITY: Use "opt-h" for high, "opt-m" for medium, "opt-l" for low. Default to "opt-m" if unclear.

# OUTPUT FORMAT
Return ONLY valid JSON. No markdown, no explanation, no code fences. Just the raw JSON object.`

  // ─── USER PROMPT ───
  // Build the user-facing prompt with clear sections
  const promptSections: string[] = []

  // Section 1: The actual user input
  if (previousDraft && revisionPrompt) {
    promptSections.push(`## REVISION REQUEST
Previous draft:
${JSON.stringify(previousDraft, null, 2)}

User wants these changes:
${revisionPrompt}

Output the complete revised task list with changes applied.`)
  } else {
    promptSections.push(`## USER INPUT
${prompt}`)
  }

  // Section 2: Current date/time for resolving relative dates
  if (currentDateTime) {
    promptSections.push(`## CURRENT DATE/TIME
${currentDateTime}
Use this to resolve relative dates like "tomorrow", "next week", etc.`)
  }

  // Section 3: Available categories and topics
  if (categoryContext && categoryContext.length > 0) {
    promptSections.push(`## AVAILABLE CATEGORIES AND TOPICS
${JSON.stringify(categoryContext, null, 2)}
Use existing categories/topics when they fit. Otherwise create new ones. But NEVER leave categoryName or topicName empty.`)
  }

  // Section 4: Available workspaces
  if (workspaces && workspaces.length > 0) {
    promptSections.push(`## AVAILABLE WORKSPACES
${JSON.stringify(workspaces, null, 2)}
Assign each task to the best workspace. Personal life → "personal". Work → "professional".`)
  }

  // Section 5: Existing tasks (for update detection only)
  if (existingTasks && existingTasks.length > 0) {
    promptSections.push(`## EXISTING TASKS (for reference only)
${JSON.stringify(existingTasks, null, 2)}
Only set action to "update" if the user EXPLICITLY asks to modify one of these tasks.`)
  }

  // Section 6: Custom properties schema
  if (propertiesSchema && propertiesSchema.length > 0) {
    promptSections.push(`## CUSTOM PROPERTIES AVAILABLE
${JSON.stringify(propertiesSchema, null, 2)}
Populate these if relevant. Propose new ones in "newProperties" if the user asks for a property that doesn't exist.`)
  }

  // Section 7: Example output
  promptSections.push(`## EXAMPLE OUTPUT
{
  "newProperties": [],
  "tasks": [
    {
      "action": "create",
      "title": "Go for a morning run",
      "workspaceId": "personal",
      "categoryName": "Health",
      "topicName": "Fitness",
      "priority": "opt-m",
      "context": "someday",
      "description": "30 minute jog in the park"
    },
    {
      "action": "create",
      "title": "Review pull request #42",
      "workspaceId": "professional",
      "categoryName": "Engineering",
      "topicName": "Code Review",
      "priority": "opt-h",
      "context": "someday",
      "description": "Review the authentication refactor PR"
    }
  ]
}`)

  const userPrompt = promptSections.join('\n\n')

  try {
    const result = await generateText({
      model,
      system: systemPrompt,
      output: Output.object({
        name: 'TaskExtraction',
        description: 'Extract structured tasks from user input. Every task must have categoryName and topicName filled in. Default context is someday.',
        schema: z.object({
          newProperties: z.array(z.object({
            name: z.string(),
            type: z.enum(['text', 'number', 'select', 'date'])
          })).optional(),
          tasks: z.array(z.object({
            action: z.enum(['create', 'update']).default('create'),
            taskId: z.string().optional(),
            title: z.string(),
            workspaceId: z.string(),
            categoryName: z.string(),
            topicName: z.string(),
            priority: z.enum(['opt-h', 'opt-m', 'opt-l']).default('opt-m'),
            context: z.enum(['today', 'tomorrow', 'someday']).default('someday'),
            description: z.string().optional(),
            customProperties: z.array(z.object({
              name: z.string(),
              value: z.any()
            })).optional()
          }))
        })
      }),
      prompt: userPrompt
    })

    return { tasks: result.output?.tasks ?? [], newProperties: result.output?.newProperties ?? [] }
  } catch (error: any) {
    console.error('[AI Task Extraction Error]:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to extract tasks'
    })
  }
})
