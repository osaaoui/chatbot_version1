import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from 'react-i18next';
import { UserCircle, Bot, PanelLeft, X } from "lucide-react";

function ChatPane({ 
  question, 
  answer, 
  onQuestionChange, 
  onSend, 
  sources, 
  toggleSidebar, 
  setSelectedSource, 
  selectedSource, 
  onClosePDF,
  sidebarOpen
}) {
  const { t } = useTranslation();
  const [chatHistory, setChatHistory] = useState([]);
  const chatEndRef = useRef(null);
  
  useEffect(() => {
    if (chatEndRef.current) {
      const chatContainer = chatEndRef.current.closest('.overflow-y-auto');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }
  }, [chatHistory]);
  
  const handleSourceClick = (source) => {
    setSelectedSource({
      filename: source.metadata?.source,
      page: source.metadata?.page,
      snippet: source.snippet || source.content || ""
    });
  };
  
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitQuestion();
    }
  };
  
  const submitQuestion = () => {
    const trimmed = question.trim();
    if (!trimmed) return;
    setChatHistory((prev) => [
      ...prev,
      { type: "user", text: trimmed, time: new Date() },
    ]);
    onQuestionChange({ target: { value: "" } });
    onSend();
  };
  
  useEffect(() => {
    if (answer) {
      setChatHistory((prev) => [
        ...prev,
        { type: "bot", text: answer, time: new Date() },
      ]);
    }
  }, [answer]);

  return (
    <div className="chat-container flex flex-col h-full bg-bg-primary relative border-r border-border-light">
      <div className="flex-shrink-0 p-2 border-b border-border-light bg-bg-primary relative">
        <div className="flex items-center gap-2">
          {!sidebarOpen && (
            <button
              onClick={toggleSidebar}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-bg-tertiary text-text-secondary h-7 w-7"
              title={t('chat.toggleSidebar')}
            >
              <PanelLeft />
              <span className="sr-only">{t('chat.toggleSidebar')}</span>
            </button>
          )}

          {selectedSource && (
            <button
              onClick={onClosePDF}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-bg-tertiary text-text-secondary h-7 w-7"
              title={t('chat.closePDF', 'Close PDF')}
            >
              <X />
              <span className="sr-only">{t('chat.closePDF', 'Close PDF')}</span>
            </button>
          )}
        </div>
      </div>
      
      <main className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {chatHistory.length === 0 ? (
          <p className="text-text-tertiary italic">{t('chat.askToStart')}</p>
        ) : (
          chatHistory.map((msg, idx) => {
            const isLastBot = msg.type === "bot" && idx === chatHistory.length - 1;
            return (
              <div key={idx} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                {msg.type === "bot" && (
                  <div className="flex items-end mr-2">
                    <Bot className="w-5 h-5 text-text-tertiary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-4 py-3 text-sm ${
                    msg.type === "user"
                      ? "bg-secondary text-text-primary rounded-2xl rounded-br-none"
                      : "text-text-primary rounded-2xl rounded-bl-none"
                  }`}
                >
                  <div>
                    {msg.text}
                    {isLastBot && sources?.length > 0 && (
                      <span className="ml-1">
                        {sources.map((source, sidx) => (
                          <button
                            key={sidx}
                            onClick={() => handleSourceClick(source)}
                            className="text-text-primary hover:text-primary-dark text-xs ml-1 underline"
                            title={`${t('chat.source')} ${sidx + 1}`}
                          >
                            [{sidx + 1}]
                          </button>
                        ))}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-text-tertiary text-right mt-1">
                    {msg.time.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                {msg.type === "user" && (
                  <div className="flex items-end ml-2">
                    <UserCircle className="w-5 h-5 text-text-tertiary" />
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </main>
      
      <footer className="flex-shrink-0 border-t border-border-light px-6 py-3 bg-bg-primary">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            submitQuestion();
          }}
        >
          <textarea
            rows={1}
            value={question}
            onChange={onQuestionChange}
            onKeyDown={handleKeyDown}
            placeholder={t('chat.askAboutDocuments')}
            className="input-base flex-1 resize-none rounded-full"
          />
          <button
            type="submit"
            className="p-2 rounded-full bg-secondary hover:bg-bg-tertiary text-text-primary transition-colors"
            title={t('common.confirm')}
          >
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
          </button>
        </form>
        <p className="text-[10px] text-text-tertiary mt-1">
          {t('chat.enterToSend')}
        </p>
      </footer>
    </div>
  );
}

export default ChatPane;