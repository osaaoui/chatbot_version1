import React, { useState } from "react"
import { useTranslation } from "react-i18next"
import { MessageSquare, Plus, Loader2, X } from "lucide-react"

const ConversationsModal = ({ 
  isOpen, 
  onClose, 
  conversations, 
  currentConversation, 
  isLoadingConversations,
  onSelectConversation,
  onCreateNew,
  formatDate 
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
    onClose()
  }

  const handleCancelCreate = () => {
    setShowCreateForm(false)
    setNewConversationTitle("")
  }

  const handleShowCreateForm = () => {
    setShowCreateForm(true)
    setNewConversationTitle("")
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16">
      <div 
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.25)" }}
        onClick={onClose}
      />
      
      <div 
        className="relative rounded-lg shadow-xl w-80 max-h-96 flex flex-col"
        style={{
          backgroundColor: "var(--bg-primary)",
          border: "1px solid var(--border-light)"
        }}
      >
        <div 
          className="flex items-center justify-between p-3"
          style={{ borderBottom: "1px solid var(--border-light)" }}
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
            onClick={onClose}
            className="p-1 rounded transition-colors"
            style={{ color: "var(--text-tertiary)" }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "var(--bg-tertiary)"
              e.target.style.color = "var(--text-secondary)"
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "transparent"
              e.target.style.color = "var(--text-tertiary)"
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

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
                    onClick={() => {
                      onSelectConversation(conv)
                      onClose()
                    }}
                    className="p-2 rounded cursor-pointer text-xs transition-colors"
                    style={{
                      backgroundColor: isActive ? "var(--color-primary-dark)" : "transparent",
                      border: isActive ? "1px solid var(--color-primary-dark)" : "1px solid transparent",
                      color: isActive ? "var(--text-white)" : "var(--text-primary)"
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.target.style.backgroundColor = "var(--bg-tertiary)"
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.target.style.backgroundColor = "transparent"
                      }
                    }}
                  >
                    <div className="font-medium truncate mb-1">{conv.title}</div>
                    <div 
                      className="text-[10px]"
                      style={{ 
                        color: isActive ? "rgba(255, 255, 255, 0.8)" : "var(--text-tertiary)" 
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

        <div 
          className="p-3"
          style={{ borderTop: "1px solid var(--border-light)" }}
        >
          {showCreateForm ? (
            <div className="space-y-3">
              <input
                type="text"
                value={newConversationTitle}
                onChange={(e) => setNewConversationTitle(e.target.value)}
                placeholder={t("chat.conversationName")}
                className="w-full px-3 py-2 rounded-md text-sm focus:outline-none transition-colors"
                style={{
                  backgroundColor: "var(--bg-primary)",
                  border: "1px solid var(--border-medium)",
                  color: "var(--text-primary)"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--color-primary-dark)"
                  e.target.style.boxShadow = "0 0 0 2px rgba(59, 130, 246, 0.1)"
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--border-medium)"
                  e.target.style.boxShadow = "none"
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
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-colors text-xs font-medium"
                  style={{
                    backgroundColor: "var(--bg-secondary-dark)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-medium)",
                    opacity: (!newConversationTitle.trim() || isCreating) ? 0.5 : 1,
                    cursor: (!newConversationTitle.trim() || isCreating) ? "not-allowed" : "pointer"
                  }}
                  onMouseEnter={(e) => {
                    if (!(!newConversationTitle.trim() || isCreating)) {
                      e.target.style.backgroundColor = "var(--bg-tertiary)"
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!(!newConversationTitle.trim() || isCreating)) {
                      e.target.style.backgroundColor = "var(--bg-secondary-dark)"
                    }
                  }}
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
                  className="px-3 py-2 rounded-md transition-colors text-xs font-medium"
                  style={{
                    backgroundColor: "transparent",
                    border: "1px solid var(--border-medium)",
                    color: "var(--text-secondary)"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "var(--bg-tertiary)"
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "transparent"
                  }}
                >
                  {t("common.cancel")}
                </button>
              </div>
            </div>
          ) : (
          <button
            onClick={handleShowCreateForm}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-colors text-xs font-medium"
            style={{
              backgroundColor: "var(--bg-secondary-dark)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-medium)"
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "var(--bg-tertiary)"
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "var(--bg-secondary-dark)"
            }}
          >
            <Plus className="w-3 h-3" />
            {t("chat.newConversationButton")}
          </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ConversationsModal