import React, { createContext, useContext, useState, useCallback } from 'react';
import { folderService } from '../services/folderService';

const FoldersContext = createContext();

export const useFolders = () => {
  const context = useContext(FoldersContext);
  if (!context) {
    throw new Error('useFolders must be used within a FoldersProvider');
  }
  return context;
};

export const FoldersProvider = ({ children }) => {
  const [foldersByDocumentBase, setFoldersByDocumentBase] = useState({});
  const [error, setError] = useState(null);

  const getFoldersForDocumentBase = useCallback((documentBaseId) => {
    return foldersByDocumentBase[documentBaseId] || [];
  }, [foldersByDocumentBase]);

  const fetchFolders = useCallback(async (documentBaseId) => {
    if (!documentBaseId) return;

    setError(null);
    try {
      const response = await folderService.getFolders();
      if (response.success) {
        let foldersData = response.data || [];
        foldersData = foldersData.filter(folder => folder.document_base_id === documentBaseId);
        
        setFoldersByDocumentBase(prev => ({
          ...prev,
          [documentBaseId]: foldersData
        }));
      } else {
        setError(response.message || 'Error fetching folders');
      }
    } catch (err) {
      setError(err.message || 'Error fetching folders');
    }
  }, []);

  const createFolder = useCallback(async (data) => {
    setError(null);
    try {
      const response = await folderService.createFolder(data);
      if (response.success) {
        await fetchFolders(data.document_base_id);
        return response;
      } else {
        setError(response.message || 'Error creating folder');
        return response;
      }
    } catch (err) {
      const errorMessage = err.message || 'Error creating folder';
      setError(errorMessage);
      throw err;
    }
  }, [fetchFolders]);

  const updateFolder = useCallback(async (folderId, documentBaseId, folderName = null, parentFolderId = undefined) => {
    setError(null);
    try {
      const response = await folderService.updateFolder(folderId, folderName, parentFolderId);
      if (response.success) {
        await fetchFolders(documentBaseId);
        return response;
      } else {
        setError(response.message || 'Error updating folder');
        return response;
      }
    } catch (err) {
      const errorMessage = err.message || 'Error updating folder';
      setError(errorMessage);
      throw err;
    }
  }, [fetchFolders]);

  const deleteFolder = useCallback(async (folderId, documentBaseId) => {
    setError(null);
    try {
      const response = await folderService.deleteFolder(folderId);
      if (response.success) {
        await fetchFolders(documentBaseId);
        return response;
      } else {
        setError(response.message || 'Error deleting folder');
        return response;
      }
    } catch (err) {
      const errorMessage = err.message || 'Error deleting folder';
      setError(errorMessage);
      throw err;
    }
  }, [fetchFolders]);

  // Build hierarchical folder structure from flat array
  const getFoldersHierarchy = useCallback((documentBaseId) => {
    const folders = getFoldersForDocumentBase(documentBaseId);
    const folderMap = new Map();
    const rootFolders = [];

    folders.forEach(folder => {
      folderMap.set(folder.folder_id, { ...folder, children: [] });
    });

    folders.forEach(folder => {
      if (folder.parent_folder_id) {
        const parent = folderMap.get(folder.parent_folder_id);
        if (parent) {
          parent.children.push(folderMap.get(folder.folder_id));
        }
      } else {
        rootFolders.push(folderMap.get(folder.folder_id));
      }
    });

    return rootFolders;
  }, [getFoldersForDocumentBase]);

  const value = {
    foldersByDocumentBase,
    error,
    getFoldersForDocumentBase,
    fetchFolders,
    createFolder,
    updateFolder,
    deleteFolder,
    getFoldersHierarchy
  };

  return (
    <FoldersContext.Provider value={value}>
      {children}
    </FoldersContext.Provider>
  );
};