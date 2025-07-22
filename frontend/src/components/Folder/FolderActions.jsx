"use client"
import { Check, X, Upload, Plus, Edit, Trash2 } from "lucide-react"

const FolderActions = ({
  level,
  isEditing,
  showDeleteConfirm,
  editName,
  onConfirmEdit,
  onCancelEdit,
  onConfirmDelete,
  onCancelDelete,
  onUpload,
  onCreateSubfolder,
  onEdit,
  onDelete,
}) => {
  const getResponsiveClasses = (level) => {
    return {
      buttonPadding: level > 2 ? "p-0.5" : level > 0 ? "p-1" : "p-1.5",
      iconSize: level > 2 ? "w-3 h-3" : level > 0 ? "w-4 h-4" : "w-4 h-4"
    }
  }

  const { buttonPadding, iconSize } = getResponsiveClasses(level)

  const handleActionButtonHover = (e, isEntering, color, bgColor) => {
    if (isEntering) {
      e.target.style.color = color
      e.target.style.backgroundColor = bgColor
    } else {
      e.target.style.color = "var(--text-tertiary)"
      e.target.style.backgroundColor = "transparent"
    }
  }

  if (isEditing) {
    return (
      <>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onConfirmEdit()
          }}
          disabled={!editName.trim()}
          className={`rounded transition-colors ${buttonPadding}`}
          style={{
            color: editName.trim() ? "var(--color-success)" : "var(--text-tertiary)",
            cursor: editName.trim() ? "pointer" : "not-allowed"
          }}
          onMouseEnter={(e) => {
            if (editName.trim()) {
              e.target.style.backgroundColor = "rgba(34, 197, 94, 0.1)"
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "transparent"
          }}
        >
          <Check className={iconSize} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onCancelEdit()
          }}
          className={`rounded transition-colors ${buttonPadding}`}
          style={{ color: "var(--text-tertiary)" }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "var(--bg-tertiary)"
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "transparent"
          }}
        >
          <X className={iconSize} />
        </button>
      </>
    )
  }

  if (showDeleteConfirm) {
    return (
      <>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onConfirmDelete()
          }}
          className={`rounded transition-colors ${buttonPadding}`}
          style={{ color: "var(--color-error)" }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "rgba(239, 68, 68, 0.1)"
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "transparent"
          }}
        >
          <Check className={iconSize} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onCancelDelete && onCancelDelete()
          }}
          className={`rounded transition-colors ${buttonPadding}`}
          style={{ color: "var(--text-tertiary)" }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "var(--bg-tertiary)"
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "transparent"
          }}
        >
          <X className={iconSize} />
        </button>
      </>
    )
  }

  return (
    <>
      <button
        onClick={onUpload}
        className={`rounded transition-all ${buttonPadding}`}
        style={{ color: "var(--text-tertiary)" }}
        onMouseEnter={(e) => handleActionButtonHover(e, true, "var(--color-success)", "rgba(34, 197, 94, 0.1)")}
        onMouseLeave={(e) => handleActionButtonHover(e, false)}
        title="Subir documento"
      >
        <Upload className={iconSize} />
      </button>
      <button
        onClick={onCreateSubfolder}
        className={`rounded transition-all ${buttonPadding}`}
        style={{ color: "var(--text-tertiary)" }}
        onMouseEnter={(e) => handleActionButtonHover(e, true, "var(--color-primary-dark)", "rgba(59, 130, 246, 0.1)")}
        onMouseLeave={(e) => handleActionButtonHover(e, false)}
        title="Crear subcarpeta"
      >
        <Plus className={iconSize} />
      </button>
      <button
        onClick={onEdit}
        className={`rounded transition-all ${buttonPadding}`}
        style={{ color: "var(--text-tertiary)" }}
        onMouseEnter={(e) => handleActionButtonHover(e, true, "var(--color-warning)", "rgba(251, 191, 36, 0.1)")}
        onMouseLeave={(e) => handleActionButtonHover(e, false)}
        title="Editar carpeta"
      >
        <Edit className={iconSize} />
      </button>
      <button
        onClick={onDelete}
        className={`rounded transition-all ${buttonPadding}`}
        style={{ color: "var(--text-tertiary)" }}
        onMouseEnter={(e) => handleActionButtonHover(e, true, "var(--color-error)", "rgba(239, 68, 68, 0.1)")}
        onMouseLeave={(e) => handleActionButtonHover(e, false)}
        title="Eliminar carpeta"
      >
        <Trash2 className={iconSize} />
      </button>
    </>
  )
}

export default FolderActions