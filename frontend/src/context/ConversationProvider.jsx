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

  const fetchMessages = useCallback(async (token, conversationId, loadMore = false, preservePendingMessages = false) => {
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
        
        const validMessages = newMessages
          .filter(msg => msg && (msg.question || msg.answer) && msg.message_id)
          .map(msg => {
            let parsedSources = msg.sources;
            if (typeof msg.sources === 'string') {
              try {
                parsedSources = JSON.parse(msg.sources);
              } catch (e) {
                console.warn('Error parsing sources:', e);
                parsedSources = [];
              }
            }
            
            return {
              ...msg,
              sources: parsedSources || []
            };
          });
        
        if (loadMore) {
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.message_id));
            const uniqueNewMessages = validMessages.filter(m => !existingIds.has(m.message_id));
            
            return [...uniqueNewMessages, ...prev];
          });
        } else {
          setMessages(prev => {
            if (preservePendingMessages) {
              const pendingMessages = prev.filter(msg => {
                const isTemporary = String(msg.message_id).includes('-') && 
                                  (msg.isUserMessage || msg.isPending || !msg.answer);
                return isTemporary;
              });
              
              const existingIds = new Set(validMessages.map(m => m.message_id));
              const uniquePendingMessages = pendingMessages.filter(m => !existingIds.has(m.message_id));
              
              return [...validMessages, ...uniquePendingMessages];
            }
            
            return validMessages;
          });
        }

        if (validMessages.length > 0) {
          const oldestMessage = validMessages[0];
          
          const hasMore = validMessages.some(msg => msg.has_more) || false;
          
          setHasMoreMessages(hasMore);
          
          if (hasMore) {
            setNextCursor({
              messageId: oldestMessage.message_id,
              date: oldestMessage.creation_date
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
    } finally {
      setIsLoadingMessages(false);
    }
  }, [nextCursor]);

  const selectConversation = useCallback(async (token, conversation, preservePendingMessages = false) => {
    setCurrentConversation(conversation);
    setNextCursor(null);
    setHasMoreMessages(false);
    
    if (!preservePendingMessages) {
      setMessages([]);
    }
    
    if (conversation) {
      await fetchMessages(token, conversation.conversation_id, false, preservePendingMessages);
    } else if (!preservePendingMessages) {
      setMessages([]);
    }
  }, [fetchMessages]);

  const setCurrentConversationDirect = useCallback((conversation) => {
    setCurrentConversation(conversation);
  }, []);

  const loadMoreMessages = useCallback(async (token) => {
    if (!token || !hasMoreMessages || isLoadingMessages || !currentConversation || !nextCursor) {
      return;
    }
  
    return await fetchMessages(token, currentConversation.conversation_id, true, false);
  }, [hasMoreMessages, isLoadingMessages, currentConversation, nextCursor, fetchMessages]);

  const addMessageToConversation = useCallback((newMessage) => {
    const messageToAdd = {
      message_id: newMessage.message_id || (newMessage.isUserMessage ? `${Date.now()}-user` : `${Date.now()}-bot`),
      conversation_id: currentConversation?.conversation_id,
      question: newMessage.question,
      answer: newMessage.answer,
      sources: newMessage.sources || [],
      creation_date: newMessage.creation_date || new Date().toISOString(),
      status: "Active",
      has_more: false,
      isPending: newMessage.isPending || false,
      isError: newMessage.isError || false,
      isUserMessage: newMessage.isUserMessage || false
    };

    setMessages(prev => {
      if (newMessage.isUserMessage || newMessage.isPending) {
        return [...prev, messageToAdd];
      }
      
      if (newMessage.isResponse) {
        const pendingIndex = prev.findIndex(msg => 
          msg.question === messageToAdd.question && (msg.isPending || !msg.answer)
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

  const updateMessageInConversation = useCallback((messageId, updates) => {
    setMessages(prevMessages => {
      return prevMessages.map(msg => {
        const matchesId = msg.message_id === messageId || 
                         msg.message_id === messageId.toString() ||
                         msg.message_id.toString() === messageId.toString();
        
        return matchesId ? { ...msg, ...updates } : msg;
      });
    });
  }, []);

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
    setCurrentConversationDirect,
    fetchMessages,
    loadMoreMessages,
    addMessageToConversation,
    updateMessageInConversation
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
    setCurrentConversationDirect,
    fetchMessages,
    loadMoreMessages,
    addMessageToConversation,
    updateMessageInConversation 
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