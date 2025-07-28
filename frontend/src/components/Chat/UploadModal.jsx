"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useDocumentBases } from "../../context/DocumentBasesContext"
import { useFolders } from "../../context/FoldersContext"
import { Loader2 } from "lucide-react"

const UploadModal = ({ isOpen, onClose, files, onConfirmUpload, isUploading }) => {
  const { t } = useTranslation()
  const { documentBases, fetchDocumentBases, initialLoading: loadingDocumentBases } = useDocumentBases()
  const { getFoldersForDocumentBase, fetchFolders, foldersByDocumentBase } = useFolders()

  const [selectedDocumentBaseId, setSelectedDocumentBaseId] = useState("")
  const [selectedFolderId, setSelectedFolderId] = useState("")
  const [currentFolders, setCurrentFolders] = useState([])

  useEffect(() => {
    if (isOpen) {
      fetchDocumentBases()
      setSelectedDocumentBaseId("")
      setSelectedFolderId("")
      setCurrentFolders([])
    }
  }, [isOpen, fetchDocumentBases])

  useEffect(() => {
    if (selectedDocumentBaseId) {
      fetchFolders(selectedDocumentBaseId)
    }
  }, [selectedDocumentBaseId, fetchFolders])

  useEffect(() => {
    if (selectedDocumentBaseId && foldersByDocumentBase[selectedDocumentBaseId]) {
      setCurrentFolders(getFoldersForDocumentBase(selectedDocumentBaseId))
    } else {
      setCurrentFolders([])
    }
  }, [selectedDocumentBaseId, foldersByDocumentBase, getFoldersForDocumentBase])

  const handleConfirm = () => {
    if (selectedDocumentBaseId && selectedFolderId) {
      onConfirmUpload(files, selectedDocumentBaseId, selectedFolderId)
    }
  }

  const handleDocumentBaseChange = (e) => {
    setSelectedDocumentBaseId(e.target.value)
    setSelectedFolderId("") // Reset folder selection when document base changes
  }

  const handleFolderChange = (e) => {
    setSelectedFolderId(e.target.value)
  }

  const isConfirmDisabled = !selectedDocumentBaseId || !selectedFolderId || isUploading

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-md rounded-lg bg-bg-primary p-6 shadow-lg border border-border-light">
        {/* Dialog Header */}
        <div className="flex flex-col space-y-1.5 text-center sm:text-left">
          <h2 className="text-lg font-semibold leading-none tracking-tight text-gray-900 dark:text-gray-100">
            {t("uploadModal.title")}
          </h2>
        </div>

        {/* Dialog Content */}
        <div className="grid gap-4 py-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("uploadModal.filesToUpload")}: {files.map((f) => f.name).join(", ")}
          </p>

          <div className="grid gap-2">
            <label htmlFor="document-base-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("uploadModal.selectDocumentBase")}
            </label>
            <div className="relative">
              <select
                id="document-base-select"
                value={selectedDocumentBaseId}
                onChange={handleDocumentBaseChange}
                disabled={loadingDocumentBases || isUploading}
                className="input-base w-full appearance-none pr-8"
              >
                <option value="" disabled>
                  {t("uploadModal.chooseDocumentBase")}
                </option>
                {loadingDocumentBases ? (
                  <option disabled>
                    {t("common.loading")}
                  </option>
                ) : documentBases.length === 0 ? (
                  <option disabled>{t("uploadModal.noDocumentBases")}</option>
                ) : (
                  documentBases.map((base) => (
                    <option key={base.document_base_id} value={base.document_base_id}>
                      {base.base_name}
                    </option>
                  ))
                )}
              </select>
              {loadingDocumentBases && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <label htmlFor="folder-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("uploadModal.selectFolder")}
            </label>
            <div className="relative">
              <select
                id="folder-select"
                value={selectedFolderId}
                onChange={handleFolderChange}
                disabled={!selectedDocumentBaseId || currentFolders.length === 0 || isUploading}
                className="input-base w-full appearance-none pr-8"
              >
                <option value="" disabled>
                  {t("uploadModal.chooseFolder")}
                </option>
                {selectedDocumentBaseId && currentFolders.length === 0 ? (
                  <option disabled>{t("uploadModal.noFolders")}</option>
                ) : (
                  currentFolders.map((folder) => (
                    <option key={folder.folder_id} value={folder.folder_id}>
                      {folder.folder_name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Dialog Footer */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 space-y-2 space-y-reverse sm:space-y-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="btn-secondary h-10 px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className="btn-primary h-10 px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> {t("documentStatus.uploading")}
              </>
            ) : (
              t("documentStatus.upload")
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default UploadModal