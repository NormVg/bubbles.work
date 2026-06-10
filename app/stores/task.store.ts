import { defineStore } from 'pinia'
import { useWorkspaceStore } from './workspace.store'

export type TaskStatus = 'open' | 'live' | 'done'

export type PropertyType = 'text' | 'number' | 'select' | 'multi-select' | 'date'

export interface PropertyOption {
  id: string
  label: string
  color?: string
}

export interface PropertySchema {
  id: string
  name: string
  type: PropertyType
  options?: PropertyOption[]
  color?: string
}

export interface TaskTag {
  label: string
  intent: 'danger' | 'warning' | 'success' | 'info' | 'primary' | 'secondary'
}

export interface BoardTask {
  id: string
  identifier: string // e.g., #T-235
  title: string
  status: TaskStatus
  
  // Legacy hardcoded props that we can slowly migrate, or keep for core UI features
  priority?: string
  tags?: TaskTag[]
  categoryLabel?: string
  assigneesCount?: number
  
  // New dynamic property system
  customProperties: Record<string, any>
  
  context: string // Topic ID
  scheduledFor?: string | null // e.g. 'today', 'tomorrow', 'date-2026-06-15'
  createdAt: string
  order: number
  description?: string
  workspaceId?: string
}

export const useTaskStore = defineStore('tasks', {
  state: () => ({
    propertiesSchema: [
      {
        id: 'prop-priority',
        name: 'Priority',
        type: 'select',
        options: [
          { id: 'opt-h', label: 'High', color: '#E24B4A' },
          { id: 'opt-m', label: 'Medium', color: '#EF9F27' },
          { id: 'opt-l', label: 'Low', color: '#888888' },
        ]
      },
      {
        id: 'prop-date',
        name: 'On Date',
        type: 'date',
        color: '#3b82f6'
      }
    ] as PropertySchema[],
    tasks: [
      { 
        id: 'bt-1', identifier: '#T-235', title: 'Fix USDC payout issue for logged in users in dashboard', 
        status: 'open', customProperties: { 'prop-priority': 'opt-h' },
        context: 'task-1', scheduledFor: 'today', createdAt: '2026-06-10T00:00:00.000Z', order: 0, workspaceId: 'professional' 
      },
      { 
        id: 'bt-2', identifier: '#T-234', title: 'Allow users to export tables as CSV', 
        status: 'open', customProperties: { 'prop-priority': 'opt-m' },
        context: 'task-1', scheduledFor: 'today', createdAt: '2026-06-10T00:00:00.000Z', order: 1, workspaceId: 'professional'
      },
      { 
        id: 'bt-3', identifier: '#T-236', title: 'Add Darkmode support', 
        status: 'open', customProperties: { 'prop-priority': 'opt-m' },
        context: 'task-1', scheduledFor: 'today', createdAt: '2026-06-10T00:00:00.000Z', order: 2, workspaceId: 'professional'
      },
      { 
        id: 'bt-4', identifier: '#T-237', title: 'Write API documentation', 
        status: 'live', customProperties: { 'prop-priority': 'opt-l' },
        context: 'task-2', scheduledFor: 'today', createdAt: '2026-06-10T00:00:00.000Z', order: 0, workspaceId: 'professional'
      },
      { 
        id: 'bt-5', identifier: '#T-238', title: 'Review pull requests', 
        status: 'done', customProperties: { 'prop-priority': 'opt-h' },
        context: 'task-2', scheduledFor: 'today', createdAt: '2026-06-10T00:00:00.000Z', order: 0, workspaceId: 'professional'
      },
      { 
        id: 'bt-6', identifier: '#T-239', title: 'Deploy staging build', 
        status: 'open', customProperties: { 'prop-priority': 'opt-h' },
        context: 'task-3', scheduledFor: 'tomorrow', createdAt: '2026-06-10T00:00:00.000Z', order: 0, workspaceId: 'professional'
      },
    ] as BoardTask[]
  }),
  getters: {
    getTasksByContext: (state) => {
      return (context: string) => {
        const wsStore = useWorkspaceStore()
        const isDateContext = ['today', 'tomorrow', 'someday'].includes(context) || context.startsWith('date-')
        return state.tasks.filter(t => {
          const match = isDateContext ? t.scheduledFor === context : t.context === context
          return match && (wsStore.activeWorkspaceId === 'all' || t.workspaceId === wsStore.activeWorkspaceId || !t.workspaceId)
        })
      }
    },
    getTasksByStatus: (state) => {
      return (context: string, status: TaskStatus) => {
        const wsStore = useWorkspaceStore()
        const isDateContext = ['today', 'tomorrow', 'someday'].includes(context) || context.startsWith('date-')
        return state.tasks.filter(t => {
          const match = isDateContext ? t.scheduledFor === context : t.context === context
          return match && t.status === status && (wsStore.activeWorkspaceId === 'all' || t.workspaceId === wsStore.activeWorkspaceId || !t.workspaceId)
        })
      }
    }
  },
  actions: {
    addPropertySchema(name: string, type: PropertyType) {
      const id = 'prop-' + Date.now()
      const COLORS = ['#E24B4A', '#EF9F27', '#8b5cf6', '#10b981', '#3b82f6', '#f43f5e', '#0ea5e9']
      const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)]
      this.propertiesSchema.push({
        id,
        name,
        type,
        options: type === 'select' ? [] : undefined,
        color: randomColor
      })
      return id
    },
    addPropertyOption(propId: string, label: string) {
      const prop = this.propertiesSchema.find(p => p.id === propId)
      if (prop && prop.options) {
        const id = 'opt-' + Date.now()
        prop.options.push({ id, label })
        return id
      }
      return null
    },
    removePropertySchema(id: string) {
      this.propertiesSchema = this.propertiesSchema.filter(p => p.id !== id)
      this.tasks.forEach(t => {
        if (t.customProperties && t.customProperties[id] !== undefined) {
          delete t.customProperties[id]
        }
      })
    },
    realignIdentifiers() {
      const sorted = [...this.tasks].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      sorted.forEach((task, index) => {
        const actualTask = this.tasks.find(t => t.id === task.id)
        if (actualTask) {
          actualTask.identifier = '#T-' + (index + 1)
        }
      })
    },
    addTask(title: string, context: string, status: TaskStatus = 'open', workspaceId?: string, scheduledFor?: string | null) {
      const wsStore = useWorkspaceStore()
      const assignedWorkspaceId = workspaceId || (wsStore.activeWorkspaceId !== 'all' ? wsStore.activeWorkspaceId : 'personal')
      const isDateContext = ['today', 'tomorrow', 'someday'].includes(context) || context.startsWith('date-')
      
      let actualContext = context
      let actualScheduledFor = scheduledFor || null
      
      if (isDateContext) {
        actualContext = 'task-1'
        if (!actualScheduledFor) actualScheduledFor = context
      }
      
      const statusTasks = this.tasks.filter(t => (isDateContext ? t.scheduledFor === actualScheduledFor : t.context === actualContext) && t.status === status)
      const maxOrder = statusTasks.length > 0 ? Math.max(...statusTasks.map(t => t.order)) : -1
      
      this.tasks.push({
        id: 'bt-' + Date.now(),
        identifier: '', // Set by realignIdentifiers
        title,
        status,
        customProperties: { 'prop-priority': 'opt-m' },
        context: actualContext,
        scheduledFor: actualScheduledFor,
        createdAt: new Date().toISOString(),
        order: maxOrder + 1,
        workspaceId: assignedWorkspaceId
      })
      this.realignIdentifiers()
    },
    moveTask(taskId: string, newStatus: TaskStatus, newOrder?: number) {
      const task = this.tasks.find(t => t.id === taskId)
      if (!task) return

      if (task.status !== newStatus) {
        task.status = newStatus
      }
    },
    updateTaskOrders(context: string, status: TaskStatus, orderedTasks: BoardTask[]) {
      const isDateContext = ['today', 'tomorrow', 'someday'].includes(context) || context.startsWith('date-')
      orderedTasks.forEach((task, index) => {
        const t = this.tasks.find(x => x.id === task.id)
        if (t) {
          t.order = index
          t.status = status
          if (isDateContext) {
            t.scheduledFor = context
          } else {
            t.context = context
          }
        }
      })
    },
    updateTaskContextOrders(newContext: string, orderedTasks: BoardTask[]) {
      orderedTasks.forEach((task, index) => {
        const t = this.tasks.find(x => x.id === task.id)
        if (t) {
          t.order = index
          if (t.context !== newContext) {
            t.context = newContext
            t.status = 'open'
          }
        }
      })
    },
    removeTask(taskId: string) {
      this.tasks = this.tasks.filter(t => t.id !== taskId)
      this.realignIdentifiers()
    },
    updateTaskTitle(taskId: string, title: string) {
      const task = this.tasks.find(t => t.id === taskId)
      if (task) {
        task.title = title
      }
    },
    updateTaskField<K extends keyof BoardTask>(taskId: string, field: K, value: BoardTask[K]) {
      const task = this.tasks.find(t => t.id === taskId)
      if (task) {
        task[field] = value
      }
    },
    updateCustomProperty(taskId: string, propId: string, value: any) {
      const task = this.tasks.find(t => t.id === taskId)
      if (task) {
        if (!task.customProperties) task.customProperties = {}
        task.customProperties[propId] = value
      }
    }
  },
  persist: true
})
