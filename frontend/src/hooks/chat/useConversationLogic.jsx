import { useState, useEffect, useCallback } from 'react';
import { useConversations } from '../../context/ConversationProvider';

export const useConversationLogic = (token) => {
  const [showConversations, setShowConversations] = useState(false);

  const {
    conversations,
    isLoadingConversations,
    fetchConversations,
    createConversation,
    selectConversation
  } = useConversations();

  useEffect(() => {
    if (token) {
      fetchConversations(token);
    }
  }, [token, fetchConversations]);

  const generateTitle = useCallback((message) => {
    const cleanMessage = message.trim();
    if (cleanMessage.length <= 50) return cleanMessage;
    return cleanMessage.substring(0, 47) + "...";
  }, []);

  const handleCreateNewConversation = useCallback(async (title = "Nueva Conversación") => {
    const conversationId = await createConversation(token, title);
    if (conversationId) {
      await fetchConversations(token);
      const newConv = { conversation_id: conversationId, title };
      selectConversation(token, newConv);
      return conversationId;
    }
    return null;
  }, [createConversation, token, fetchConversations, selectConversation]);

  const handleAutoSaveConversation = useCallback(async (firstMessage) => {
    const title = generateTitle(firstMessage);
    const conversationId = await createConversation(token, title);
    if (conversationId) {
      const newConv = conversations.find(c => c.conversation_id === conversationId) || { conversation_id: conversationId, title };
      selectConversation(token, newConv);
      return conversationId;
    }
    return null;
  }, [createConversation, token, conversations, selectConversation, generateTitle]);

  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) return 'Hoy';
    if (diffDays === 2) return 'Ayer';
    if (diffDays <= 7) return `${diffDays - 1} días`;
    return date.toLocaleDateString();
  }, []);

  return {
    showConversations,
    setShowConversations,
    conversations,
    isLoadingConversations,
    handleCreateNewConversation,
    handleAutoSaveConversation,
    selectConversation,
    formatDate
  };
};