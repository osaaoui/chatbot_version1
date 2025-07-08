import React, { useRef } from "react";
import axios from "axios";
import { DocumentIcon, ArrowUpTrayIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useEffect } from "react";

const Sidebar = ({
  stagedFiles,
  setStagedFiles,
  email,
  uploadedFiles,
  onProcess,
  onFileSelected,
  isProcessing,
  user,
  userRole,
}) => {
  const fileInputRef = useRef(null);

  useEffect(() => {
    console.log("Sidebar mounted. email =", email);
    console.log("🧠 Sidebar userRole:", userRole);


    const fetchPersistedDocs = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/user-documents", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (Array.isArray(response.data)) {
          const existingNames = new Set(
            stagedFiles.flatMap((f) => [f.name, f.original])
          );

          const docsToAdd = response.data.filter(
            (name) => !existingNames.has(name)
          );

          const restored = docsToAdd.map((name) => ({
            name,
            original: name,
            status: "processed",
          }));

          const merged = [...restored, ...stagedFiles];

          const deduplicated = Array.from(
            new Map(merged.map((f) => [f.name, f])).values()
          );

          setStagedFiles(deduplicated);
        } else {
          console.warn("Unexpected response from /user-documents:", response.data);
        }
      } catch (error) {
        console.error("Failed to load user documents:", error);
      }
    };

    if (email) {
      fetchPersistedDocs();
    }
  }, [email]);

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    handleUpload(files);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    handleUpload(files);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleUpload = async (files) => {
    for (const file of files) {
      const tempRecord = {
        name: file.name,
        original: file.name,
        status: "uploading",
      };

      setStagedFiles((prev) => [...prev, tempRecord]);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("user_id", email);

        const response = await axios.post(
          "http://localhost:8000/api/v2/uploads/upload/",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        const uploadedName = response.data.filename || file.name;

        setStagedFiles((prev) =>
          prev.map((f) =>
            f.name === file.name ? { ...f, name: uploadedName, status: "uploaded" } : f
          )
        );

        if (onFileSelected)
          onFileSelected({ name: uploadedName, original: file.name });
      } catch (err) {
        console.error("Error uploading file:", file.name, err);
        setStagedFiles((prev) =>
          prev.map((f) => (f.name === file.name ? { ...f, status: "error" } : f))
        );
      }
    }
  };

  const handleDelete = async (filename) => {
  if (!filename || !email) return;

  try {
    const res = await axios.delete(
      `http://localhost:8000/api/v2/documents/delete/${filename}?user_id=${email}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    console.log("✅ Deleted:", res.data);
    // Update UI
    setStagedFiles((prev) => prev.filter((f) => f.name !== filename));
  } catch (err) {
    console.error("❌ Failed to delete file:", err);
    alert("Failed to delete file.");
  }
};

  return (
    <div className="fixed top-0 left-0 z-10 flex flex-col items-center w-[280px] h-screen px-4 py-6 bg-gray-50 border-r border-gray-200">
      <h2 className="flex items-center gap-2 text-base font-semibold text-gray-700 mb-6">
        <DocumentIcon className="w-5 h-5 text-purple-600" />
        Documents
      </h2>

      <div
        className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-purple-400 transition"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current.click()}
      >
        <ArrowUpTrayIcon className="mx-auto w-6 h-6 text-gray-400 mb-2" />
        <p className="text-gray-500 text-sm">
          Drop your document here <br /> or click to browse
        </p>
        <button className="mt-2 px-4 py-1 text-sm bg-white border border-gray-300 rounded hover:border-purple-500">
          Choose File
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.txt,.docx"
          className="hidden"
        />
      </div>

      <div className="mt-6 w-full text-sm text-gray-700 flex-1 overflow-y-auto">
        {stagedFiles.length === 0 ? (
          <div className="flex flex-col items-center text-gray-400 mt-4">
            <DocumentIcon className="w-5 h-5 mb-1" />
            <span>No documents uploaded</span>
          </div>
        ) : (
          <ul className="mt-2">
  {stagedFiles.map((file, index) => (
    <li
      key={index}
      className="flex justify-between items-center py-1 px-2 hover:bg-gray-100 rounded"
    >
      <span className="truncate">{file.original}</span>
      <div className="flex items-center space-x-2">
        <span
          className={`text-xs font-medium ${
            file.status === "uploaded"
              ? "text-green-600"
              : file.status === "uploading"
              ? "text-yellow-500"
              : file.status === "processed"
              ? "text-purple-600 font-semibold"
              : "text-red-500"
          }`}
        >
          {file.status}
        </span>

        {userRole === "admin" && (
          <button
            onClick={() => handleDelete(file.name)}
            className="text-gray-400 hover:text-red-600"
            title="Delete file"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </li>
  ))}
</ul>

        )}
      </div>

      {isProcessing && (
        <div className="w-full my-4">
          <div className="relative w-full h-2 bg-gray-200 rounded overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-purple-600 animate-pulse w-1/2 rounded"></div>
          </div>
          <p className="text-xs text-center text-purple-600 mt-2">
            Processing documents...
          </p>
        </div>
      )}

      {stagedFiles.length > 0 && (
        <button
          onClick={() => {
            console.log("🟢 Sidebar: Process button clicked");
            onProcess();
          }}
          disabled={isProcessing}
          className={`mt-4 w-full px-4 py-2 text-sm text-white rounded transition ${
            isProcessing
              ? "bg-purple-300 cursor-not-allowed"
              : "bg-purple-600 hover:bg-purple-700"
          }`}
        >
          {isProcessing ? "Processing..." : "Process Documents"}
        </button>
      )}
    </div>
  );
};

export default Sidebar;