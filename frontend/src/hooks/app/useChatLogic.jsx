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
    addMessageToConversation,
    loadMoreMessages: loadMoreMessagesFromContext,
    hasMoreMessages,
    isLoadingMessages
  } = useConversations();

  const sendQuestion = useCallback(async () => {
    if (!token || !user || !question.trim()) return;

    const userMessage = question.trim();
    let targetConversation = currentConversation;

    try {
      setQuestion("");
      
      addMessageToConversation({
        question: userMessage,
        answer: "",
        sources: [],
        isUserMessage: true,
        isPending: true
      });

      setIsLoading(true);
      
      if (!targetConversation) {
        const conversationTitle = userMessage.length > 50 
          ? userMessage.substring(0, 47) + "..." 
          : userMessage;
        
        const conversationId = await createConversation(token, conversationTitle);
        
        if (conversationId) {
          const newConv = { conversation_id: conversationId, title: conversationTitle };
          await selectConversation(token, newConv);
          targetConversation = newConv;
        }
      }

      const response = await axios.post(
        `${API_BASE}/chat/`,
        {
          question: userMessage,
          user_id: user.email,
          conversation_id: targetConversation?.conversation_id
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const responseAnswer = response.data.answer;
      const responseSources = response.data.sources || [];

      setAnswer(responseAnswer);
      setSources(responseSources);

      addMessageToConversation({
        question: userMessage,
        answer: responseAnswer,
        sources: responseSources,
        isResponse: true
      });

      if (responseSources.length > 0) {
        setTimeout(() => autoSelectBestSource(responseSources, setSelectedSource), 100);
      }

    } catch (err) {
      const errorMessage = `${t('common.failed')} ${err.response?.data?.message || ""}`;
      setAnswer(errorMessage);
      
      addMessageToConversation({
        question: userMessage,
        answer: errorMessage,
        sources: [],
        isResponse: true,
        isError: true
      });
    } finally {
      setIsLoading(false);
    }
  }, [question, token, user, t, setSelectedSource, currentConversation, createConversation, selectConversation, addMessageToConversation]);

  const formatMessagesForChat = useMemo(() => {
    const chatHistory = [];
    
    messages.forEach((msg) => {
      if (!msg.question && !msg.answer) return;
      
      if (msg.isPending) {
        chatHistory.push({
          type: "user",
          text: msg.question || "",
          time: msg.creation_date ? new Date(msg.creation_date) : new Date(),
          id: `${msg.message_id || Date.now()}-question`,
          isPending: true
        });
        return;
      }
      
      if (msg.question) {
        chatHistory.push({
          type: "user",
          text: msg.question || "",
          time: msg.creation_date ? new Date(msg.creation_date) : new Date(),
          id: `${msg.message_id || Date.now()}-question`
        });
      }
      
      if (msg.answer) {
        chatHistory.push({
          type: "bot",
          text: msg.answer || "",
          time: msg.creation_date ? new Date(msg.creation_date) : new Date(),
          sources: msg.sources || [],
          id: `${msg.message_id || Date.now()}-answer`,
          isError: msg.isError || false
        });
      }
    });
    
    return chatHistory;
  }, [messages]);

  const loadMoreMessages = useCallback(async () => {
    if (!token) {
      return;
    }
    
    return loadMoreMessagesFromContext(token);
  }, [loadMoreMessagesFromContext, token]);

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