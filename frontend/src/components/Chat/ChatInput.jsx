"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, UploadCloud } from "lucide-react";
import { SelectorIA, AI_MODELS } from "../ui/SelectorIA"; 

const ChatInput = ({ question, onQuestionChange, onSubmit, isLoading, currentConversation, onFilesDropped,
}) => {
  const { t } = useTranslation();
  const textareaRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

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
    <footer className="flex-shrink-0 border-t border-border-light px-6 bg-bg-primary">
      <div
        className={`relative flex items-center gap-2 p-2 rounded-lg border-2 transition-all duration-200 ${
          isDragOver ? "border-blue-500 bg-blue-50" : "border-transparent"
        }`}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-100 bg-opacity-90 z-10 rounded-lg">
            <UploadCloud className="w-8 h-8 text-blue-600 mb-2" />
            <p className="text-blue-700 font-medium">{t("chat.dropFilesHere")}</p>
          </div>
        )}
        
        <SelectorIA />

        <textarea
          ref={textareaRef}
          rows={1}
          value={question}
          onChange={onQuestionChange}
          onKeyDown={handleKeyDown}
          placeholder={currentConversation ? t("chat.continueConversationPlaceholder") : t("chat.askToStart")}
          className="input-base flex-1 resize-none rounded-full"
          disabled={isLoading}
        />
        <button
          onClick={onSubmit}
          disabled={!question.trim() || isLoading}
          className="p-2 rounded-full bg-bg-secondary-dark hover:bg-bg-secondary text-text-primary transition-colors disabled:opacity-50"
          title={t("chat.sendButton")}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          )}
        </button>
      </div>
      <div className="flex items-center justify-between mt-1">
        <p className="text-[10px] text-text-tertiary">{t("chat.enterToSend")}</p>
      </div>
    </footer>
  );
};

export default ChatInput;