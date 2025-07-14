import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from 'react-i18next';
import { UserCircle, Bot, PanelLeft} from "lucide-react";
import ReactMarkdown from 'react-markdown';

function ChatPane({ 
  question, 
  answer, 
  onQuestionChange, 
  onSend, 
  sources, 
  toggleSidebar, 
  setSelectedSource
}) {
  const { t } = useTranslation();
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);
  
  useEffect(() => {
    if (chatEndRef.current) {
      const chatContainer = chatEndRef.current.closest('.overflow-y-auto');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }
  }, [chatHistory, isLoading]);
  
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
    setIsLoading(true);
    onSend();
  };

  const renderFormattedAnswer = (text) => {
  const lines = text.split(/(?:\r?\n|\s{2,})+/); // break on newlines or double spaces

  const elements = [];
  let currentListItems = [];
  let buffer = [];

  const flushBuffer = () => {
    if (buffer.length) {
      <p key={`p-${elements.length}`}>
  <ReactMarkdown components={{ p: ({ children }) => <>{children}</> }}>
    {buffer.join(" ")}
  </ReactMarkdown>
</p>
      buffer = [];
    }
  };

  const flushList = () => {
    if (currentListItems.length > 0) {
      elements.push(
        <ul className="list-disc pl-6 mb-2" key={`ul-${elements.length}`}>
          {currentListItems.map((item, idx) => (
         <li key={`li-${elements.length}-${idx}`}>
  <ReactMarkdown components={{ p: ({ children }) => <>{children}</> }}>
    {item}
  </ReactMarkdown>
</li>


          ))}
        </ul>
      );
      currentListItems = [];
    }
  };

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    if (/^###/.test(line)) {
      flushBuffer();
      flushList();
      const headingText = line.replace(/^###\s*/, "");
      elements.push(
        <h3
          key={`h3-${elements.length}`}
          className="text-lg font-semibold mt-4 mb-2"
        >
          {headingText}
        </h3>
      );
    } else if (/^- /.test(line)) {
      flushBuffer();
      currentListItems.push(line.replace(/^- /, "").trim());
    } else {
      buffer.push(line);
    }
  }

  flushBuffer();
  flushList();

  return <>{elements}</>;
};

  
  useEffect(() => {
    if (answer) {
      setIsLoading(false);
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
            <button
              onClick={toggleSidebar}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-bg-tertiary text-text-secondary h-7 w-7"
              title={t('chat.toggleSidebar')}
            >
              <PanelLeft />
              <span className="sr-only">{t('chat.toggleSidebar')}</span>
            </button>
            <h3>{t('chat.title')}</h3>
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
                  className={`max-w-[70%] px-4 py-3 text-sm ${
                    msg.type === "user"
                      ? "bg-secondary text-text-primary rounded-2xl rounded-br-none"
                      : "text-text-primary rounded-2xl rounded-bl-none"
                  }`}
                >
                  <div>
                   <div className="prose prose-sm max-w-none">
                      {renderFormattedAnswer(msg.text)}
                    </div>



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
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-end mr-2">
              <Bot className="w-5 h-5 text-text-tertiary" />
            </div>
            <div className="max-w-[80%] px-4 py-3 text-sm text-text-primary rounded-2xl rounded-bl-none">
              <div className="loading-animation">
                <div className="loading-dots">
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                </div>
              </div>
            </div>
          </div>
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