"use client"
import { CheckIcon, XMarkIcon, ArrowUpTrayIcon, PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline"
import { getButtonPadding, getIconButtonSize } from "../../utils/folderUtils"

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
  const buttonPadding = getButtonPadding(level)
  const iconSize = getIconButtonSize(level)

  if (isEditing) {
    return (
      <>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onConfirmEdit()
          }}
          disabled={!editName.trim()}
          className={`rounded ${
            editName.trim() ? "text-green-600 hover:bg-green-100" : "text-gray-400 cursor-not-allowed"
          } ${buttonPadding}`}
        >
          <CheckIcon className={iconSize} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onCancelEdit()
          }}
          className={`text-gray-500 hover:bg-gray-100 rounded ${buttonPadding}`}
        >
          <XMarkIcon className={iconSize} />
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
          className={`text-red-600 hover:bg-red-100 rounded ${buttonPadding}`}
        >
          <CheckIcon className={iconSize} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onCancelDelete()
          }}
          className={`text-gray-500 hover:bg-gray-100 rounded ${buttonPadding}`}
        >
          <XMarkIcon className={iconSize} />
        </button>
      </>
    )
  }

  return (
    <>
      <button
        onClick={onUpload}
        className={`text-gray-400 hover:text-green-600 hover:bg-green-50 rounded opacity-0 group-hover:opacity-100 transition ${buttonPadding}`}
        title="Subir documento"
      >
        <ArrowUpTrayIcon className={iconSize} />
      </button>
      <button
        onClick={onCreateSubfolder}
        className={`text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded opacity-0 group-hover:opacity-100 transition ${buttonPadding}`}
        title="Crear subcarpeta"
      >
        <PlusIcon className={iconSize} />
      </button>
      <button
        onClick={onEdit}
        className={`text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded opacity-0 group-hover:opacity-100 transition ${buttonPadding}`}
        title="Editar carpeta"
      >
        <PencilIcon className={iconSize} />
      </button>
      <button
        onClick={onDelete}
        className={`text-gray-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition ${buttonPadding}`}
        title="Eliminar carpeta"
      >
        <TrashIcon className={iconSize} />
      </button>
    </>
  )
}

export default FolderActions
