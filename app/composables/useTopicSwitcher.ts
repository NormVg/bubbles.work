import { useCategoryStore, type Category, type Task } from '~/stores/category.store'

export interface SiblingTopic {
  id: string
  name: string
  isActive: boolean
  color?: string
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
              color: t.color
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
            color: t.color
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
