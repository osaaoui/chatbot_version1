"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, UploadCloud, FileText, Send } from "lucide-react";
import { SelectorIA } from "../ui/SelectorIA"; 
import Separator from "../ui/Separator";

const ChatInput = ({ question, onQuestionChange, onSubmit, isLoading, currentConversation, onFilesDropped,
}) => {
  const { t } = useTranslation();
  const textareaRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [enableDocumentReading, setEnableDocumentReading] = useState(true);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isLoading]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        onFilesDropped(files);
      }
    },
    [onFilesDropped],
  );

  return (
    <footer className="flex-shrink-0 border-t px-6 py-3" style={{ 
      borderColor: 'var(--border-light)', 
      backgroundColor: 'var(--bg-primary)' 
    }}>
      <div
        className={`relative flex items-center gap-3 p-3 rounded-2xl border-2 transition-all duration-200 shadow-sm ${
          isDragOver ? "border-blue-500" : ""
        }`}
        style={{
          backgroundColor: isDragOver ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-primary)',
          borderColor: isDragOver ? '#3b82f6' : 'var(--border-light)'
        }}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 rounded-2xl" style={{
            backgroundColor: 'rgba(59, 130, 246, 0.15)'
          }}>
            <UploadCloud className="w-8 h-8 text-blue-600 mb-2" />
            <p className="text-blue-700 font-medium">{t("chat.dropFilesHere")}</p>
          </div>
        )}

        <textarea
          ref={textareaRef}
          rows={1}
          value={question}
          onChange={onQuestionChange}
          onKeyDown={handleKeyDown}
          placeholder={currentConversation ? t("chat.continueConversationPlaceholder") : t("chat.askToStart")}
          className="flex-1 resize-none bg-transparent border-none outline-none text-sm leading-6 max-h-32"
          style={{ 
            minHeight: '24px',
            color: 'var(--text-primary)',
          }}
          disabled={isLoading}
        />

        <div className="flex items-center gap-3">
          {/* Document Reading Toggle */}
          <div className="flex items-center">
            <button
              onClick={() => setEnableDocumentReading(!enableDocumentReading)}
              className={`group flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                enableDocumentReading 
                  ? 'text-blue-700 hover:bg-blue-100' 
                  : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: enableDocumentReading ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-secondary)',
                borderColor: enableDocumentReading ? '#3b82f6' : 'var(--border-light)',
                color: enableDocumentReading ? '#1d4ed8' : 'var(--text-secondary)'
              }}
              title={enableDocumentReading ? t("chat.disconnectDocumentBase") : t("chat.connectDocumentBase")}
            >
              <FileText 
                className="w-3.5 h-3.5 transition-colors" 
                style={{
                  color: enableDocumentReading ? '#2563eb' : 'var(--text-tertiary)'
                }}
              />
              <span>{t("chat.readDocs")}</span>
              <div 
                className="w-2 h-2 rounded-full transition-colors"
                style={{
                  backgroundColor: enableDocumentReading ? '#3b82f6' : 'var(--text-tertiary)'
                }}
              />
            </button>
          </div>

          <Separator orientation="vertical" />

          <SelectorIA />
          
        </div>

        <button
          onClick={onSubmit}
          disabled={!question.trim() || isLoading}
          className="flex-shrink-0 p-2.5 rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
          style={{
            backgroundColor: (!question.trim() || isLoading) ? 'var(--text-tertiary)' : '#3b82f6',
            color: 'white',
            cursor: (!question.trim() || isLoading) ? 'not-allowed' : 'pointer'
          }}
          title={t("chat.sendButton")}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
      
      <div className="flex items-center justify-between mt-3 px-2">
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          {t("chat.enterToSend")}
        </p>
        {/* Mostrar siempre el estado de la base de documentos */}
        <div className="flex items-center gap-1.5">
          <div 
            className={`w-1.5 h-1.5 rounded-full ${
              enableDocumentReading ? 'bg-green-500' : 'bg-amber-500 animate-pulse'
            }`}
          />
          <p 
            className={`text-xs font-medium ${
              enableDocumentReading ? 'text-green-600' : 'text-amber-600'
            }`}
          >
            {enableDocumentReading ? t("chat.documentBaseConnected") : t("chat.documentBaseDisconnected")}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default ChatInput;