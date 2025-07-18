import React, { useEffect } from "react";
import { useTranslation } from 'react-i18next';
import axios from "axios";
import { 
  DocumentIcon
} from "@heroicons/react/24/outline";

import DocumentBaseManager from './DocumentBase/DocumentBaseManager';

const Sidebar = ({
  stagedFiles,
  setStagedFiles,
  email,
  onProcess,
  isProcessing,
}) => {
  const { t } = useTranslation();
  
  useEffect(() => {
    const fetchPersistedDocs = async () => {
      try {
        const response = await axios.get(import.meta.env.VITE_API_URL + "/api/user-documents", {
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
  
 
  return (
    <div className="bg-bg-secondary flex flex-col items-center w-80 h-full px-4 pt-6 pb-6 border-r border-border-light flex-shrink-0">
      <div className="w-full mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-text-secondary">
            <DocumentIcon className="w-5 h-5 text-text-tertiary" />
            {t('sidebar.bases')}
          </h2>
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
          className={`w-full px-4 py-2 border rounded-md transition font-medium ${
            isProcessing
              ? "bg-bg-primary cursor-not-allowed"
              : "bg-bg-primary hover:bg-bg-tertiary"
          }`}
        >
          {isProcessing ? t('common.processing') : t('documents.processDocuments')}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;