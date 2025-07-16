import React from 'react';
import { MessageSquare, Loader2, ChevronUp, ArrowUp } from 'lucide-react';
import ChatMessage from './ChatMessage';

const ChatMessagesArea = ({
  chatContainerRef,
  chatEndRef,
  showLoadMoreButton,
  handleLoadMoreMessages,
  isLoadingMessages,
  chatHistory,
  isLoading,
  currentConversation,
  renderedMessages,
  showScrollToBottom,
  scrollToBottom
}) => {
  
  const hasUserMessageWithoutResponse = chatHistory.some(msg => 
    msg.type === "user" && !chatHistory.some(botMsg => 
      botMsg.type === "bot" && 
      Math.abs(new Date(botMsg.time) - new Date(msg.time)) < 60000 // Dentro de 1 minuto
    )
  );
  return (
    <>
      <main 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-4 relative"
        style={{
          overflowX: 'hidden',
        }}
      >
        {showLoadMoreButton && (
          <div className="sticky top-0 z-10 flex justify-center mb-4">
            <button
              onClick={handleLoadMoreMessages}
              disabled={isLoadingMessages}
              className="flex items-center gap-2 px-4 py-3 bg-white hover:bg-gray-50 border border-gray-300 rounded-full shadow-lg transition-all duration-200 text-sm font-medium text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
            >
              {isLoadingMessages ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Cargando mensajes...</span>
                </>
              ) : (
                <>
                  <ChevronUp className="w-4 h-4" />
                  <span>Cargar mensajes anteriores</span>
                </>
              )}
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
          <div className="space-y-4">
            {renderedMessages}
          </div>
        )}
        {isLoading && (hasUserMessageWithoutResponse || chatHistory.length === 0) && (
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
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-20 right-4 p-2 bg-primary text-white rounded-full shadow-lg hover:bg-primary-dark transition-colors z-10"
          title="Ir al final"
        >
          <ArrowUp className="w-4 h-4 transform rotate-180" />
        </button>
      )}
    </>
  );
};

export default ChatMessagesArea;