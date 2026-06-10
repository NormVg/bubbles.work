import { generateObject } from 'ai'
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

  let aiPrompt = ''
  if (previousDraft && revisionPrompt) {
    aiPrompt = `You previously drafted these tasks:\n"""\n${JSON.stringify(previousDraft, null, 2)}\n"""\n\nThe user wants you to revise this draft based on these instructions:\n"""\n${revisionPrompt}\n"""\n\nPlease output the complete, newly revised list of tasks. Apply the user's requested changes to the previous draft.`
  } else {
    aiPrompt = `Extract structured tasks from the following input.\n\nInput:\n"""\n${prompt}\n"""`
  }
  
  if (currentDateTime) {
    aiPrompt += `\n\nCRITICAL CONTEXT - Current Date and Time:\n${currentDateTime}\nUse this as the reference point for resolving any relative dates like "tomorrow", "next week", etc.`
  }

  if (categoryContext && categoryContext.length > 0) {
    aiPrompt += `\n\nExisting Categories and Topics (this is the user's project organization):\n"""\n${JSON.stringify(categoryContext, null, 2)}\n"""\n\nIMPORTANT: Categories are like project folders (e.g. "Design Assets", "Project Alpha"). Topics are sub-sections within a category (e.g. "Brand", "Sprint planning"). You SHOULD assign tasks to matching categories and topics when they clearly fit. If no existing category matches, you can propose a new categoryName. If no topic matches, you can propose a new topicName. Only leave categoryName empty if the task truly doesn't belong to any project/category.`
  }

  if (propertiesSchema && propertiesSchema.length > 0) {
    aiPrompt += `\n\nExisting Custom Properties on the Board:\n"""\n${JSON.stringify(propertiesSchema, null, 2)}\n"""\n\nYou can populate these custom properties for the tasks. If the user asks for a property that doesn't exist yet (e.g. "Add a Reviewer property set to John"), you can propose it in the "newProperties" array.`
  }

  if (workspaces && workspaces.length > 0) {
    aiPrompt += `\n\nExisting Workspaces:\n"""\n${JSON.stringify(workspaces, null, 2)}\n"""\n\nCRITICAL INSTRUCTION: You must assign each task to an appropriate workspace by specifying "workspaceId". If the task is related to personal life, assign it to the 'personal' workspace. If it is related to work/career, assign it to the 'professional' workspace. You can also use other custom workspaces if they match the context better.`
  }

  if (existingTasks && existingTasks.length > 0) {
    aiPrompt += `\n\nExisting Tasks on the Board:\n"""\n${JSON.stringify(existingTasks, null, 2)}\n"""\n\nIMPORTANT: Only set "action" to "update" if the user EXPLICITLY asks to modify, change, or update a specific existing task. Do NOT mark tasks as "update" just because they have a similar title. Default to "create" for new tasks. If a task truly needs updating, set "taskId" to the existing task's id.`
  }

  aiPrompt += `\n\nIMPORTANT: You must return ONLY raw valid JSON matching the requested schema. Do not include markdown code blocks, conversational text, or explanations. Just the JSON object.\n\nExpected JSON format:\n{\n  "newProperties": [],\n  "tasks": [\n    {\n      "action": "create",\n      "title": "Task title",\n      "workspaceId": "personal",\n      "categoryName": "Design Assets",\n      "topicName": "Brand",\n      "priority": "opt-h",\n      "context": "today",\n      "description": "Optional description",\n      "customProperties": [\n        { "name": "On Date", "value": "2026-06-15" }\n      ]\n    }\n  ]\n}`

  try {
    const result = await generateObject({
      model,
      schema: z.object({
        newProperties: z.array(z.object({
          name: z.string().describe('Name of the new property to create.'),
          type: z.enum(['text', 'number', 'select', 'date']).describe('Type of the new property.')
        })).optional().describe('Any completely new properties the user wants to track globally on tasks.'),
        tasks: z.array(z.object({
          action: z.enum(['create', 'update']).describe('Whether to create a new task or update an existing one. Default to create.'),
          taskId: z.string().optional().describe('The ID of the existing task to update. Required ONLY if action is update.'),
          title: z.string().describe('A concise, actionable title for the task.'),
          workspaceId: z.string().describe('The ID of the workspace this task belongs to (e.g. personal, professional, or a custom id).'),
          categoryName: z.string().optional().describe('The name of the category this task belongs to. Use existing if appropriate, or propose a new one.'),
          topicName: z.string().optional().describe('The name of the topic/column within the category. Use existing if appropriate, or propose a new one.'),
          priority: z.enum(['opt-h', 'opt-m', 'opt-l']).describe('opt-h for High, opt-m for Medium, opt-l for Low.'),
          context: z.enum(['today', 'tomorrow', 'someday']).describe('today, tomorrow, or someday based on the urgency mentioned in the prompt. default to today if unspecified.'),
          description: z.string().optional().describe('Additional context or details about the task.'),
          customProperties: z.array(z.object({
            name: z.string().describe('The name of the property. Must match an existing property name or one defined in newProperties.'),
            value: z.any().describe('The value to set for this property. For dates, use YYYY-MM-DD. For selects, use the label string.')
          })).optional().describe('Values for dynamic custom properties.')
        }))
      }),
      prompt: aiPrompt
    })

    return { tasks: result.object.tasks, newProperties: result.object.newProperties }
  } catch (error: any) {
    console.error('[AI Task Extraction Error]:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to extract tasks'
    })
  }
})
