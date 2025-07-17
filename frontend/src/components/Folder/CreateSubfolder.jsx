"use client"
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline"

const CreateSubfolder = ({ subfolderName, setSubfolderName, onConfirm, onCancel, paddingLeft }) => {
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      onConfirm()
    } else if (e.key === "Escape") {
      onCancel()
    }
  }

  return (
    <div style={{ paddingLeft: `${24 + paddingLeft}px` }}>
      <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
        <input
          type="text"
          value={subfolderName}
          onChange={(e) => setSubfolderName(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Nombre de la subcarpeta"
          className="flex-1 bg-transparent border-none outline-none text-sm placeholder-gray-500"
          autoFocus
        />
        <button
          onClick={onConfirm}
          disabled={!subfolderName.trim()}
          className={`p-1 rounded ${
            subfolderName.trim() ? "text-green-600 hover:bg-green-100" : "text-gray-400 cursor-not-allowed"
          }`}
        >
          <CheckIcon className="w-4 h-4" />
        </button>
        <button onClick={onCancel} className="p-1 text-gray-500 hover:bg-gray-100 rounded">
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default CreateSubfolder
