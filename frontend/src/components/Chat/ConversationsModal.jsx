import React, { useState } from 'react';
import { MessageSquare, Plus, Loader2, X } from 'lucide-react';

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
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newConversationTitle, setNewConversationTitle] = useState('');

  const handleCreateNew = async () => {
    if (!newConversationTitle.trim()) return;
    
    setIsCreating(true);
    await onCreateNew(newConversationTitle.trim());
    setIsCreating(false);
    setShowCreateForm(false);
    setNewConversationTitle('');
    onClose();
  };

  const handleCancelCreate = () => {
    setShowCreateForm(false);
    setNewConversationTitle('');
  };

  const handleShowCreateForm = () => {
    setShowCreateForm(true);
    setNewConversationTitle('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16">
      <div 
        className="absolute inset-0 bg-black bg-opacity-25" 
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-lg shadow-xl border border-gray-200 w-80 max-h-96 flex flex-col">
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <h3 className="font-medium text-sm flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Conversaciones
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 min-h-0">
          {isLoadingConversations ? (
            <div className="flex justify-center p-4">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">No hay conversaciones</p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conv) => (
                <div
                  key={conv.conversation_id}
                  onClick={() => {
                    onSelectConversation(conv);
                    onClose();
                  }}
                  className={`p-2 rounded cursor-pointer text-xs transition-colors ${
                    currentConversation?.conversation_id === conv.conversation_id
                      ? 'bg-blue-50 border border-blue-200 text-blue-900'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className="font-medium truncate mb-1">{conv.title}</div>
                  <div className="text-[10px] text-gray-500">
                    {formatDate(conv.last_modification_date)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 border-t border-gray-200">
          {showCreateForm ? (
            <div className="space-y-3">
              <input
                type="text"
                value={newConversationTitle}
                onChange={(e) => setNewConversationTitle(e.target.value)}
                placeholder="Nombre de la conversación"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateNew();
                  }
                  if (e.key === 'Escape') {
                    handleCancelCreate();
                  }
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreateNew}
                  disabled={!newConversationTitle.trim() || isCreating}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 text-xs font-medium"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-3 h-3" />
                      Crear
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancelCreate}
                  className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-xs font-medium"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleShowCreateForm}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs font-medium"
            >
              <Plus className="w-3 h-3" />
              Nueva Conversación
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationsModal;