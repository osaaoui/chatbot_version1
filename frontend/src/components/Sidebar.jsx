import React, { useRef, useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import axios from "axios";
import { 
  DocumentIcon, 
  ArrowUpTrayIcon
} from "@heroicons/react/24/outline";
import { PanelLeft } from "lucide-react";
import DocumentBaseManager from './DocumentBase/DocumentBaseManager';

const Sidebar = ({
  stagedFiles,
  setStagedFiles,
  email,
  onProcess,
  onFileSelected,
  isProcessing,
  toggleSidebar,
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('uploads');
  
  useEffect(() => {
    const fetchPersistedDocs = async () => {
      try {
        const response = await axios.get("http://localhost:8001/api/user-documents", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (Array.isArray(response.data)) {
          const existingNames = new Set(
            stagedFiles.flatMap((f) => [f.name, f.original])
          );
          const docsToAdd = response.data.filter(
            (name) => !existingNames.has(name)
          );
          const restored = docsToAdd.map((name) => ({
            name,
            original: name,
            status: "processed",
          }));
          const merged = [...restored, ...stagedFiles];
          // Deduplicate by name, preferring processed status
          const deduplicated = Array.from(
            merged.reduce((map, file) => {
              const existing = map.get(file.name);
              if (!existing || file.status === "processed") {
                map.set(file.name, file);
              }
              return map;
            }, new Map())
            .values()
          );
          setStagedFiles(deduplicated);
        }
      } catch (error) {
        console.error("Failed to load user documents:", error);
      }
    };
    if (email) {
      fetchPersistedDocs();
    }
  }, [email]);
  
  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    handleUpload(files);
  };
  
  const handleDrop = (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    handleUpload(files);
  };
  
  const handleDragOver = (event) => {
    event.preventDefault();
  };
  
  const handleUpload = async (files) => {
    // 🔥 CAMBIA ESTOS UUIDs POR LOS DE TU BASE DE DATOS 🔥
    const DOCUMENT_BASE_ID = "49bd7249-ed70-47d4-9660-67775b674f3e"; 
    const FOLDER_ID = "db82cde7-40ac-46ce-97d7-2f1826cff46b"; 
    
    for (const file of files) {
      const tempRecord = {
        name: file.name,
        original: file.name,
        status: "uploading",
      };
      setStagedFiles((prev) => [...prev, tempRecord]);
      
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("document_base_id", DOCUMENT_BASE_ID);
        
        // Solo agregar folder_id si no es null
        if (FOLDER_ID) {
          formData.append("folder_id", FOLDER_ID);
        }
        
        // Para PDFs, podrías calcular o estimar las páginas
        // Por ahora lo dejamos opcional
        // formData.append("num_pages", estimatedPages);
        
        const response = await axios.post(
          "http://localhost:8001/api/v2/uploads/upload/",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        
        setStagedFiles((prev) =>
          prev.map((f) =>
            f.name === file.name
              ? { ...f, status: "uploaded", documentId: response.data.document_id }
              : f
          )
        );
        
        if (onFileSelected)
          onFileSelected({ name: file.name, original: file.name, documentId: response.data.document_id });
          
      } catch (err) {
        console.error("Error uploading file:", file.name, err);
        setStagedFiles((prev) =>
          prev.map((f) =>
            f.name === file.name ? { ...f, status: "error" } : f
          )
        );
      }
    }
  };

  const getStatusText = (status) => {
    return t(`fileStatus.${status}`, { defaultValue: status });
  };

  return (
    <div className="bg-bg-secondary flex flex-col items-center w-80 h-full px-4 pt-6 pb-6 border-r border-border-light flex-shrink-0">
      <div className="w-full mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-text-secondary">
            <DocumentIcon className="w-5 h-5 text-text-tertiary" />
            {t('documents.title')}
          </h2>
          
          <button
            onClick={toggleSidebar}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-bg-tertiary text-text-secondary h-7 w-7"
            title={t('chat.toggleSidebar')}
          >
            <PanelLeft />
            <span className="sr-only">{t('chat.toggleSidebar')}</span>
          </button>
        </div>
        
        <div className="flex bg-bg-tertiary rounded-lg p-1">
          <button
            onClick={() => setActiveTab('uploads')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition ${
              activeTab === 'uploads'
                ? 'bg-bg-primary text-text-primary shadow-soft'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t('sidebar.uploads')}
          </button>
          <button
            onClick={() => setActiveTab('bases')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition ${
              activeTab === 'bases'
                ? 'bg-bg-primary text-text-primary shadow-soft'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t('sidebar.bases')}
          </button>
        </div>
      </div>

      <div className="w-full flex-1 overflow-y-auto">
        {activeTab === 'uploads' ? (
          <div className="flex flex-col h-full">
            <div
              className="w-full border-2 border-dashed border-border-medium rounded-lg p-4 text-center cursor-pointer hover:border-primary-dark transition mb-6"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current.click()}
            >
              <ArrowUpTrayIcon className="mx-auto w-6 h-6 text-text-tertiary mb-2" />
              <p className="text-text-secondary text-sm">
                {t('documents.dropHere')} <br /> {t('documents.orClickToBrowse')}
              </p>
              <button className="btn-secondary mt-2">
                {t('documents.chooseFile')}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.txt,.docx"
                className="hidden"
              />
            </div>
            
            <div className="text-sm text-text-secondary flex-1 overflow-y-auto">
              {stagedFiles.length === 0 ? (
                <div className="flex flex-col items-center text-text-tertiary mt-4">
                  <DocumentIcon className="w-5 h-5 mb-1" />
                  <span>{t('documents.noDocuments')}</span>
                </div>
              ) : (
                <ul className="space-y-1">
                  {stagedFiles.map((file, index) => (
                    <li
                      key={index}
                      className="flex justify-between items-center py-2 px-3 hover:bg-bg-tertiary rounded-md"
                    >
                      <span className="truncate text-sm">{file.original}</span>
                      <span
                        className={`ml-2 text-xs font-medium ${
                          file.status === "uploaded"
                            ? "text-success"
                            : file.status === "uploading"
                            ? "text-warning"
                            : file.status === "processed"
                            ? "text-text-primary font-semibold"
                            : "text-error"
                        }`}
                      >
                        {getStatusText(file.status)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {isProcessing && (
              <div className="w-full my-4">
                <div className="relative w-full h-2 bg-bg-tertiary rounded-md overflow-hidden">
                  <div className="absolute inset-0 bg-success animate-pulse w-1/2 rounded-md"></div>
                </div>
                <p className="text-xs text-center text-text-primary mt-2">
                  {t('documents.processingDocuments')}
                </p>
              </div>
            )}
            
            {stagedFiles.length > 0 && (
              <button
                onClick={onProcess}
                disabled={isProcessing}
                className={`mt-4 w-full transition ${
                  isProcessing
                    ? "btn-secondary opacity-50 cursor-not-allowed"
                    : "btn-secondary"
                }`}
              >
                {isProcessing ? t('common.processing') : t('documents.processDocuments')}
              </button>
            )}
          </div>
        ) : (
          <div className="w-full h-full overflow-y-auto">
            <DocumentBaseManager 
              onProcessFiles={onProcess}
              isProcessing={isProcessing}
              stagedFiles={stagedFiles}
              setStagedFiles={setStagedFiles}
              userEmail={email}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;