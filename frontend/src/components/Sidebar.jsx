import React, { useRef, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import axios from "axios";
import { DocumentIcon, ArrowUpTrayIcon, TrashIcon } from "@heroicons/react/24/outline";

const Sidebar = ({
  stagedFiles,
  setStagedFiles,
  email,
  onProcess,
  onFileSelected,
  isProcessing,
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);
  
  // 👇 Fetch persisted document names on first load
  useEffect(() => {
    console.log("Sidebar mounted. email =", email);
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
        } else {
          console.warn("Unexpected response from /user-documents:", response.data);
        }
      } catch (error) {
        console.error("Failed to load user documents:", error);
      }
    };
    if (email) {
      fetchPersistedDocs();
    }
  }, [email]);
  
  // When user picks a file using the input element
  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    handleUpload(files);
  };
  
  // Drag & drop behavior
  const handleDrop = (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    handleUpload(files);
  };
  
  const handleDragOver = (event) => {
    event.preventDefault();
  };
  
  // Upload each file to the backend and update UI state
  const handleUpload = async (files) => {
    for (const file of files) {
      const tempRecord = {
        name: file.name,
        original: file.name,
        status: "uploading",
      };
      // Immediately show file with 'uploading' status
      setStagedFiles((prev) => [...prev, tempRecord]);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("user_id", email);
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
        const uploadedName = response.data.filename || file.name;
        // Update file record to 'uploaded'
        setStagedFiles((prev) =>
          prev.map((f) =>
            f.name === file.name
              ? { ...f, name: uploadedName, status: "uploaded" }
              : f
          )
        );
        if (onFileSelected)
          onFileSelected({ name: uploadedName, original: file.name });
      } catch (err) {
        console.error("Error uploading file:", file.name, err);
        // Mark the file as failed
        setStagedFiles((prev) =>
          prev.map((f) =>
            f.name === file.name ? { ...f, status: "error" } : f
          )
        );
      }
    }
  };

  // Function to get localized status text
  const getStatusText = (status) => {
    return t(`fileStatus.${status}`, { defaultValue: status });
  };

  return (
    <div className="bg-app fixed left-0 top-[48px] flex flex-col items-center w-[280px] h-[calc(100vh-48px)] px-4 pt-8 pb-6 border-r border-border-light">
      {/* Header with icon */}
      <h2 className="flex items-center gap-2 text-base font-semibold text-body mb-8">
        <DocumentIcon className="w-5 h-5 text-tertiary" />
        {t('documents.title')}
      </h2>
      
      {/* Upload area */}
      <div
        className="w-full border-2 border-dashed border-border-medium rounded-lg p-4 text-center cursor-pointer hover:border-primary transition"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current.click()}
      >
        <ArrowUpTrayIcon className="mx-auto w-6 h-6 text-caption mb-2" />
        <p className="text-body text-sm">
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
      
      {/* Uploaded files */}
      <div className="mt-8 w-full text-sm text-body flex-1 overflow-y-auto">
        {stagedFiles.length === 0 ? (
          <div className="flex flex-col items-center text-caption mt-4">
            <DocumentIcon className="w-5 h-5 mb-1" />
            <span>{t('documents.noDocuments')}</span>
          </div>
        ) : (
          <ul className="mt-2">
            {stagedFiles.map((file, index) => (
              <li
                key={index}
                className="flex justify-between items-center py-1 px-2 hover:bg-bg-tertiary rounded"
              >
                <span className="truncate">{file.original}</span>
                <span
                  className={`ml-2 text-xs font-medium ${
                    file.status === "uploaded"
                      ? "success"
                      : file.status === "uploading"
                      ? "warning"
                      : file.status === "processed"
                      ? "text-text-primary font-semibold"
                      : "error"
                  }`}
                >
                  {getStatusText(file.status)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Visual Processing Bar */}
      {isProcessing && (
        <div className="w-full my-4">
          <div className="relative w-full h-2 bg-bg-tertiary rounded overflow-hidden">
            <div className="absolute inset-0 bg-bg-green animate-pulse w-1/2 rounded"></div>
          </div>
          <p className="text-xs text-center text-text-primary mt-2">
            {t('documents.processingDocuments')}
          </p>
        </div>
      )}
      
      {/* Process Documents button */}
      {stagedFiles.length > 0 && (
        <button
          onClick={() => {
            console.log("🟢 Sidebar: Process button clicked");
            onProcess();
          }}
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
  );
};

export default Sidebar;