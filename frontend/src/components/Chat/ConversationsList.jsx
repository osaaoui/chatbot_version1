// src/components/ConversationsList.js
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Plus, Loader2 } from 'lucide-react';
import { useConversations } from '../../context/ConversationProvider';
import { useAuth } from '../../context/AuthProvider';

const ConversationsList = () => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const {
    conversations,
    currentConversation,
    isLoadingConversations,
    fetchConversations,
    createConversation,
    selectConversation
  } = useConversations();

  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (token) {
      fetchConversations(token);
    }
  }, [token, fetchConversations]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    
    setIsCreating(true);
    const conversationId = await createConversation(token, newTitle);
    if (conversationId) {
      setNewTitle('');
      setShowForm(false);
      // Auto-seleccionar la nueva conversación
      const newConv = conversations.find(c => c.conversation_id === conversationId);
      if (newConv) selectConversation(newConv);
    }
    setIsCreating(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) return 'Hoy';
    if (diffDays === 2) return 'Ayer';
    if (diffDays <= 7) return `${diffDays - 1} días`;
    return date.toLocaleDateString();
  };

  return (
    <div className="p-4 border-b border-border-light">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Conversaciones
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="p-1 hover:bg-bg-tertiary rounded"
          title="Nueva conversación"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-3 space-y-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Título de la conversación"
            className="w-full px-2 py-1 border border-border-light rounded text-sm"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!newTitle.trim() || isCreating}
              className="flex-1 px-2 py-1 bg-secondary text-white rounded text-sm disabled:opacity-50"
            >
              {isCreating ? 'Creando...' : 'Crear'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setNewTitle(''); }}
              className="px-2 py-1 border border-border-light rounded text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {isLoadingConversations ? (
        <div className="flex justify-center p-4">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      ) : conversations.length === 0 ? (
        <p className="text-text-tertiary text-sm text-center py-4">
          No hay conversaciones
        </p>
      ) : (
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {conversations.map((conv) => (
            <div
              key={conv.conversation_id}
              onClick={() => selectConversation(conv)}
              className={`p-2 rounded cursor-pointer text-sm ${
                currentConversation?.conversation_id === conv.conversation_id
                  ? 'bg-bg-secondary text-white'
                  : 'hover:bg-bg-tertiary'
              }`}
            >
              <div className="font-medium truncate">{conv.title}</div>
              <div className={`text-xs ${
                currentConversation?.conversation_id === conv.conversation_id
                  ? 'text-dark/80'
                  : 'text-text-tertiary'
              }`}>
                {formatDate(conv.last_modification_date)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConversationsList;