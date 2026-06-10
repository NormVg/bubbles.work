import { useCategoryStore, type Category, type Task } from '~/stores/category.store'

export interface SiblingTopic {
  id: string
  name: string
  isActive: boolean
  color?: string
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316']

function getTopicColor(id: string, color?: string) {
  if (color) return color
  // Generate a deterministic color based on the ID string
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return COLORS[hash % COLORS.length]
}

export const useTopicSwitcher = () => {
  const categoryStore = useCategoryStore()

  /**
   * Finds the parent category of a topic and returns all topics in that category.
   */
  const getSiblingTopics = (topicId: string): { categoryId: string, topics: SiblingTopic[] } | null => {
    let result: { categoryId: string, topics: SiblingTopic[] } | null = null

    const search = (categories: Category[]) => {
      for (const cat of categories) {
        if (cat.tasks.some(t => t.id === topicId)) {
          result = {
            categoryId: cat.id,
            topics: cat.tasks.map(t => ({
              id: t.id,
              name: t.name,
              isActive: t.id === topicId,
              color: getTopicColor(t.id, t.color)
            }))
          }
          return true
        }
        if (cat.children && cat.children.length > 0) {
          if (search(cat.children)) return true
        }
      }
      return false
    }

    search(categoryStore.categories)
    return result
  }
  
  /**
   * Returns all topics for a given category ID directly
   */
  const getTopicsByCategory = (categoryId: string): SiblingTopic[] => {
    let result: SiblingTopic[] = []
    
    const search = (categories: Category[]) => {
      for (const cat of categories) {
        if (cat.id === categoryId) {
          result = cat.tasks.map(t => ({
            id: t.id,
            name: t.name,
            isActive: false,
            color: getTopicColor(t.id, t.color)
          }))
          return true
        }
        if (cat.children && cat.children.length > 0) {
          if (search(cat.children)) return true
        }
      }
      return false
    }
    
    search(categoryStore.categories)
    return result
  }

  return {
    getSiblingTopics,
    getTopicsByCategory
  }
}
