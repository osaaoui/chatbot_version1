import React, { useState, useCallback } from "react";
import { useTranslation } from 'react-i18next';
import Sidebar from "./components/Sidebar";
import ChatPane from "./components/ChatPane";
import AuthForm from "./components/AuthForm";
import Header from "./components/Header";
import { useAuth } from "./context/AuthProvider";
import PDFViewerComponent from "./components/PDFViewerComponent";
import { useFileManagement } from "./hooks/app/useFileManagement";
import { useChatLogic } from "./hooks/app/useChatLogic";

const Layout = ({ sidebarOpen, selectedSource, children }) => (
  <div className="flex-1 h-full flex">
    {selectedSource && (
      <div className="h-full w-1/2">
        <PDFViewerComponent
          source={{
            filename: selectedSource.filename,
            snippet: selectedSource.snippet,
            page: selectedSource.page ?? 0,
          }}
        />
      </div>
    )}
    <div className={`h-full ${selectedSource ? 'w-1/2' : 'w-full'}`}>
      {children}
    </div>
  </div>
);

export default function App() {
  const { token, user, logout, loaded } = useAuth();
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedSource, setSelectedSource] = useState(null);

  const {
    uploadedFiles,
    stagedFiles,
    isProcessing,
    setStagedFiles,
    handleProcess: processFiles
  } = useFileManagement(user, token, t);

  const {
    question,
    answer,
    sources,
    setQuestion,
    sendQuestion
  } = useChatLogic(user, token, t, setSelectedSource);

  const handleFileChange = useCallback((e) => {
    if (e.target.files?.length > 0) {
      setFile(e.target.files[0]);
    }
  }, []);

  const handleFileSelected = useCallback((file) => {
    setFile(file);
  }, []);

  const handleSourceSelection = useCallback((sourceData) => {
    setSelectedSource({
      ...sourceData,
      autoSelected: false
    });
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
    <div className="bg-bg-secondary h-screen overflow-hidden">
      <Header onLogout={logout} />
      <div className="flex h-full pt-[57px]">
        {sidebarOpen && (
          <div className="h-full flex-shrink-0">
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
        
        <Layout sidebarOpen={sidebarOpen} selectedSource={selectedSource}>
          <ChatPane
            question={question}
            answer={answer}
            sources={sources}
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
    </div>
  );
}