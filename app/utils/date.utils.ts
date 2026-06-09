export function getSidebarDates() {
  const dates = []
  const today = new Date()
  
  // Start from day after tomorrow
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() + 2)

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  for (let i = 0; i < 4; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    
    const dayName = days[d.getDay()]
    const dateNum = d.getDate().toString().padStart(2, '0')
    const monthName = months[d.getMonth()]
    
    dates.push({
      id: d.toISOString(),
      label: `${dayName} ${dateNum} ${monthName}` // e.g., Thu 11 Jun
    })
  }

  return dates
}
