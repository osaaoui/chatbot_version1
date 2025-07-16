import React, { useState, useEffect, useRef } from 'react';
import { UserCircle } from 'lucide-react';

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

  const renderMessageContent = () => {
    if (msg.type === "user") {
      return (
        <div className="prose prose-sm max-w-none">
          {msg.text || <span className="text-text-tertiary italic">Mensaje vacío</span>}
          {msg.isPending && (
            <span className="text-text-tertiary italic text-xs ml-2">Enviando...</span>
          )}
        </div>
      );
    }
    if (msg.text) {
      return (
        <div className="prose prose-sm max-w-none">
          {renderFormattedAnswer(msg.text)}
        </div>
      );
    }
    return (
      <span className="text-text-tertiary italic">
        {msg.isPending ? "Generando respuesta..." : "Sin respuesta"}
      </span>
    );
  };

  return (
    <div 
      ref={messageRef} 
      className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
      data-message-id={msg.id}
    >
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
            renderMessageContent()
          ) : (
            <div className="h-6 bg-gray-200 animate-pulse rounded"></div>
          )}

          {msg.type === "bot" && Array.isArray(msg.sources) && msg.sources.length > 0 && isVisible && !msg.isPending && (
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

ChatMessage.displayName = 'ChatMessage';

export default ChatMessage;