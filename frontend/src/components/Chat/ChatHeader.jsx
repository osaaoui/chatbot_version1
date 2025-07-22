import React from 'react';
import { useTranslation } from 'react-i18next';
import { PanelLeft, MessageSquare } from 'lucide-react';
import ButtonModal from '../ui/ButtonModal'; 

const ChatHeader = ({ 
  currentConversation, 
  toggleSidebar, 
  onShowConversations
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex-shrink-0 p-2 border-b border-border-light bg-bg-primary relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSidebar}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-bg-tertiary text-text-secondary h-7 w-7"
            title={t('chat.toggleSidebar')}
          >
            <PanelLeft />
            <span className="sr-only">{t('chat.toggleSidebar')}</span>
          </button>
          <h3 className="font-medium">
            {currentConversation?.title || t('chat.newChat')}
          </h3>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onShowConversations}
            className="flex items-center gap-1 text-xs px-3 py-1.5 bg-white hover:bg-gray-50 rounded-md border border-gray-200 shadow-sm transition-colors"
          >
            <MessageSquare className="w-3 h-3" />
            {t('chat.conversations')}
          </button>
          
          <ButtonModal 
            size="w-8 h-8"
            className="ml-1"
          />
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;