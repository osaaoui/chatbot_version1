import { useState, useEffect, useRef, useCallback } from 'react';

export const useScrollBehavior = (chatHistory, hasMoreMessages, isLoadingMessages, loadMoreMessages) => {
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [showLoadMoreButton, setShowLoadMoreButton] = useState(false);
  
  const chatEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const lastMessageCountRef = useRef(0);
  const shouldScrollToBottomRef = useRef(true);
  const scrollToBottomTimeoutRef = useRef(null);

  const isNearBottom = useCallback(() => {
    if (!chatContainerRef.current) return true;
    const container = chatContainerRef.current;
    const { scrollTop, scrollHeight, clientHeight } = container;
    return scrollHeight - scrollTop - clientHeight < 150;
  }, []);

  const isAtTop = useCallback(() => {
    if (!chatContainerRef.current) return false;
    const container = chatContainerRef.current;
    return container.scrollTop <= 150;
  }, []);

  const handleScroll = useCallback(() => {
    if (!chatContainerRef.current) return;
    const atBottom = isNearBottom();
    const atTop = isAtTop();
    setShowScrollToBottom(!atBottom && chatHistory.length > 0);
    setShowLoadMoreButton(atTop && hasMoreMessages && !isLoadingMessages && chatHistory.length > 0);
  }, [isNearBottom, isAtTop, hasMoreMessages, isLoadingMessages, chatHistory.length]);

  const scrollToBottom = useCallback((smooth = true) => {
    if (smooth && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    } else if (chatContainerRef.current) {
      const container = chatContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, []);

  const handleLoadMoreMessages = useCallback(async () => {
    if (!hasMoreMessages || isLoadingMessages || !chatContainerRef.current) return;

    const container = chatContainerRef.current;
    const oldScrollHeight = container.scrollHeight;
    const oldScrollTop = container.scrollTop;

    try {
      await loadMoreMessages();
      setTimeout(() => {
        if (container) {
          const newScrollHeight = container.scrollHeight;
          const heightDifference = newScrollHeight - oldScrollHeight;
          container.scrollTop = oldScrollTop + heightDifference;
          setTimeout(() => handleScroll(), 50);
          setTimeout(() => handleScroll(), 200);
        }
      }, 50);
    } catch (error) {
      console.error('Error loading more messages:', error);
    }
  }, [hasMoreMessages, isLoadingMessages, loadMoreMessages, handleScroll]);

  const resetScrollState = useCallback(() => {
    shouldScrollToBottomRef.current = true;
    lastMessageCountRef.current = 0;
    setShowLoadMoreButton(false);
    setShowScrollToBottom(false);
  }, []);

  const checkPosition = useCallback(() => {
    setTimeout(() => handleScroll(), 50);
    setTimeout(() => handleScroll(), 200);
  }, [handleScroll]);

  useEffect(() => {
    if (chatHistory.length > 0) {
      if (shouldScrollToBottomRef.current) {
        if (scrollToBottomTimeoutRef.current) {
          clearTimeout(scrollToBottomTimeoutRef.current);
        }
        scrollToBottomTimeoutRef.current = setTimeout(() => {
          scrollToBottom(true);
          setTimeout(() => {
            scrollToBottom(false);
            shouldScrollToBottomRef.current = false;
            checkPosition();
          }, 800);
        }, 100);
      } else {
        checkPosition();
      }
    }
  }, [chatHistory.length, checkPosition, scrollToBottom]);

  useEffect(() => {
    if (chatHistory.length > lastMessageCountRef.current) {
      const wasNearBottom = isNearBottom();
      lastMessageCountRef.current = chatHistory.length;
      if (wasNearBottom || chatHistory.length === 1) {
        setTimeout(() => scrollToBottom(true), 50);
      }
    }
  }, [chatHistory.length, isNearBottom, scrollToBottom]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    const initialCheck = setTimeout(() => handleScroll(), 300);
    const secondCheck = setTimeout(() => handleScroll(), 600);
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(initialCheck);
      clearTimeout(secondCheck);
    };
  }, [handleScroll]);

  useEffect(() => {
    return () => {
      if (scrollToBottomTimeoutRef.current) {
        clearTimeout(scrollToBottomTimeoutRef.current);
      }
    };
  }, []);

  return {
    chatEndRef,
    chatContainerRef,
    showScrollToBottom,
    showLoadMoreButton,
    scrollToBottom,
    handleLoadMoreMessages,
    resetScrollState,
    shouldScrollToBottomRef
  };
};