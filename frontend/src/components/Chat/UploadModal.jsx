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
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        {/* Dialog Header */}
        <div className="flex flex-col space-y-1.5 text-center sm:text-left">
          <h2 className="text-lg font-semibold leading-none tracking-tight">{t("uploadModal.title")}</h2>
        </div>

        {/* Dialog Content */}
        <div className="grid gap-4 py-4">
          <p className="text-sm text-gray-600">
            {t("uploadModal.filesToUpload")}: {files.map((f) => f.name).join(", ")}
          </p>

          <div className="grid gap-2">
            <label htmlFor="document-base-select" className="text-sm font-medium">
              {t("uploadModal.selectDocumentBase")}
            </label>
            <div className="relative">
              <select
                id="document-base-select"
                value={selectedDocumentBaseId}
                onChange={handleDocumentBaseChange}
                disabled={loadingDocumentBases || isUploading}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
              >
                <option value="" disabled>
                  {t("uploadModal.chooseDocumentBase")}
                </option>
                {loadingDocumentBases ? (
                  <option disabled>
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" /> {t("common.loading")}
                    </div>
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
            </div>
          </div>

          <div className="grid gap-2">
            <label htmlFor="folder-select" className="text-sm font-medium">
              {t("uploadModal.selectFolder")}
            </label>
            <div className="relative">
              <select
                id="folder-select"
                value={selectedFolderId}
                onChange={handleFolderChange}
                disabled={!selectedDocumentBaseId || currentFolders.length === 0 || isUploading}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
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
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
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
