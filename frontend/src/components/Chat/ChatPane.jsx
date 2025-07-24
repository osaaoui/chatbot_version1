"use client"

import React, { useCallback, useMemo, useState } from "react"
import { useAuth } from "../../context/AuthProvider"
import ChatMessage from "./ChatMessage"
import ChatHeader from "./ChatHeader"
import ChatInput from "./ChatInput"
import ChatMessagesArea from "./ChatMessageArea"
import UploadModal from "./UploadModal"
import { useScrollBehavior } from "../../hooks/chat/useScrollBehavior"
import { useMarkdownRenderer } from "../../hooks/chat/useMarkdownRenderer"
import { useConversationLogic } from "../../hooks/chat/useConversationLogic"

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
  loadMoreMessages,
  onFileUpload, // New prop for global file upload
  isUploading, // New prop for global uploading state
}) {
  const { token } = useAuth()

  const [showUploadModal, setShowUploadModal] = useState(false)
  const [filesToUpload, setFilesToUpload] = useState([])

  const {
    showConversations,
    setShowConversations,
    conversations,
    isLoadingConversations,
    handleCreateNewConversation,
    selectConversation,
    formatDate,
  } = useConversationLogic(token)

  const {
    chatEndRef,
    chatContainerRef,
    showScrollToBottom,
    showLoadMoreButton,
    handleLoadMoreMessages,
    resetScrollState,
    shouldScrollToBottomRef,
    scrollToBottom,
  } = useScrollBehavior(chatHistory, hasMoreMessages, isLoadingMessages, loadMoreMessages)

  const { renderFormattedAnswer } = useMarkdownRenderer()

  React.useEffect(() => {
    resetScrollState()
  }, [currentConversation?.conversation_id, resetScrollState])

  const handleSourceClick = useCallback(
    (source) => {
      setSelectedSource({
        filename: source.metadata?.source,
        page: source.metadata?.page,
        snippet: source.snippet || source.content || "",
      })
    },
    [setSelectedSource],
  )

  const submitQuestion = useCallback(async () => {
    const trimmed = question.trim()
    if (!trimmed || isLoading) return

    shouldScrollToBottomRef.current = true
    onSend()
  }, [question, isLoading, onSend, shouldScrollToBottomRef])

  const handleFilesDropped = useCallback((files) => {
    setFilesToUpload(files)
    setShowUploadModal(true)
  }, [])

  const handleUploadConfirmed = useCallback(
    async (files, documentBaseId, folderId) => {
      await onFileUpload(files, documentBaseId, folderId)
      setShowUploadModal(false)
      setFilesToUpload([])
    },
    [onFileUpload],
  )

  const renderedMessages = useMemo(() => {
    return chatHistory
      .filter((msg) => msg && msg.id && msg.type)
      .map((msg) => (
        <ChatMessage
          key={msg.id}
          msg={msg}
          handleSourceClick={handleSourceClick}
          renderFormattedAnswer={renderFormattedAnswer}
        />
      ))
  }, [chatHistory, handleSourceClick, renderFormattedAnswer])

  return (
    <div className="chat-container flex flex-col h-full bg-bg-primary relative border-r border-border-light">
      <ChatHeader
        currentConversation={currentConversation}
        toggleSidebar={toggleSidebar}
        onShowConversations={() => setShowConversations(true)}
        conversations={conversations}
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
        isLoading={isLoading || isUploading} // Disable input if uploading
        currentConversation={currentConversation}
        onFilesDropped={handleFilesDropped} // Pass the new handler
      />

      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        files={filesToUpload}
        onConfirmUpload={handleUploadConfirmed}
        isUploading={isUploading}
      />
    </div>
  )
}

export default ChatPane