import React from "react"
import { useTranslation } from "react-i18next"
import { MessageSquare, Loader2, ChevronUp, ArrowUp } from "lucide-react"
import { useFontSize } from "../../context/FontSizeContext"

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
  const { t } = useTranslation()
  const { fontSize } = useFontSize()
  
  const shouldShowLoadingAnimation = () => {
    if (!isLoading) return false
    
    if (chatHistory.length === 0) return true
    
    const userMessages = chatHistory.filter(msg => msg.type === "user")
    if (userMessages.length === 0) return false
    
    const lastUserMessage = userMessages[userMessages.length - 1]
    
    if (lastUserMessage.isPending) return true
    
    const lastUserMessageTime = new Date(lastUserMessage.time).getTime()
    const botResponseExists = chatHistory.some(msg => 
      msg.type === "bot" && 
      new Date(msg.time).getTime() > lastUserMessageTime
    )
    
    return !botResponseExists
  }

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
              className="flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
              style={{ 
                fontSize: `${Math.max(fontSize - 2, 12)}px`,
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-primary)'
              }}
              onMouseEnter={(e) => {
                if (!isLoadingMessages) {
                  e.target.style.backgroundColor = 'var(--bg-tertiary)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoadingMessages) {
                  e.target.style.backgroundColor = 'var(--bg-primary)'
                }
              }}
            >
              {isLoadingMessages ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('chat.loadingMessages')}</span>
                </>
              ) : (
                <>
                  <ChevronUp className="w-4 h-4" />
                  <span>{t('chat.loadMoreMessages')}</span>
                </>
              )}
            </button>
          </div>
        )}
        {chatHistory.length === 0 && !isLoading ? (
          <div className="text-center py-8">
            <MessageSquare 
              className="w-12 h-12 mx-auto mb-4" 
              style={{ color: 'var(--text-tertiary)' }}
            />
            <p 
              style={{ 
                fontSize: `${fontSize}px`,
                color: 'var(--text-tertiary)'
              }}
            >
              {currentConversation 
                ? t('chat.emptyConversation')
                : t('chat.welcomeMessage')
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {renderedMessages}
          </div>
        )}
        {shouldShowLoadingAnimation() && (
          <div className="flex justify-start">
            <div className="flex items-end mr-2">
              <div className="flex p-0 items-center justify-center text-sm font-bold">
                <img 
                  src="/img/image4.png" 
                  alt="Tia Landing" 
                  className="logo w-24 object-contain" 
                />
              </div>
            </div>
            <div 
              className="max-w-[80%] px-4 py-3 text-sm rounded-2xl rounded-bl-none"
              style={{
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-light)',
                color: 'var(--text-primary)'
              }}
            >
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
          className="absolute bottom-20 right-4 p-3 mb-6 rounded-full shadow-lg transition-colors z-10"
          style={{
            backgroundColor: 'var(--bg-secondary-dark)',
            color: 'var(--text-primary)'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'var(--bg-tertiary)'
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'var(--bg-secondary-dark)'
          }}
          title={t('chat.goToEnd')}
        >
          <ArrowUp className="w-4 h-4 transform rotate-180" />
        </button>
      )}
    </>
  )
}

export default ChatMessagesArea