import { useCategoryStore, type Category } from '~/stores/category.store'

export interface Breadcrumb {
  label: string
  to: string
}

export const useNavigation = () => {
  const categoryStore = useCategoryStore()

  /**
   * Recursively finds the breadcrumb path to a category or topic.
   */
  const getBreadcrumbs = (id: string, type: 'category' | 'topic'): Breadcrumb[] => {
    const path: Breadcrumb[] = []
    
    // Recursive search function
    const search = (categories: Category[], targetId: string, currentPath: Breadcrumb[]): boolean => {
      for (const cat of categories) {
        const catBreadcrumb: Breadcrumb = { label: cat.name, to: `/dashboard/category/${cat.id}` }
        
        if (type === 'category' && cat.id === targetId) {
          path.push(...currentPath, catBreadcrumb)
          return true
        }
        
        if (type === 'topic') {
          const topic = cat.tasks.find(t => t.id === targetId)
          if (topic) {
            path.push(...currentPath, catBreadcrumb, { label: topic.name, to: `/dashboard/topic/${topic.id}` })
            return true
          }
        }
        
        if (cat.children && cat.children.length > 0) {
          if (search(cat.children, targetId, [...currentPath, catBreadcrumb])) {
            return true
          }
        }
      }
      return false
    }
    
    search(categoryStore.categories, id, [])
    return path
  }

  return {
    getBreadcrumbs
  }
}
