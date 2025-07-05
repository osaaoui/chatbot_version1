import React, { useState } from "react";
import axios from "axios";
import Sidebar from "./components/Sidebar";
import ChatPane from "./components/ChatPane";
import AuthForm from "./components/AuthForm";
import Header from "./components/Header";
import { useAuth } from "./context/AuthProvider"; // ✅ working one




export default function App() {
  const { token, user, logout, loaded } = useAuth(); // <- from useAuth.js
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [file, setFile] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [sources, setSources] = useState([]);
  const [stagedFiles, setStagedFiles] = useState([]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

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

  const handleProcess = async () => {
    if (!file || !token || !user) return;

    try {
      const res = await axios.post(
        "http://localhost:8000/api/v2/documents/process/",
        {
          filename: file.name,
          user_id: user.email,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert(`✅ ${res.data.message}: ${res.data.total_chunks} chunks`);
    } catch (err) {
      alert("❌ Failed to process file");
      console.error(err);
    }
  };

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

  const handleFileSelected = (file) => {
  setFile(file);  // So handleProcess knows what file to send
};

  if (!loaded) return null; // or show a spinner while loading

if (!token || !user) return <AuthForm />;

  return (
    <div>
      <Header onLogout={logout} />
      <div style={{ display: "flex", height: "calc(100vh - 3rem)" }}>
        <Sidebar stagedFiles={stagedFiles} setStagedFiles={setStagedFiles} 
          onFileChange={handleFileChange}
          onUpload={handleUpload}
          onProcess={handleProcess}
          uploadedFiles={uploadedFiles}
          email={user?.email}
          onFileSelected={handleFileSelected}
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
