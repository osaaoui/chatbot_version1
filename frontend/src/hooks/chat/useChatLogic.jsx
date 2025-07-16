import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useConversations } from '../../context/ConversationProvider';

const API_BASE = import.meta.env.VITE_API_URL + '/api/v2';

const autoSelectBestSource = (sources, setSelectedSource) => {
  if (!sources?.length) return;

  const bestSource = sources[0];
  setSelectedSource({
    filename: bestSource.metadata?.source,
    page: bestSource.metadata?.page,
    snippet: bestSource.snippet || bestSource.content || "",
    autoSelected: true
  });
};

export const useChatLogic = (user, token, t, setSelectedSource) => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const { 
    currentConversation, 
    messages,
    createConversation, 
    selectConversation,
    setCurrentConversationDirect,
    addMessageToConversation,
    updateMessageInConversation, 
    loadMoreMessages: loadMoreMessagesFromContext,
    hasMoreMessages,
    isLoadingMessages
  } = useConversations();

  const sendQuestion = useCallback(async (targetConversation = null) => {
    if (!token || !user || !question.trim()) return;

    const userMessage = question.trim();
    let conversationToUse = targetConversation || currentConversation;
    const isNewConversation = !conversationToUse;

    let tempMessageId = null;
    let conversationCreated = false;

    try {
      setQuestion("");
      
      tempMessageId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      addMessageToConversation({
        message_id: tempMessageId,
        question: userMessage,
        answer: "",
        sources: [],
        isUserMessage: true,
        isPending: false,
        creation_date: new Date().toISOString()
      });

      setIsLoading(true);
      
      if (isNewConversation) {
        const conversationTitle = userMessage.length > 50 
          ? userMessage.substring(0, 47) + "..." 
          : userMessage;
        
        const conversationId = await createConversation(token, conversationTitle);
        
        if (conversationId) {
          conversationCreated = true;
          const newConv = { conversation_id: conversationId, title: conversationTitle };
          conversationToUse = newConv;
          
          updateMessageInConversation(tempMessageId, {
            conversation_id: conversationId
          });
        } else {
          throw new Error('Failed to create conversation');
        }
      }

      const response = await axios.post(
        `${API_BASE}/chat/`,
        {
          question: userMessage,
          user_id: user.email,
          conversation_id: conversationToUse?.conversation_id
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const responseAnswer = response.data.answer;
      const responseSources = response.data.sources || [];

      setAnswer(responseAnswer);
      setSources(responseSources);

      updateMessageInConversation(tempMessageId, {
        answer: responseAnswer,
        sources: responseSources,
        isResponse: true,
        isPending: false,
        conversation_id: conversationToUse?.conversation_id
      });

      if (conversationCreated) {
        setCurrentConversationDirect(conversationToUse);
      }

      if (responseSources.length > 0) {
        setTimeout(() => autoSelectBestSource(responseSources, setSelectedSource), 100);
      }

    } catch (err) {
      console.error('Error sending question:', err);
      
      const errorMessage = `${t('common.failed')} ${err.response?.data?.message || ""}`;
      setAnswer(errorMessage);
      
      if (tempMessageId) {
        updateMessageInConversation(tempMessageId, {
          answer: errorMessage,
          sources: [],
          isResponse: true,
          isError: true,
          isPending: false
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [question, token, user, t, setSelectedSource, currentConversation, createConversation, setCurrentConversationDirect, addMessageToConversation, updateMessageInConversation, messages.length]);

  const formatMessagesForChat = useMemo(() => {
    const chatHistory = [];
    
    messages.forEach((msg) => {
      if (!msg.question && !msg.answer) return;
      
      if (msg.question) {
        chatHistory.push({
          type: "user",
          text: msg.question,
          time: msg.creation_date ? new Date(msg.creation_date) : new Date(),
          id: `${msg.message_id || Date.now()}-question`,
          isPending: msg.isPending || false
        });
      }
      
      if (msg.answer) {
        chatHistory.push({
          type: "bot",
          text: msg.answer,
          time: msg.creation_date ? new Date(msg.creation_date) : new Date(),
          sources: msg.sources || [],
          id: `${msg.message_id || Date.now()}-answer`,
          isError: msg.isError || false,
          isPending: msg.isPending || false
        });
      }
    });
    
    return chatHistory;
  }, [messages]);

  const loadMoreMessages = useCallback(async () => {
    if (!token || !hasMoreMessages || isLoadingMessages || !currentConversation) {
      return;
    }
    
    return loadMoreMessagesFromContext(token);
  }, [loadMoreMessagesFromContext, token, hasMoreMessages, isLoadingMessages, currentConversation]);

  useEffect(() => {
    setQuestion("");
    setAnswer("");
    setSources([]);
  }, [token, user]);

  return {
    question,
    answer,
    sources,
    chatHistory: formatMessagesForChat,
    isLoading,
    currentConversation,
    messages,
    hasMoreMessages,
    isLoadingMessages,
    setQuestion,
    sendQuestion,
    loadMoreMessages 
  };
};