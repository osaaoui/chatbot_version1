import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "./components/Sidebar";
import ChatPane from "./components/ChatPane";
import AuthForm from "./components/AuthForm";
import Header from "./components/Header";
import { useAuth } from "./context/AuthProvider"; // Auth context hook

export default function App() {
  const { token, user, logout, loaded } = useAuth(); // Auth state
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [file, setFile] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [sources, setSources] = useState([]);
  const [stagedFiles, setStagedFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // ✅ Always call hooks at the top-level – this one stays here
  useEffect(() => {
    setQuestion("");
  setAnswer("");
  setSources([]);
    const fetchFiles = async () => {
      if (token && user?.email) {
        try {
          const response = await axios.get("http://localhost:8000/files", {
            params: { user_id: user.email },
          });
          setUploadedFiles(response.data.files);
          
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

  // Upload the selected file to the backend
  const handleUpload = async () => {
    if (!file || !token || !user) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_id", user.email);

    try {
      const response = await axios.post(
        "http://localhost:8000/api/v2/documents/upload/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const uploadedName = response.data.filename || file.name;
      setUploadedFiles((prev) => [...prev, uploadedName]);
    } catch (error) {
      console.error("Upload failed", error);
    }
  };

  // Process uploaded files
  const handleProcess = async () => {
    if (!stagedFiles.length || !token || !user) return;

    setIsProcessing(true);

    try {
      const response = await axios.post(
        "http://localhost:8000/api/v2/documents/process/",
        {
          user_id: user.email,
          filenames: stagedFiles.map((f) => f.name),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const processed = response.data.processed_files || [file.name];

      // Update file status to processed
      setStagedFiles((prev) =>
        prev.map((f) =>
          processed.includes(f.name) ? { ...f, status: "processed" } : f
        )
      );

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

      setAnswer(res.data.answer);
      setSources(res.data.sources || []);
      setQuestion("");
    } catch (err) {
      setAnswer("Failed to get answer.");
    }
  };

  // Used to select a file from the sidebar component
  const handleFileSelected = (file) => {
    setFile(file);
  };

  return (
    <div>
      <Header onLogout={logout} />
      <div className="flex h-screen">
        <Sidebar
          stagedFiles={stagedFiles}
          setStagedFiles={setStagedFiles}
          onFileChange={handleFileChange}
          onUpload={handleUpload}
          onProcess={handleProcess}
          uploadedFiles={uploadedFiles}
          email={user?.email}
          onFileSelected={handleFileSelected}
          isProcessing={isProcessing}
        />
        <ChatPane
          question={question}
          answer={answer}
          sources={sources}
          onQuestionChange={(e) => setQuestion(e.target.value)}
          onSend={sendQuestion}
        />
      </div>
    </div>
  );
}
