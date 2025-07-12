import React, { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import axios from "axios";
import Sidebar from "./components/Sidebar";
import ChatPane from "./components/ChatPane";
import AuthForm from "./components/AuthForm";
import Header from "./components/Header";
import { useAuth } from "./context/AuthProvider";
import PDFViewerComponent from "./components/PDFViewerComponent";



export default function App() {
  const { token, user, logout, loaded } = useAuth();
  const { t } = useTranslation(); // Hook para traducciones
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [file, setFile] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [sources, setSources] = useState([]);
  const [stagedFiles, setStagedFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedSource, setSelectedSource] = useState(null);

  useEffect(() => {
    setQuestion("");
    setAnswer("");
    setSources([]);

    const fetchFiles = async () => {
      if (token && user?.email) {
        try {
          const response = await axios.get(
            `http://localhost:8001/api/v2/documents/user-documents/${user.email}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const formattedFiles = response.data.map(entry => ({
            name: entry.filename,
            status: "processed",
            total_chunks: entry.total_chunks,
            processed_at: entry.processed_at,
          }));

          setUploadedFiles(formattedFiles);
        } catch (error) {
          console.error("Failed to fetch uploaded files:", error);
        }
      }
    };

    fetchFiles();
  }, [token, user]);

  // ✅ Nueva función para auto-seleccionar la fuente más relevante
  const autoSelectBestSource = (sources) => {
    if (!sources || sources.length === 0) return;
    
    // Seleccionar la primera fuente por defecto, o puedes implementar lógica más sofisticada
    const bestSource = sources[0];
    
    console.log("🎯 Auto-selecting source:", bestSource);
    
    setSelectedSource({
      filename: bestSource.metadata?.source,
      page: bestSource.metadata?.page,
      snippet: bestSource.snippet || bestSource.content || "",
      autoSelected: true // ✅ Flag para indicar que fue selección automática
    });
  };

  if (!loaded) return null;
  if (!token || !user) return <AuthForm />;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleProcess = async () => {
    console.log("🟣 handleProcess called");

    const filesToProcess = stagedFiles.filter((f) => f.status !== "processed");
    console.log("🟣 Sending to process:", filesToProcess.map((f) => f.name));

    if (!filesToProcess.length || !token || !user) return;

    setIsProcessing(true);

    try {
      const response = await axios.post(
        "http://localhost:8001/api/v2/documents/process/",
        {
          user_id: user.email,
          filenames: filesToProcess.map((f) => f.name),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const processed = response.data.processed_files || [];
      console.log("🟣 Backend response:", response.data);

      const updated = stagedFiles.map((f) =>
        processed.includes(f.name) ? { ...f, status: "processed" } : f
      );

      const deduplicated = Array.from(
        new Map(updated.map((f) => [f.name, f])).values()
      );

      setStagedFiles(deduplicated);

      // Usar traducciones para los mensajes
      alert(
        `✅ ${response.data.overall_message || t('common.success')}: ${
          response.data.total_chunks || "?"
        } chunks`
      );
    } catch (err) {
      alert(`❌ ${t('common.failed')}`);
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // ✅ Función mejorada para enviar pregunta con auto-highlighting
  const sendQuestion = async () => {
    if (!token || !user) return;

    try {
      const res = await axios.post(
        "http://localhost:8001/api/v2/chat/",
        {
          question,
          user_id: user.email,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Sources returned:", res.data.sources);

      setAnswer(res.data.answer);
      setSources(res.data.sources || []);

      // ✅ Auto-seleccionar y resaltar la fuente más relevante
      if (res.data.sources && res.data.sources.length > 0) {
        // Pequeño delay para asegurar que el estado se actualice
        setTimeout(() => {
          autoSelectBestSource(res.data.sources);
        }, 100);
      }

      setQuestion("");
    } catch (err) {
      setAnswer(`${t('common.failed')} ${err.response?.data?.message || ""}`);
    }
  };

  const handleFileSelected = (file) => {
    setFile(file);
  };

console.log("📄 selectedSource in App.jsx:", selectedSource);

  return (
  <div className="flex flex-col h-screen overflow-hidden bg-white">
    {/* Top Header */}
    <Header onLogout={logout} />

    {/* Sidebar overlay */}
    {sidebarOpen && (
      <div className="fixed top-[48px] left-0 z-20 h-[calc(100vh-48px)] w-[280px] bg-white shadow-lg">
        <Sidebar
          stagedFiles={stagedFiles}
          setStagedFiles={setStagedFiles}
          onFileChange={handleFileChange}
          onProcess={handleProcess}
          uploadedFiles={uploadedFiles}
          email={user?.email}
          onFileSelected={handleFileSelected}
          isProcessing={isProcessing}
          userRole={user?.role}
        />
      </div>
    )}

    {/* Main content area */}
    <div
      className={`mt-[48px] h-[calc(100vh-48px)] transition-all duration-300 ${
        sidebarOpen ? "ml-[280px]" : ""
      }`}
    >
      <div className="flex w-full h-full">
        {/* ChatPane: full width if no PDF, half otherwise */}
        <div
          className={`${
            selectedSource ? "w-1/2" : "w-full"
          } h-full flex flex-col transition-all duration-300`}
        >
          <ChatPane
            question={question}
            answer={answer}
            sources={sources}
            onQuestionChange={(e) => setQuestion(e.target.value)}
            onSend={sendQuestion}
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            setSelectedSource={setSelectedSource}
          />
        </div>

        {/* PDF Viewer */}
        {selectedSource && (
          <div className="w-1/2 h-full overflow-hidden">
            <PDFViewerComponent
              source={{
                filename: selectedSource.filename,
                snippet: selectedSource.snippet,
                page: selectedSource.page ?? 0,
              }}
              onClose={() => setSelectedSource(null)}
            />
          </div>
        )}
      </div>
    </div>
  </div>
);

}
