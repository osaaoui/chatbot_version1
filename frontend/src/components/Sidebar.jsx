import React, { useRef } from "react";
import axios from "axios";
import { DocumentIcon, ArrowUpTrayIcon } from "@heroicons/react/24/outline";

/**
 * Sidebar handles:
 * - Drag-and-drop + file picker uploads
 * - Displaying uploaded file list
 * - Processing staged files
 * - UI styled like design + heroicons restored
 */
const Sidebar = ({

  stagedFiles,
  setStagedFiles,
  email,
  uploadedFiles,
  onProcess,
  onFileSelected,
  isProcessing,
}) => {
  
  const fileInputRef = useRef(null);

  // When user picks a file using the input element
  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    handleUpload(files);
  };

  // Drag & drop behavior
  const handleDrop = (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    handleUpload(files);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  // Upload each file to the backend and update UI state
  const handleUpload = async (files) => {
  for (const file of files) {
    const tempRecord = {
      name: file.name,
      original: file.name,
      status: "uploading",
    };

    // Immediately show file with 'uploading' status
    setStagedFiles((prev) => [...prev, tempRecord]);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("user_id", email);

      const response = await axios.post(
        "http://localhost:8000/api/v2/documents/upload/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const uploadedName = response.data.filename || file.name;

      // Update file record to 'uploaded'
      setStagedFiles((prev) =>
        prev.map((f) =>
          f.name === file.name
            ? { ...f, name: uploadedName, status: "uploaded" }
            : f
        )
      );

      if (onFileSelected)
        onFileSelected({ name: uploadedName, original: file.name });
    } catch (err) {
      console.error("Error uploading file:", file.name, err);

      // Mark the file as failed
      setStagedFiles((prev) =>
        prev.map((f) =>
          f.name === file.name ? { ...f, status: "error" } : f
        )
      );
    }
  }
};

  return (
    <div className="flex flex-col items-center w-[280px] h-screen px-4 py-6 bg-gray-50 border-r border-gray-200">
      {/* Header with icon */}
      <h2 className="flex items-center gap-2 text-base font-semibold text-gray-700 mb-6">
        <DocumentIcon className="w-5 h-5 text-purple-600" />
        Documents
      </h2>

      {/* Upload area */}
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

      {/* Uploaded files */}
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
      <span
  className={`ml-2 text-xs font-medium ${
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

    </li>
  ))}
</ul>

        )}
      </div>

      {/* Process Documents button */}
{/* Visual Processing Bar */}
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

{/* Process Documents button */}
{stagedFiles.length > 0 && (
  <button
    onClick={onProcess}
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
