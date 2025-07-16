import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTranslation } from 'react-i18next';
import { UserCircle, PanelLeft, MessageSquare, Plus, Loader2, ArrowUp } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { useConversations } from '../context/ConversationProvider';
import { useAuth } from '../context/AuthProvider';

const ChatMessage = React.memo(({ msg, handleSourceClick, renderFormattedAnswer }) => {
  const [isVisible, setIsVisible] = useState(false);
  const messageRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (messageRef.current) {
      observer.observe(messageRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={messageRef} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
      {msg.type === "bot" && (
        <div className="flex items-end mr-2">
          <div className="text-dark flex p-0 items-center justify-center text-sm font-bold">
            <img 
              src="/img/image4.png" 
              alt="Tia Landing" 
              className="logo w-24 object-contain" 
            />
          </div>
        </div>
      )}
      <div
        className={`max-w-[70%] px-4 py-3 text-sm ${
          msg.type === "user"
            ? "bg-secondary text-text-primary rounded-2xl rounded-br-none"
            : "text-text-primary rounded-2xl rounded-bl-none"
        } ${msg.isError ? "bg-red-50 border border-red-200" : ""} ${
          msg.isPending ? "opacity-70" : ""
        }`}
      >
        <div>
          {isVisible ? (
            <div className="prose prose-sm max-w-none">
              {msg.text ? renderFormattedAnswer(msg.text) : (
                <span className="text-text-tertiary italic">
                  {msg.isPending ? "Enviando..." : "Mensaje vacío"}
                </span>
              )}
            </div>
          ) : (
            <div className="h-6 bg-gray-200 animate-pulse rounded"></div>
          )}

          {msg.type === "bot" && Array.isArray(msg.sources) && msg.sources.length > 0 && isVisible && (
            <span className="ml-1">
              {msg.sources.map((source, sidx) => (
                <button
                  key={sidx}
                  onClick={() => handleSourceClick(source)}
                  className="text-text-primary hover:text-primary-dark text-xs ml-1 underline"
                  title={`Fuente ${sidx + 1}`}
                >
                  [{sidx + 1}]
                </button>
              ))}
            </span>
          )}
        </div>
        <div className="text-[10px] text-text-tertiary text-right mt-1">
          {msg.time && msg.time instanceof Date ? msg.time.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }) : '--:--'}
        </div>
      </div>
      {msg.type === "user" && (
        <div className="flex items-end ml-2">
          <UserCircle className="w-5 h-5 text-text-tertiary" />
        </div>
      )}
    </div>
  );
});

