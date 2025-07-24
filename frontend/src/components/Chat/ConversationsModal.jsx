import React, { useState } from "react"
import { useTranslation } from "react-i18next"
import { MessageSquare, Plus, Loader2, X } from "lucide-react"

const ConversationsModal = ({ 
  conversations, 
  currentConversation, 
  isLoadingConversations,
  onSelectConversation,
  onCreateNew,
  formatDate,
  closeModal // Esta prop viene del ButtonModal
}) => {
  const { t } = useTranslation()
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newConversationTitle, setNewConversationTitle] = useState("")

  const handleCreateNew = async () => {
    if (!newConversationTitle.trim()) return
    
    setIsCreating(true)
    await onCreateNew(newConversationTitle.trim())
    setIsCreating(false)
    setShowCreateForm(false)
    setNewConversationTitle("")
    closeModal()
  }

  const handleCancelCreate = () => {
    setShowCreateForm(false)
    setNewConversationTitle("")
  }

  const handleShowCreateForm = () => {
    setShowCreateForm(true)
    setNewConversationTitle("")
  }

  const handleSelectConversation = (conv) => {
    onSelectConversation(conv)
    closeModal()
  }

  return (
    <div 
      className="bg-white rounded-lg shadow-xl border border-gray-200 w-72 max-h-80 flex flex-col"
      style={{
        backgroundColor: "var(--bg-primary)",
        border: "1px solid var(--border-light)"
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 border-b"
        style={{ borderColor: "var(--border-light)" }}
      >
        <h3 
          className="font-medium text-sm flex items-center gap-2"
          style={{ color: "var(--text-primary)" }}
        >
          <MessageSquare 
            className="w-4 h-4" 
            style={{ color: "var(--text-secondary)" }}
          />
          {t("chat.conversations")}
        </h3>
        <button
          onClick={closeModal}
          className="p-1 rounded hover:bg-gray-100 transition-colors"
          style={{ color: "var(--text-tertiary)" }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2 min-h-0">
        {isLoadingConversations ? (
          <div className="flex justify-center p-4">
            <Loader2 
              className="w-4 h-4 animate-spin" 
              style={{ color: "var(--text-tertiary)" }}
            />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-6">
            <MessageSquare 
              className="w-8 h-8 mx-auto mb-2 opacity-50" 
              style={{ color: "var(--text-tertiary)" }}
            />
            <p 
              className="text-xs"
              style={{ color: "var(--text-tertiary)" }}
            >
              {t("chat.noConversations")}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((conv) => {
              const isActive = currentConversation?.conversation_id === conv.conversation_id
              
              return (
                <div
                  key={conv.conversation_id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`p-2 rounded cursor-pointer text-xs transition-colors hover:bg-gray-50 ${
                    isActive ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  style={{
                    backgroundColor: isActive ? "rgba(59, 130, 246, 0.1)" : "transparent",
                    border: isActive ? "1px solid rgba(59, 130, 246, 0.3)" : "1px solid transparent",
                    color: isActive ? "var(--color-primary-dark)" : "var(--text-primary)"
                  }}
                >
                  <div className="font-medium truncate mb-1" title={conv.title}>
                    {conv.title}
                  </div>
                  <div 
                    className="text-[10px]"
                    style={{ 
                      color: isActive ? "rgba(59, 130, 246, 0.8)" : "var(--text-tertiary)" 
                    }}
                  >
                    {formatDate(conv.last_modification_date)}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div 
        className="p-3 border-t"
        style={{ borderColor: "var(--border-light)" }}
      >
        {showCreateForm ? (
          <div className="space-y-2">
            <input
              type="text"
              value={newConversationTitle}
              onChange={(e) => setNewConversationTitle(e.target.value)}
              placeholder={t("chat.conversationName")}
              className="w-full px-2 py-1.5 rounded border text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{
                backgroundColor: "var(--bg-primary)",
                border: "1px solid var(--border-medium)",
                color: "var(--text-primary)"
              }}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleCreateNew()
                }
                if (e.key === "Escape") {
                  handleCancelCreate()
                }
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateNew}
                disabled={!newConversationTitle.trim() || isCreating}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {t("chat.creating")}
                  </>
                ) : (
                  <>
                    <Plus className="w-3 h-3" />
                    {t("chat.create")}
                  </>
                )}
              </button>
              <button
                onClick={handleCancelCreate}
                className="px-2 py-1.5 rounded text-xs font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
                style={{
                  color: "var(--text-secondary)"
                }}
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleShowCreateForm}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-xs font-medium bg-gray-100 hover:bg-gray-200 transition-colors"
            style={{
              color: "var(--text-primary)"
            }}
          >
            <Plus className="w-3 h-3" />
            {t("chat.newConversationButton")}
          </button>
        )}
      </div>
    </div>
  )
}

export default ConversationsModal