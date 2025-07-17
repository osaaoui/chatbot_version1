import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useConversations } from '../../context/ConversationProvider';

export const useConversationLogic = (token) => {
  const { t } = useTranslation();
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

  const handleCreateNewConversation = useCallback(async (title) => {
    const defaultTitle = title || t('chat.newConversation');
    const conversationId = await createConversation(token, defaultTitle);
    if (conversationId) {
      await fetchConversations(token);
      const newConv = { conversation_id: conversationId, title: defaultTitle };
      selectConversation(token, newConv);
      return conversationId;
    }
    return null;
  }, [createConversation, token, fetchConversations, selectConversation, t]);

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
    
    if (diffDays <= 1) return t('common.today');
    if (diffDays === 2) return t('common.yesterday');
    if (diffDays <= 7) return t('common.daysAgo', { days: diffDays - 1 });
    return date.toLocaleDateString();
  }, [t]);

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