import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import axios from 'axios';

const ConversationContext = createContext();

const API_BASE = import.meta.env.VITE_API_URL + '/api/v2';

export const ConversationProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);

  const fetchConversations = useCallback(async (token) => {
    if (!token) return;
    
    try {
      setIsLoadingConversations(true);
      const response = await axios.get(`${API_BASE}/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setConversations(response.data.data.conversations || []);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  const createConversation = useCallback(async (token, title) => {
    if (!token || !title?.trim()) return null;
    
    try {
      const response = await axios.post(
        `${API_BASE}/conversations`, 
        { name_conversation: title.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        await fetchConversations(token);
        const conversationIdMatch = response.data.data.conversation_id.match(/UUID\('([^']+)'\)/);
        return conversationIdMatch ? conversationIdMatch[1] : null;
      }
    } catch (err) {
      console.error('Error creating conversation:', err);
    }
    return null;
  }, [fetchConversations]);

  const fetchMessages = useCallback(async (token, conversationId, loadMore = false) => {
    if (!token || !conversationId) return;
    
    try {
      setIsLoadingMessages(true);
      
      let url = `${API_BASE}/messages/conversation?conversation_id=${conversationId}&limits=20`;
      
      if (loadMore && nextCursor) {
        url += `&id_last_message=${nextCursor.messageId}&date_last_message=${encodeURIComponent(nextCursor.date)}`;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const newMessages = response.data.data.messages || [];
        
        const validMessages = newMessages.filter(msg => 
          msg && (msg.question || msg.answer) && msg.message_id
        );
        
        if (loadMore) {
          setMessages(prev => {
            return [...validMessages, ...prev];
          });
        } else {
          setMessages(validMessages);
        }

        if (validMessages.length > 0) {
          const oldestMessage = validMessages[0];
          
          const hasMore = oldestMessage.has_more || false;
          setHasMoreMessages(hasMore);
          
          if (hasMore && oldestMessage.next_cursor_message_id) {
            setNextCursor({
              messageId: oldestMessage.next_cursor_message_id,
              date: oldestMessage.next_cursor_date
            });
          } else {
            setNextCursor(null);
          }
        } else {
          setHasMoreMessages(false);
          setNextCursor(null);
        }
      } else {
        console.error('API response not successful:', response.data);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      console.error('Error details:', {
        status: err.response?.status,
        data: err.response?.data,
        url: err.config?.url
      });
    } finally {
      setIsLoadingMessages(false);
    }
  }, [nextCursor]);

  const selectConversation = useCallback(async (token, conversation) => {
    setCurrentConversation(conversation);
    setMessages([]);
    setNextCursor(null);
    setHasMoreMessages(false);
    
    if (conversation) {
      await fetchMessages(token, conversation.conversation_id);
    }
  }, [fetchMessages]);

  const loadMoreMessages = useCallback(async (token) => {

    if (!hasMoreMessages || isLoadingMessages || !currentConversation || !nextCursor) {
      return;
    }
  
    await fetchMessages(token, currentConversation.conversation_id, true);
  }, [hasMoreMessages, isLoadingMessages, currentConversation, nextCursor, fetchMessages]);

  // Optimizar addMessageToConversation para evitar re-renders innecesarios
  const addMessageToConversation = useCallback((newMessage) => {
    const messageToAdd = {
      message_id: newMessage.isUserMessage ? `${Date.now()}-user` : `${Date.now()}-bot`,
      conversation_id: currentConversation?.conversation_id,
      question: newMessage.question,
      answer: newMessage.answer,
      sources: newMessage.sources || [],
      creation_date: new Date().toISOString(),
      status: "Active",
      has_more: false,
      isPending: newMessage.isPending || false,
      isError: newMessage.isError || false
    };

    setMessages(prev => {
      if (newMessage.isUserMessage || newMessage.isPending) {
        return [...prev, messageToAdd];
      }
      
      if (newMessage.isResponse) {
        const pendingIndex = prev.findIndex(msg => 
          msg.question === messageToAdd.question && msg.isPending
        );
        
        if (pendingIndex !== -1) {
          const updatedMessages = [...prev];
          updatedMessages[pendingIndex] = {
            ...messageToAdd,
            isPending: false,
            message_id: prev[pendingIndex].message_id
          };
          return updatedMessages;
        }
      }
      
      const isDuplicate = prev.some(msg => 
        msg.question === messageToAdd.question && 
        msg.answer === messageToAdd.answer &&
        !msg.isPending &&
        Math.abs(new Date(msg.creation_date) - new Date(messageToAdd.creation_date)) < 5000
      );
      
      if (isDuplicate) {
        return prev;
      }
      
      return [...prev, messageToAdd];
    });
  }, [currentConversation]);

  const contextValue = useMemo(() => ({
    conversations,
    currentConversation,
    messages,
    isLoadingConversations,
    isLoadingMessages,
    hasMoreMessages,
    nextCursor,
    fetchConversations,
    createConversation,
    selectConversation,
    fetchMessages,
    loadMoreMessages,
    addMessageToConversation
  }), [
    conversations,
    currentConversation,
    messages,
    isLoadingConversations,
    isLoadingMessages,
    hasMoreMessages,
    nextCursor, 
    fetchConversations,
    createConversation,
    selectConversation,
    fetchMessages,
    loadMoreMessages,
    addMessageToConversation
  ]);

  return (
    <ConversationContext.Provider value={contextValue}>
      {children}
    </ConversationContext.Provider>
  );
};

export const useConversations = () => {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error('useConversations must be used within a ConversationProvider');
  }
  return context;
};