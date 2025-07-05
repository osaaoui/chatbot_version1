import React, { useRef } from "react";
import axios from "axios";

const Sidebar = ({
  stagedFiles,
  setStagedFiles,
  email,
  uploadedFiles,
  onProcess,
  onFileSelected
}) => {
  const fileInputRef = useRef(null);

  // Handle file picker selection
  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    handleUpload(files);
  };

  // Handle drag-and-drop
  const handleDrop = (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    handleUpload(files);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  // Upload files immediately and update state
  const handleUpload = async (files) => {
  for (const file of files) {
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
      console.log("Upload response:", response.data);

      const fileRecord = { name: uploadedName, original: file.name };

      // Update UI state
      setStagedFiles((prev) => [...prev, fileRecord]);

      // Notify App component so it can set `file` for processing
      if (onFileSelected) onFileSelected(fileRecord);

    } catch (err) {
      console.error("Error uploading file:", file.name, err);
    }
  }
};


  return (
    <div
      className="w-64 h-full bg-gray-100 p-4 border-r overflow-auto"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <h2 className="text-lg font-semibold mb-4">Documents</h2>

      <ul className="space-y-2">
        {stagedFiles.map((file, index) => (
          <li key={index} className="bg-white p-2 rounded shadow-sm">
            {file.name}
          </li>
        ))}
      </ul>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        hidden
      />

      <button
        onClick={() => fileInputRef.current.click()}
        className="mt-4 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
      >
        Choose Files
      </button>

      <button
        onClick={onProcess}
        className="mt-2 w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
      >
        Process Documents
      </button>
    </div>
  );
};

export default Sidebar;
