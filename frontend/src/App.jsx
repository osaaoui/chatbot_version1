import React, { useState, useCallback } from "react";
import { useTranslation } from 'react-i18next';
import Sidebar from "./components/Sidebar";
import ChatPane from "./components/Chat/ChatPane";
import AuthForm from "./components/AuthForm";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { useAuth } from "./context/AuthProvider";
import { ConversationProvider } from "./context/ConversationProvider"; 
import PDFViewerComponent from "./components/PDFViewerComponent";
import { useFileManagement } from "./hooks/app/useFileManagement";
import { useChatLogic } from "./hooks/chat/useChatLogic";

const Layout = ({ selectedSource, onClosePDF, children }) => (
  <div className="flex-1 h-full flex">
    <div className={`h-full ${selectedSource ? 'w-1/2' : 'w-full'}`}>
      {children}
    </div>
    {selectedSource && (
      <div className="h-full w-1/2">
        <PDFViewerComponent
          source={{
            filename: selectedSource.filename,
            snippet: selectedSource.snippet,
            page: selectedSource.page ?? 0,
          }}
          onClosePDF={onClosePDF}
        />
      </div>
    )}
  </div>
);

function AppContent() { 
  const { token, user, logout, loaded } = useAuth();
  const { t } = useTranslation();
  const [, setFile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedSource, setSelectedSource] = useState(null);

  const { uploadedFiles, stagedFiles, isProcessing, setStagedFiles, handleProcess: processFiles } = useFileManagement(user, token, t);

  const handleAutoSourceSelection = useCallback((sourceData) => {
    if (sourceData?.autoSelected !== false) {
      return;
    }
    setSelectedSource(sourceData);
  }, []);

  const { 
    question, 
    answer, 
    sources, 
    chatHistory,
    isLoading,
    currentConversation,
    hasMoreMessages,
    isLoadingMessages,
    setQuestion, 
    sendQuestion,
    loadMoreMessages
  } = useChatLogic(user, token, t, handleAutoSourceSelection);

  const handleFileChange = useCallback((e) => {
    if (e.target.files?.length > 0) {
      setFile(e.target.files[0]);
    }
  }, []);

  const handleFileSelected = useCallback((file) => {
    setFile(file);
  }, []);

  const handleSourceSelection = useCallback((sourceData) => {
    setSelectedSource({ ...sourceData, autoSelected: false });
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const closePDF = useCallback(() => {
    setSelectedSource(null);
  }, []);

  if (!loaded) return null;
  if (!token || !user) return <AuthForm />;

  return (
    <div className="app-layout">
      <Header onLogout={logout} />

      <div className="app-content">
        {sidebarOpen && (
          <div className="sidebar-container">
            <Sidebar
              stagedFiles={stagedFiles}
              setStagedFiles={setStagedFiles}
              onFileChange={handleFileChange}
              onProcess={processFiles}
              uploadedFiles={uploadedFiles}
              email={user?.email}
              onFileSelected={handleFileSelected}
              isProcessing={isProcessing}
              userRole={user?.role}
              toggleSidebar={toggleSidebar}
            />
          </div>
        )}

        <Layout selectedSource={selectedSource} onClosePDF={closePDF}>
          <ChatPane
            question={question}
            answer={answer}
            sources={sources}
            chatHistory={chatHistory} 
            isLoading={isLoading} 
            currentConversation={currentConversation} 
            hasMoreMessages={hasMoreMessages}
            isLoadingMessages={isLoadingMessages}
            loadMoreMessages={loadMoreMessages} 
            onQuestionChange={(e) => setQuestion(e.target.value)}
            onSend={sendQuestion}
            toggleSidebar={toggleSidebar}
            setSelectedSource={handleSourceSelection}
            selectedSource={selectedSource}
            onClosePDF={closePDF}
            sidebarOpen={sidebarOpen}
          />
        </Layout>
      </div>
      <Footer />
    </div>
    
  );
}

export default function App() {
  return (
    <ConversationProvider>
      <AppContent />
    </ConversationProvider>
  );
}