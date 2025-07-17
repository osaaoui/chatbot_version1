export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export const getFolderStyles = (level, isDragging, isDragOver, showDeleteConfirm, isEditing) => {
  const baseClasses = `flex items-center gap-2 bg-white border border-gray-200 rounded-md transition group ${
    level === 0 ? "p-2" : "p-1.5"
  }`

  if (isDragging) return `${baseClasses} opacity-50 cursor-grabbing`
  if (isDragOver) return `${baseClasses} bg-blue-100 border-blue-300 border-2`
  if (showDeleteConfirm) return `${baseClasses} bg-red-50 border-red-200`
  if (isEditing) return `${baseClasses} bg-blue-50 border-blue-200`

  return `${baseClasses} hover:bg-gray-50 cursor-pointer`
}

export const getIconSize = (level) => (level === 0 ? "w-4 h-4" : "w-3 h-3")
export const getTextSize = (level) => (level === 0 ? "text-sm" : "text-xs")
export const getButtonPadding = (level) => (level === 0 ? "p-1" : "p-0.5")
export const getIconButtonSize = (level) => (level === 0 ? "w-3 h-3" : "w-2.5 h-2.5")
