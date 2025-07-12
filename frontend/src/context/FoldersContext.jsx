// src/contexts/FoldersContext.js
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
        
        // Filter by document_base_id
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
        // Hacer fetch completo para obtener los datos actualizados
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

  const updateFolder = useCallback(async (folderId, folderName, documentBaseId) => {
    setError(null);
    try {
      const response = await folderService.updateFolder(folderId, folderName);
      if (response.success) {
        // Actualización optimista
        if (response.data && documentBaseId) {
          setFoldersByDocumentBase(prev => ({
            ...prev,
            [documentBaseId]: (prev[documentBaseId] || []).map(folder => 
              folder.folder_id === folderId ? response.data : folder
            )
          }));
        }
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
  }, []);

  const deleteFolder = useCallback(async (folderId, documentBaseId) => {
    setError(null);
    try {
      const response = await folderService.deleteFolder(folderId);
      if (response.success) {
        // Actualización optimista
        if (documentBaseId) {
          setFoldersByDocumentBase(prev => ({
            ...prev,
            [documentBaseId]: (prev[documentBaseId] || []).filter(folder => folder.folder_id !== folderId)
          }));
        }
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
  }, []);

  // Helper function to organize folders in hierarchy for a specific document base
  const getFoldersHierarchy = useCallback((documentBaseId) => {
    const folders = getFoldersForDocumentBase(documentBaseId);
    const folderMap = new Map();
    const rootFolders = [];

    // Create map of all folders
    folders.forEach(folder => {
      folderMap.set(folder.folder_id, { ...folder, children: [] });
    });

    // Build hierarchy
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