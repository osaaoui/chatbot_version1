import React from 'react';
import { Loader2 } from 'lucide-react';

const ChatInput = ({ 
  question, 
  onQuestionChange, 
  onSubmit, 
  isLoading, 
  currentConversation 
}) => {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <footer className="flex-shrink-0 border-t border-border-light px-6 py-3 bg-bg-primary">
      <div className="flex items-center gap-2">
        <textarea
          rows={1}
          value={question}
          onChange={onQuestionChange}
          onKeyDown={handleKeyDown}
          placeholder={
            currentConversation 
              ? "Continúa la conversación..." 
              : "Haz una pregunta para comenzar..."
          }
          className="input-base flex-1 resize-none rounded-full"
          disabled={isLoading}
        />
        <button
          onClick={onSubmit}
          disabled={!question.trim() || isLoading}
          className="p-2 rounded-full bg-secondary hover:bg-bg-tertiary text-text-primary transition-colors disabled:opacity-50"
          title="Enviar"
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 12h14M12 5l7 7-7 7"
              />
            </svg>
          )}
        </button>
      </div>
      <p className="text-[10px] text-text-tertiary mt-1">
        Presiona Enter para enviar, Shift+Enter para nueva línea
      </p>
    </footer>
  );
};

export default ChatInput;