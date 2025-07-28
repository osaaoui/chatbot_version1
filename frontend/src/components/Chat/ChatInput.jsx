"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Loader2,
  UploadCloud,
  Send,
  Database,
  DatabaseZap,
} from "lucide-react";
import { SelectorIA } from "../ui/SelectorIA";
import Separator from "../ui/Separator";

const ChatInput = React.memo(({
  question,
  onQuestionChange,
  onSubmit,
  isLoading,
  currentConversation,
  onFilesDropped,
}) => {
  const { t } = useTranslation();
  const textareaRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [enableDocumentReading, setEnableDocumentReading] = useState(true);
  
  // Estado local para el input - esto elimina los re-renders del padre
  const [localValue, setLocalValue] = useState(question || "");
  const debounceRef = useRef(null);

  // Sincronizar con la prop externa solo cuando sea necesario
  useEffect(() => {
    if (question !== localValue) {
      setLocalValue(question || "");
    }
  }, [question]); // Solo cuando la prop question cambie desde el padre

  // Handler optimizado que solo actualiza el estado local
  const handleInputChange = useCallback((e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    // Debounce para notificar al padre (opcional)
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      onQuestionChange(e); // Solo notificar al padre después del debounce
    }, 100);
  }, [onQuestionChange]);

  // Handler de keydown optimizado
  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // Asegurar que el valor esté sincronizado antes del submit
      if (localValue.trim()) {
        // Crear un evento sintético con el valor actual
        const syntheticEvent = {
          target: { value: localValue }
        };
        onQuestionChange(syntheticEvent);
        setTimeout(() => onSubmit(), 0);
      }
    }
  }, [localValue, onQuestionChange, onSubmit]);

  // Optimizar el focus effect
  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Drag and drop handlers (sin cambios)
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

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFilesDropped(files);
    }
  }, [onFilesDropped]);

  const handleSubmitClick = useCallback(() => {
    if (localValue.trim() && !isLoading) {
      // Sincronizar valor antes del submit
      const syntheticEvent = {
        target: { value: localValue }
      };
      onQuestionChange(syntheticEvent);
      setTimeout(() => onSubmit(), 0);
    }
  }, [localValue, isLoading, onQuestionChange, onSubmit]);

  // Placeholder memoizado
  const placeholder = currentConversation
    ? t("chat.continueConversationPlaceholder")
    : t("chat.askToStart");

  return (
    <footer
      className="flex-shrink-0 border-t px-6 py-3"
      style={{
        borderColor: "var(--border-light)",
        backgroundColor: "var(--bg-primary)",
      }}
    >
      <div
        className={`relative flex items-center gap-3 p-3 rounded-2xl border-2 transition-all duration-200 shadow-sm ${
          isDragOver ? "border-blue-500" : ""
        }`}
        style={{
          backgroundColor: isDragOver
            ? "rgba(59, 130, 246, 0.1)"
            : "var(--bg-primary)",
          borderColor: isDragOver ? "#3b82f6" : "var(--border-light)",
        }}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragOver && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center z-10 rounded-2xl"
            style={{
              backgroundColor: "rgba(59, 130, 246, 0.15)",
            }}
          >
            <UploadCloud className="w-8 h-8 text-blue-600 mb-2" />
            <p className="text-blue-700 font-medium">
              {t("chat.dropFilesHere")}
            </p>
          </div>
        )}

        <textarea
          ref={textareaRef}
          rows={1}
          value={localValue} // Usar el valor local
          onChange={handleInputChange} // Usar el handler local
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 resize-none bg-transparent border-none outline-none text-sm leading-6 max-h-32"
          style={{
            minHeight: "2.5rem",
            color: "var(--text-primary)",
             border: "none",
            outline: "none",
            boxShadow: "none",
            WebkitScrollSnapType: "none",
            scrollSnapType: "none",
            scrollbarWidth: "none",
          }}
          disabled={isLoading}
        />

        <div className="flex flex-col items-center gap-2">
          <SelectorIA />
        
        </div>

        <Separator orientation="vertical" />

        <button
          onClick={handleSubmitClick}
          disabled={!localValue.trim() || isLoading}
          className="flex-shrink-0 p-2.5 rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
          style={{
            backgroundColor: !localValue.trim() || isLoading ? "var(--text-tertiary)" : "#3b82f6",
            color: "white",
            cursor: !localValue.trim() || isLoading ? "not-allowed" : "pointer",
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
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          {t("chat.enterToSend")}
        </p>
        <div className="flex items-center gap-1.5">
            <button
            onClick={() => setEnableDocumentReading(!enableDocumentReading)}
            className="flex items-center gap-2 px-1 py-1 rounded-full text-xs font-medium transition-all duration-200"
            style={{
              backgroundColor: enableDocumentReading
                ? "var(--color-secondary-dark)"
                : "var(--bg-tertiary)",
              color: enableDocumentReading
                ? "var(--text-primary)"
                : "var(--text-secondary)",
              border: `1px solid ${
                enableDocumentReading
                  ? "var(--border-medium)"
                  : "var(--border-light)"
              }`,
            }}
            title={
              enableDocumentReading
                ? t("chat.disconnectDocumentBase")
                : t("chat.connectDocumentBase")
            }
          >
            {enableDocumentReading ? (
              <>
                <DatabaseZap className="h-3.5 w-3.5" />
                <div
                  className="w-2 h-2 rounded-full ml-1"
                  style={{ backgroundColor: "var(--color-success)" }}
                />
              </>
            ) : (
              <>
                <Database className="h-3.5 w-3.5" />
                <div
                  className="w-2 h-2 rounded-full ml-1"
                  style={{ backgroundColor: "var(--text-tertiary)" }}
                />
              </>
            )}
          </button>
          <p
            className={`text-xs font-medium ${
              enableDocumentReading ? "text-green-600" : "text-amber-600"
            }`}
          >
            {enableDocumentReading
              ? t("chat.documentBaseConnected")
              : t("chat.documentBaseDisconnected")}
          </p>
        </div>
      </div>
    </footer>
  );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput;