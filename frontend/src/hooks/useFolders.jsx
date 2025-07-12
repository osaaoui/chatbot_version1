import { useState, useEffect, useCallback } from 'react';
import { folderService } from '../services/folderService';

export const useFolders = (documentBaseId = null) => {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFolders = useCallback(async () => {
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
        if (response.data && documentBaseId && response.data.document_base_id === documentBaseId) {
          setFolders(prevFolders => [...prevFolders, response.data]);
        } else {
          await fetchFolders();
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
        if (response.data) {
          setFolders(prevFolders => 
            prevFolders.map(folder => 
              folder.folder_id === folderId ? response.data : folder
            )
          );
        } else {
          await fetchFolders();
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

  const getFoldersHierarchy = useCallback(() => {
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
  }, [folders]);

  useEffect(() => {
    if (documentBaseId) {
      fetchFolders();
    }
  }, [fetchFolders, documentBaseId]);

  return {
    folders,
    loading,
    error,
    fetchFolders,
    createFolder,
    updateFolder,
    deleteFolder,
    getFoldersHierarchy
  };
};