function ChatPane({ 
  question, 
  onQuestionChange, 
  onSend, 
  toggleSidebar, 
  setSelectedSource,
  chatHistory = [],
  isLoading = false,
  currentConversation,
  hasMoreMessages,
  isLoadingMessages,
  loadMoreMessages
}) {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [showConversations, setShowConversations] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [conversationTitle, setConversationTitle] = useState("");
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  
  const chatEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const lastMessageCountRef = useRef(0);
  const scrollTimeoutRef = useRef(null);
  const lastScrollTopRef = useRef(0);
  const isLoadingMoreRef = useRef(false);
  
  const {
    conversations,
    isLoadingConversations,
    fetchConversations,
    createConversation,
    selectConversation,
    nextCursor 
  } = useConversations();

  useEffect(() => {
    if (token) {
      fetchConversations(token);
    }
  }, [token, fetchConversations]);

  useEffect(() => {
    if (chatHistory.length > lastMessageCountRef.current) {
      lastMessageCountRef.current = chatHistory.length;
      
      setTimeout(() => {
        if (chatEndRef.current) {
          chatEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }, 50);
    }
  }, [chatHistory.length]);

  useEffect(() => {
    if (isLoading && chatEndRef.current) {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [isLoading]);

  const handleScroll = useCallback(() => {
    if (!chatContainerRef.current) return;
    
    const container = chatContainerRef.current;
    const { scrollTop, scrollHeight, clientHeight } = container;
    
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollToBottom(!isNearBottom);
    
    const isAtTop = scrollTop <= 50; // Más generoso
    
    if (isAtTop && hasMoreMessages && !isLoadingMessages && !isLoadingMoreRef.current) {
      isLoadingMoreRef.current = true;
      
      const currentScrollHeight = scrollHeight;
      const currentScrollTop = scrollTop;
      
      loadMoreMessages().finally(() => {
        setTimeout(() => {
          if (chatContainerRef.current) {
            const newScrollHeight = chatContainerRef.current.scrollHeight;
            const scrollDiff = newScrollHeight - currentScrollHeight;
            // Mantener posición relativa
            chatContainerRef.current.scrollTop = currentScrollTop + scrollDiff;
          }
          isLoadingMoreRef.current = false;
        }, 150);
      });
    }
  }, [hasMoreMessages, isLoadingMessages, loadMoreMessages, nextCursor]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    let rafId = null;
    
    const throttledScroll = () => {
      if (rafId) return;
      
      rafId = requestAnimationFrame(() => {
        handleScroll();
        rafId = null;
      });
    };

    container.addEventListener('scroll', throttledScroll, { passive: true });
    
    return () => {
      container.removeEventListener('scroll', throttledScroll);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [handleScroll]);

  useEffect(() => {
    if (!isLoadingMessages) {
      isLoadingMoreRef.current = false;
    }
  }, [isLoadingMessages]);

  const scrollToBottom = useCallback(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);
  
  const handleSourceClick = useCallback((source) => {
    setSelectedSource({
      filename: source.metadata?.source,
      page: source.metadata?.page,
      snippet: source.snippet || source.content || ""
    });
  }, [setSelectedSource]);
  
  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitQuestion();
    }
  }, [question, isLoading, currentConversation, chatHistory.length]);
  
  const submitQuestion = useCallback(() => {
    const trimmed = question.trim();
    if (!trimmed || isLoading) return;
    
    if (!currentConversation && chatHistory.length === 0) {
      setShowSaveDialog(true);
      setConversationTitle(trimmed.length > 50 ? trimmed.substring(0, 47) + "..." : trimmed);
      return;
    }
    
    onSend(); 
  }, [question, isLoading, currentConversation, chatHistory.length, onSend]);

  const handleSaveAndSend = useCallback(async () => {
    if (!conversationTitle.trim()) return;
    
    const conversationId = await createConversation(token, conversationTitle);
    if (conversationId) {
      const newConv = conversations.find(c => c.conversation_id === conversationId);
      if (newConv) {
        selectConversation(token, newConv);
      }
    }
    
    setShowSaveDialog(false);
    onSend();
  }, [conversationTitle, createConversation, token, conversations, selectConversation, onSend]);

  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) return 'Hoy';
    if (diffDays === 2) return 'Ayer';
    if (diffDays <= 7) return `${diffDays - 1} días`;
    return date.toLocaleDateString();
  }, []);

  const markdownComponents = useMemo(() => ({
    h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>,
    h2: ({ children }) => <h2 className="text-lg font-bold mt-4 mb-2">{children}</h2>,
    h3: ({ children }) => <h3 className="text-lg font-semibold mt-4 mb-2">{children}</h3>,
    h4: ({ children }) => <h4 className="text-base font-semibold mt-3 mb-2">{children}</h4>,
    h5: ({ children }) => <h5 className="text-sm font-semibold mt-3 mb-2">{children}</h5>,
    h6: ({ children }) => <h6 className="text-sm font-medium mt-3 mb-2">{children}</h6>,
    p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
    ol: ({ children }) => <ol className="list-decimal list-outside pl-6 mb-4 space-y-1">{children}</ol>,
    ul: ({ children }) => <ul className="list-disc list-outside pl-6 mb-4 space-y-1">{children}</ul>,
    li: ({ children }) => <li className="mb-1 leading-relaxed">{children}</li>,
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    code: ({ children }) => <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-sm font-mono">{children}</code>,
    pre: ({ children }) => <pre className="bg-gray-100 p-3 rounded-md overflow-x-auto mb-4">{children}</pre>,
    a: ({ href, children }) => (
      <a href={href} className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
    blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-300 pl-4 italic mb-4">{children}</blockquote>
  }), []);

  const renderFormattedAnswer = useCallback((text) => {
    if (!text || typeof text !== 'string') {
      return <span className="text-text-tertiary italic">Sin contenido</span>;
    }

    if (text.length > 2000) {
      return <LazyMarkdown text={text} components={markdownComponents} />;
    }

    const preprocessMarkdown = (text) => {
      const lines = text.split(/\r?\n/);
      const processedLines = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();
        
        if (!trimmedLine) {
          processedLines.push('');
          continue;
        }
        
        if (/^#{1,6}[^#\s]/.test(trimmedLine)) {
          const hashCount = trimmedLine.match(/^#+/)[0].length;
          const headingText = trimmedLine.substring(hashCount).trim();
          processedLines.push('#'.repeat(hashCount) + ' ' + headingText);
          continue;
        }
        
        processedLines.push(line);
      }
      
      return processedLines.join('\n');
    };

    const markdownText = preprocessMarkdown(text);
    
    return (
      <ReactMarkdown components={markdownComponents}>
        {markdownText}
      </ReactMarkdown>
    );
  }, [markdownComponents]);

const LazyMarkdown = React.memo(({ text, components }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!isLoaded) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <ReactMarkdown components={components}>
      {text}
    </ReactMarkdown>
  );
});

  const renderedMessages = useMemo(() => {
    return chatHistory
      .filter(msg => msg && msg.id && msg.type)
      .map((msg) => (
        <ChatMessage
          key={msg.id}
          msg={msg}
          handleSourceClick={handleSourceClick}
          renderFormattedAnswer={renderFormattedAnswer}
        />
      ));
  }, [chatHistory, handleSourceClick, renderFormattedAnswer]);

  return (
    <div className="chat-container flex flex-col h-full bg-bg-primary relative border-r border-border-light">
      <div className="flex-shrink-0 p-2 border-b border-border-light bg-bg-primary relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSidebar}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-bg-tertiary text-text-secondary h-7 w-7"
              title={t('chat.toggleSidebar')}
            >
              <PanelLeft />
              <span className="sr-only">{t('chat.toggleSidebar')}</span>
            </button>
            <h3 className="font-medium">
              {currentConversation?.title || "Nuevo Chat"}
            </h3>
          </div>
          
          <button
            onClick={() => setShowConversations(!showConversations)}
            className="flex items-center gap-1 text-xs px-2 py-1 bg-bg-secondary hover:bg-bg-tertiary rounded border border-border-light"
          >
            <MessageSquare className="w-3 h-3" />
            {showConversations ? 'Ocultar' : 'Conversaciones'}
          </button>
        </div>
      </div>

      {showConversations && (
        <div className="flex-shrink-0 bg-bg-secondary border-b border-border-light max-h-80 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-sm">Conversaciones</h4>
              <button
                onClick={() => selectConversation(token, null)}
                className="text-xs px-2 py-1 bg-bg-dark text-white rounded hover:bg-primary-dark"
              >
                <Plus className="w-3 h-3 inline mr-1" />
                Nuevo
              </button>
            </div>

            {isLoadingConversations ? (
              <div className="flex justify-center p-4">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <p className="text-text-tertiary text-xs text-center py-4">
                No hay conversaciones
              </p>
            ) : (
              <div className="space-y-1">
                {conversations.map((conv) => (
                  <div
                    key={conv.conversation_id}
                    onClick={() => {
                      selectConversation(token, conv);
                      setShowConversations(false);
                    }}
                    className={`p-2 rounded cursor-pointer text-xs ${
                      currentConversation?.conversation_id === conv.conversation_id
                        ? 'bg-bg-secondary text-dark'
                        : 'hover:bg-bg-tertiary'
                    }`}
                  >
                    <div className="font-medium truncate">{conv.title}</div>
                    <div className={`text-[10px] ${
                      currentConversation?.conversation_id === conv.conversation_id
                        ? 'text-dark'
                        : 'text-text-tertiary'
                    }`}>
                      {formatDate(conv.last_modification_date)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showSaveDialog && (
        <div className="flex-shrink-0 bg-yellow-50 border-b border-yellow-200 p-3">
          <div className="text-sm mb-2">¿Guardar esta conversación?</div>
          <input
            type="text"
            value={conversationTitle}
            onChange={(e) => setConversationTitle(e.target.value)}
            placeholder="Título de la conversación"
            className="w-full px-2 py-1 border border-border-light rounded text-sm mb-2"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSaveAndSend}
              className="px-3 py-1 bg-primary text-white rounded text-xs hover:bg-primary-dark"
            >
              Guardar y Enviar
            </button>
            <button
              onClick={() => {
                setShowSaveDialog(false);
                onSend();
              }}
              className="px-3 py-1 border border-border-light rounded text-xs hover:bg-bg-tertiary"
            >
              Solo Enviar
            </button>
            <button
              onClick={() => setShowSaveDialog(false)}
              className="px-3 py-1 text-xs text-text-tertiary hover:text-text-primary"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
      
      <main 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
      >
        {isLoadingMessages && (
          <div className="flex justify-center py-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-medium">Cargando mensajes anteriores...</span>
            </div>
          </div>
        )}

        {hasMoreMessages && !isLoadingMessages && (
          <div className="flex justify-center py-3">
            <button
              onClick={() => {
                if (!isLoadingMoreRef.current) {
                  loadMoreMessages();
                }
              }}
              className="px-6 py-3 text-sm font-medium bg-primary text-white hover:bg-primary-dark border border-primary rounded-lg transition-colors shadow-sm"
            >
              ↑ Cargar mensajes anteriores
            </button>
          </div>
        )}

        {chatHistory.length === 0 && !isLoading ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
            <p className="text-text-tertiary">
              {currentConversation 
                ? "Esta conversación está vacía. ¡Haz tu primera pregunta!" 
                : "¡Hola! Haz una pregunta para comenzar una nueva conversación."
              }
            </p>
          </div>
        ) : (
          renderedMessages
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-end mr-2">
              <div className="text-dark flex p-0 items-center justify-center text-sm font-bold">
                <img 
                  src="/img/image4.png" 
                  alt="Tia Landing" 
                  className="logo w-24 object-contain" 
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

      {showScrollToBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 right-4 p-2 bg-primary text-white rounded-full shadow-lg hover:bg-primary-dark transition-colors"
          title="Ir al final"
        >
          <ArrowUp className="w-4 h-4 transform rotate-180" />
        </button>
      )}
      
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
            placeholder={
              currentConversation 
                ? "Continúa la conversación..." 
                : "Haz una pregunta para comenzar..."
            }
            className="input-base flex-1 resize-none rounded-full"
            disabled={isLoading}
          />
          <button
            type="submit"
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
        </form>
        <p className="text-[10px] text-text-tertiary mt-1">
          Presiona Enter para enviar, Shift+Enter para nueva línea
        </p>
      </footer>
    </div>
  );
}

export default ChatPane;