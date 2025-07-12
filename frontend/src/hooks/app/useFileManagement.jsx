import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:8001/api/v2';

const formatFilesData = (data) => 
  data.map(entry => ({
    name: entry.filename,
    status: "processed",
    total_chunks: entry.total_chunks,
    processed_at: entry.processed_at,
  }));

const deduplicateFiles = (files) => 
  Array.from(new Map(files.map(f => [f.name, f])).values());

export const useFileManagement = (user, token, t) => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [stagedFiles, setStagedFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchFiles = useCallback(async () => {
    if (!token || !user?.email) return;

    try {
      const response = await axios.get(
        `${API_BASE}/documents/user-documents/${user.email}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUploadedFiles(formatFilesData(response.data));
    } catch (error) {
      console.error("Failed to fetch uploaded files:", error);
    }
  }, [token, user?.email]);

  const handleProcess = useCallback(async () => {
    const filesToProcess = stagedFiles.filter(f => f.status !== "processed");
    if (!filesToProcess.length || !token || !user) return;

    setIsProcessing(true);

    try {
      const response = await axios.post(
        `${API_BASE}/documents/process/`,
        {
          user_id: user.email,
          filenames: filesToProcess.map(f => f.name),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const processed = response.data.processed_files || [];
      const updated = stagedFiles.map(f =>
        processed.includes(f.name) ? { ...f, status: "processed" } : f
      );

      setStagedFiles(deduplicateFiles(updated));

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
  }, [stagedFiles, token, user, t]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  return {
    uploadedFiles,
    stagedFiles,
    isProcessing,
    setStagedFiles,
    handleProcess
  };
};