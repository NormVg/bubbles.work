import { defineStore } from 'pinia'

export interface Task {
  id: string
  name: string
}

export interface Category {
  id: string
  name: string
  tasks: Task[]
  children: Category[]
  isExpanded: boolean
}

function findCategory(categories: Category[], id: string): Category | undefined {
  for (const cat of categories) {
    if (cat.id === id) return cat
    const found = findCategory(cat.children, id)
    if (found) return found
  }
  return undefined
}

function removeFromList(categories: Category[], id: string): boolean {
  const idx = categories.findIndex(c => c.id === id)
  if (idx !== -1) {
    categories.splice(idx, 1)
    return true
  }
  for (const cat of categories) {
    if (removeFromList(cat.children, id)) return true
  }
  return false
}

export const useCategoryStore = defineStore('category', {
  state: () => ({
    categories: [
      {
        id: 'cat-1',
        name: 'Design Assets',
        isExpanded: true,
        children: [
          {
            id: 'cat-1-1',
            name: 'Brand',
            isExpanded: false,
            children: [],
            tasks: [
              { id: 'task-1-1-1', name: 'Logo variants' }
            ]
          }
        ],
        tasks: [
          { id: 'task-1', name: 'Color palette review' },
          { id: 'task-2', name: 'Typography audit' }
        ]
      },
      {
        id: 'cat-2',
        name: 'Project Alpha',
        isExpanded: false,
        children: [],
        tasks: [
          { id: 'task-3', name: 'Sprint planning' }
        ]
      }
    ] as Category[]
  }),
  actions: {
    toggleCategory(categoryId: string) {
      const category = findCategory(this.categories, categoryId)
      if (category) {
        category.isExpanded = !category.isExpanded
      }
    },
    addCategory(parentId: string | null, name: string) {
      const newCat: Category = {
        id: 'cat-' + Date.now(),
        name,
        tasks: [],
        children: [],
        isExpanded: true
      }
      if (!parentId) {
        this.categories.push(newCat)
      } else {
        const parent = findCategory(this.categories, parentId)
        if (parent) {
          parent.children.push(newCat)
          parent.isExpanded = true
        }
      }
    },
    removeCategory(categoryId: string) {
      removeFromList(this.categories, categoryId)
    },
    addTask(categoryId: string, name: string) {
      const category = findCategory(this.categories, categoryId)
      if (category) {
        const id = 'task-' + Date.now()
        category.tasks.push({ id, name })
        category.isExpanded = true
      }
    },
    removeTask(categoryId: string, taskId: string) {
      const category = findCategory(this.categories, categoryId)
      if (category) {
        category.tasks = category.tasks.filter(t => t.id !== taskId)
      }
    }
  },
  persist: true
})
