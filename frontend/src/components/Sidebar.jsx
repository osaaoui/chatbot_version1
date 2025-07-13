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
            {t('sidebar.bases')}
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
      </div>

      <div className="w-full flex-1 overflow-y-auto">
        <DocumentBaseManager 
          onProcessFiles={onProcess}
          isProcessing={isProcessing}
          stagedFiles={stagedFiles}
          setStagedFiles={setStagedFiles}
          userEmail={email}
        />
      </div>

      {/* Botón de procesar siempre visible */}
      <div className="w-full mt-4">
        {isProcessing && (
          <div className="w-full mb-4">
            <div className="relative w-full h-2 bg-bg-tertiary rounded-md overflow-hidden">
              <div className="absolute inset-0 bg-success animate-pulse w-1/2 rounded-md"></div>
            </div>
            <p className="text-xs text-center text-text-primary mt-2">
              {t('documents.processingDocuments')}
            </p>
          </div>
        )}

        <button
          onClick={onProcess}
          disabled={isProcessing}
          className={`w-full transition ${
            isProcessing
              ? "btn-secondary opacity-50 cursor-not-allowed"
              : "btn-secondary"
          }`}
        >
          {isProcessing ? t('common.processing') : t('documents.processDocuments')}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;