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
    // Convertir el texto a formato markdown válido
    const preprocessMarkdown = (text) => {
      const lines = text.split(/\r?\n/);
      const processedLines = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();
        
        // Si es una línea vacía, agregarla tal como está
        if (!trimmedLine) {
          processedLines.push('');
          continue;
        }
        
        // Detectar encabezados que no tengan espacio después de ###
        if (/^#{1,6}[^#\s]/.test(trimmedLine)) {
          const hashCount = trimmedLine.match(/^#+/)[0].length;
          const headingText = trimmedLine.substring(hashCount).trim();
          processedLines.push('#'.repeat(hashCount) + ' ' + headingText);
          continue;
        }
        
        // Detectar listas numeradas y asegurar formato correcto
        if (/^\d+\.\s/.test(trimmedLine)) {
          processedLines.push(trimmedLine);
          continue;
        }
        
        // Detectar listas con guiones/asteriscos
        if (/^[-*+]\s/.test(trimmedLine)) {
          processedLines.push(trimmedLine);
          continue;
        }
        
        // Para cualquier otra línea, agregarla tal como está
        processedLines.push(line);
      }
      
      return processedLines.join('\n');
    };

    const markdownText = preprocessMarkdown(text);
    
    return (
      <ReactMarkdown
        components={{
          // Personalizar encabezados
          h1: ({ children }) => (
            <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-bold mt-4 mb-2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold mt-4 mb-2">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-semibold mt-3 mb-2">{children}</h4>
          ),
          h5: ({ children }) => (
            <h5 className="text-sm font-semibold mt-3 mb-2">{children}</h5>
          ),
          h6: ({ children }) => (
            <h6 className="text-sm font-medium mt-3 mb-2">{children}</h6>
          ),
          
          // Personalizar párrafos
          p: ({ children }) => (
            <p className="mb-3 last:mb-0">{children}</p>
          ),
          
          // Personalizar listas ordenadas
          ol: ({ children }) => (
            <ol className="list-decimal list-outside pl-6 mb-4 space-y-1">
              {children}
            </ol>
          ),
          
          // Personalizar listas no ordenadas
          ul: ({ children }) => (
            <ul className="list-disc list-outside pl-6 mb-4 space-y-1">
              {children}
            </ul>
          ),
          
          // Personalizar elementos de lista
          li: ({ children }) => (
            <li className="mb-1 leading-relaxed">
              {children}
            </li>
          ),
          
          // Personalizar texto en negrita
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
          
          // Personalizar texto en cursiva
          em: ({ children }) => (
            <em className="italic">{children}</em>
          ),
          
          // Personalizar código inline
          code: ({ children }) => (
            <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-sm font-mono">
              {children}
            </code>
          ),
          
          // Personalizar bloques de código
          pre: ({ children }) => (
            <pre className="bg-gray-100 p-3 rounded-md overflow-x-auto mb-4">
              {children}
            </pre>
          ),
          
          // Personalizar enlaces
          a: ({ href, children }) => (
            <a 
              href={href} 
              className="text-blue-600 hover:text-blue-800 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          
          // Personalizar citas
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 pl-4 italic mb-4">
              {children}
            </blockquote>
          )
        }}
      >
        {markdownText}
      </ReactMarkdown>
    );
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
                    <div className=" text-dark flex p-0 items-center justify-center text-sm font-bold ">
          <img 
         src="/img/image4.png" 
         alt="Tia Landing" 
         className="logo w-24 object-contain " 
       />
        </div>
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
                   <div className=" text-dark flex p-0 items-center justify-center text-sm font-bold ">
          <img 
         src="/img/image4.png" 
         alt="Tia Landing" 
         className="logo w-24 object-contain " 
       />
        </div>
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