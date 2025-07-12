// src/hooks/useFolders.js
import { useState, useEffect, useCallback } from 'react';
import { folderService } from '../services/folderService';

export const useFolders = (documentBaseId = null) => {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFolders = useCallback(async () => {
    // 🔧 No hacer fetch si no hay documentBaseId
    if (!documentBaseId) {
      setFolders([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await folderService.getFolders();
      if (response.success) {
        let foldersData = response.data || [];
        
        // Filter by document_base_id
        foldersData = foldersData.filter(folder => folder.document_base_id === documentBaseId);
        
        setFolders(foldersData);
      } else {
        setError(response.message || 'Error fetching folders');
      }
    } catch (err) {
      setError(err.message || 'Error fetching folders');
    } finally {
      setLoading(false);
    }
  }, [documentBaseId]);

  const createFolder = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await folderService.createFolder(data);
      if (response.success) {
        // 🔧 Actualización optimista - agregar a la lista existente
        if (response.data && documentBaseId && response.data.document_base_id === documentBaseId) {
          setFolders(prevFolders => [...prevFolders, response.data]);
        } else {
          await fetchFolders(); // Fallback a refetch
        }
        return response;
      } else {
        setError(response.message || 'Error creating folder');
        return response;
      }
    } catch (err) {
      const errorMessage = err.message || 'Error creating folder';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchFolders, documentBaseId]);

  const updateFolder = useCallback(async (folderId, folderName) => {
    setLoading(true);
    setError(null);
    try {
      const response = await folderService.updateFolder(folderId, folderName);
      if (response.success) {
        // 🔧 Actualización optimista - actualizar en la lista existente
        if (response.data) {
          setFolders(prevFolders => 
            prevFolders.map(folder => 
              folder.folder_id === folderId ? response.data : folder
            )
          );
        } else {
          await fetchFolders(); // Fallback a refetch
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
    } finally {
      setLoading(false);
    }
  }, [fetchFolders]);

  const deleteFolder = useCallback(async (folderId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await folderService.deleteFolder(folderId);
      if (response.success) {
        // 🔧 Actualización optimista - remover de la lista existente
        setFolders(prevFolders => 
          prevFolders.filter(folder => folder.folder_id !== folderId)
        );
        return response;
      } else {
        setError(response.message || 'Error deleting folder');
        return response;
      }
    } catch (err) {
      const errorMessage = err.message || 'Error deleting folder';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Helper function to organize folders in hierarchy
  const getFoldersHierarchy = useCallback(() => {
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
  }, [folders]);

  // 🔧 Solo hacer fetch automático si hay documentBaseId
  useEffect(() => {
    if (documentBaseId) {
      fetchFolders();
    }
  }, [fetchFolders, documentBaseId]);

  return {
    folders,
    loading,
    error,
    fetchFolders, // 🔧 Exponer fetchFolders para uso manual
    createFolder,
    updateFolder,
    deleteFolder,
    getFoldersHierarchy
  };
};