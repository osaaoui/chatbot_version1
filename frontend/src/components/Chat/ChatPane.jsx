import React, { useCallback, useMemo } from "react";
import { useAuth } from '../../context/AuthProvider';
import ChatMessage from './ChatMessage';
import ConversationsModal from './ConversationsModal';
import ChatHeader from './ChatHeader';
import ChatInput from './ChatInput';
import ChatMessagesArea from './ChatMessageArea';
import { useScrollBehavior } from '../../hooks/chat/useScrollBehavior';
import { useMarkdownRenderer } from '../../hooks/chat/useMarkdownRenderer';
import { useConversationLogic } from '../../hooks/chat/useConversationLogic';

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
  const { token } = useAuth();
  
  const {
    showConversations,
    setShowConversations,
    conversations,
    isLoadingConversations,
    handleCreateNewConversation,
    selectConversation,
    formatDate
  } = useConversationLogic(token);

  const {
    chatEndRef,
    chatContainerRef,
    showScrollToBottom,
    showLoadMoreButton,
    scrollToBottom,
    handleLoadMoreMessages,
    resetScrollState,
    shouldScrollToBottomRef
  } = useScrollBehavior(chatHistory, hasMoreMessages, isLoadingMessages, loadMoreMessages);

  const { renderFormattedAnswer } = useMarkdownRenderer();

  React.useEffect(() => {
    resetScrollState();
  }, [currentConversation?.conversation_id, resetScrollState]);

  const handleSourceClick = useCallback((source) => {
    setSelectedSource({
      filename: source.metadata?.source,
      page: source.metadata?.page,
      snippet: source.snippet || source.content || ""
    });
  }, [setSelectedSource]);

  const submitQuestion = useCallback(async () => {
    const trimmed = question.trim();
    if (!trimmed || isLoading) return;
    
    shouldScrollToBottomRef.current = true;
    onSend();
  }, [question, isLoading, onSend, shouldScrollToBottomRef]);

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
      <ChatHeader 
        currentConversation={currentConversation}
        toggleSidebar={toggleSidebar}
        onShowConversations={() => setShowConversations(true)}
      />

      <ConversationsModal
        isOpen={showConversations}
        onClose={() => setShowConversations(false)}
        conversations={conversations}
        currentConversation={currentConversation}
        isLoadingConversations={isLoadingConversations}
        onSelectConversation={(conv) => selectConversation(token, conv)}
        onCreateNew={handleCreateNewConversation}
        formatDate={formatDate}
      />
      
      <ChatMessagesArea
        chatContainerRef={chatContainerRef}
        chatEndRef={chatEndRef}
        showLoadMoreButton={showLoadMoreButton}
        handleLoadMoreMessages={handleLoadMoreMessages}
        isLoadingMessages={isLoadingMessages}
        chatHistory={chatHistory}
        isLoading={isLoading}
        currentConversation={currentConversation}
        renderedMessages={renderedMessages}
        showScrollToBottom={showScrollToBottom}
        scrollToBottom={scrollToBottom}
      />

      <ChatInput
        question={question}
        onQuestionChange={onQuestionChange}
        onSubmit={submitQuestion}
        isLoading={isLoading}
        currentConversation={currentConversation}
      />
    </div>
  );
}

export default ChatPane;