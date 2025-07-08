import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "./components/Sidebar";
import ChatPane from "./components/ChatPane";
import AuthForm from "./components/AuthForm";
import Header from "./components/Header";
import { useAuth } from "./context/AuthProvider"; // Auth context hook
import DocumentViewer from "./components/DocumentViewer";

export default function App() {
  const { token, user, logout, loaded } = useAuth(); // Auth state
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [file, setFile] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [sources, setSources] = useState([
    {
    content: "This is a fake source for testing.",
    metadata: { source: "test.pdf", page: 2 }
  }
  ]);
  const [stagedFiles, setStagedFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedSource, setSelectedSource] = useState(null); 



  // ✅ Always call hooks at the top-level – this one stays here
  useEffect(() => {
  setQuestion("");
  setAnswer("");
  setSources([]);

  const fetchFiles = async () => {
    if (token && user?.email) {
      try {
        const response = await axios.get(
          `http://localhost:8000/api/v2/documents/user-documents/${user.email}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        

        // Normalize the backend metadata into the expected structure
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

  // ✅ Show nothing (or spinner) while auth state is loading
  if (!loaded) return null;

  // ✅ Show login form if not authenticated
  if (!token || !user) return <AuthForm />;

  // Handle local file selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };


 // Process uploaded files
const handleProcess = async () => {
  console.log("🟣 handleProcess called");

  // ✅ Filter out already processed files
  const filesToProcess = stagedFiles.filter((f) => f.status !== "processed");
  console.log("🟣 Sending to process:", filesToProcess.map((f) => f.name));

  if (!filesToProcess.length || !token || !user) return;

  setIsProcessing(true);

  try {
    const response = await axios.post(
      "http://localhost:8000/api/v2/documents/process/",
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

    // ✅ Update and deduplicate staged files
    const updated = stagedFiles.map((f) =>
      processed.includes(f.name) ? { ...f, status: "processed" } : f
    );

    const deduplicated = Array.from(
      new Map(updated.map((f) => [f.name, f])).values()
    );

    setStagedFiles(deduplicated);

    alert(
      `✅ ${response.data.overall_message || "Processing completed"}: ${
        response.data.total_chunks || "?"
      } chunks`
    );
  } catch (err) {
    alert("❌ Failed to process file(s)");
    console.error(err);
  } finally {
    setIsProcessing(false);
  }
};


  // Submit user question to chat endpoint
  const sendQuestion = async () => {
    if (!token || !user) return;

    try {
      const res = await axios.post(
        "http://localhost:8000/api/v2/chat/",
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
      setSources(res.data.sources || []);
      console.log("Cleaned sources in frontend:", res.data.sources);

      setQuestion("");
    } catch (err) {
      setAnswer("Failed to get answer.");
    }
  };

  // Used to select a file from the sidebar component
  const handleFileSelected = (file) => {
    setFile(file);
  };
console.log("🧠 App user.role =", user?.role);
  return (
    <div>
      <Header onLogout={logout} />
<div
  className={`flex mt-[48px] h-[calc(100vh-48px)] transition-all duration-300 ${
    sidebarOpen ? "ml-[280px]" : "ml-0"
  }`}
>

        {sidebarOpen && (
          
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
        )}
        
        <ChatPane
          question={question}
          answer={answer}
          sources={sources}
          onQuestionChange={(e) => setQuestion(e.target.value)}
          onSend={sendQuestion}
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          setSelectedSource={setSelectedSource}

        />
           {/* Document Viewer */}
{selectedSource && (
  <>
    {console.log("📄 Selected source snippet:", selectedSource.snippet)}
    <DocumentViewer
      source={{
        metadata: {
          source: selectedSource.filename,
          page: selectedSource.page
        },
        snippet: selectedSource.snippet

      }}
      onClose={() => setSelectedSource(null)}
    />
  </>
)}

      </div>

    </div>
  );
}
