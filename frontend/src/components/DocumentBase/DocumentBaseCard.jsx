// src/components/DocumentBase/DocumentBaseCard.js
import React, { useState, useEffect } from 'react';
import { ChevronDownIcon, ChevronRightIcon, PlusIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useFolders } from '../../context/FoldersContext';
import { useLanguage } from '../../hooks/useLanguaje';
import FolderCard from './FolderCard';

const DocumentBaseCard = ({ 
  documentBase,
  // Nuevas props para pasar a FolderCard
  onProcessFiles,
  isProcessing = false,
  stagedFiles = [],
  setStagedFiles,
  userEmail
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldLoadFolders, setShouldLoadFolders] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [isDragOverRoot, setIsDragOverRoot] = useState(false);
  
  const { t } = useLanguage();
  
  const { 
    getFoldersForDocumentBase,
    fetchFolders,
    createFolder,
    updateFolder,
    getFoldersHierarchy,
    error 
  } = useFolders();

  const folders = getFoldersForDocumentBase(documentBase.document_base_id);
  const folderHierarchy = getFoldersHierarchy(documentBase.document_base_id);
  const hasFolders = folderHierarchy.length > 0;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleToggleExpand = () => {
    if (!isExpanded && !shouldLoadFolders) {
      setShouldLoadFolders(true);
      setIsExpanded(true);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const handleCreateFolderClick = (e) => {
    e.stopPropagation();
    setShowCreateFolder(true);
  };

  const handleCreateFolder = async () => {
    if (!folderName.trim()) return;

    try {
      const data = {
        folder_name: folderName.trim(),
        document_base_id: documentBase.document_base_id,
        parent_folder_id: null // Root folder
      };
      
      const response = await createFolder(data);
      
      if (response.success) {
        setFolderName('');
        setShowCreateFolder(false);
      }
    } catch (err) {
      console.error('Error creating folder:', err);
    }
  };

  const handleCancelCreateFolder = () => {
    setFolderName('');
    setShowCreateFolder(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleCreateFolder();
    } else if (e.key === 'Escape') {
      handleCancelCreateFolder();
    }
  };

  const handleRootDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleRootDragEnter = (e) => {
    e.preventDefault();
    setIsDragOverRoot(true);
  };

  const handleRootDragLeave = (e) => {
    e.preventDefault();
    // Only remove drag over if leaving the root zone
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOverRoot(false);
    }
  };

  const handleRootDrop = async (e) => {
    e.preventDefault();
    setIsDragOverRoot(false);

    try {
      const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
      const { folderId: draggedFolderId, documentBaseId } = dragData;

      const response = await updateFolder(
        draggedFolderId,
        documentBaseId,
        undefined,
        null  // Move to root level
      );

      if (!response.success) {
        console.error('Failed to move folder to root');
      }
    } catch (err) {
      console.error('Error moving folder to root:', err);
    }
  };

  useEffect(() => {
    if (shouldLoadFolders && folders.length === 0) {
      fetchFolders(documentBase.document_base_id);
    }
  }, [shouldLoadFolders, fetchFolders, documentBase.document_base_id, folders.length]);

  return (
    <div className="w-full bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
      <div 
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-100 transition"
        onClick={handleToggleExpand}
      >
        {isExpanded ? (
          <ChevronDownIcon className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronRightIcon className="w-5 h-5 text-gray-500" />
        )}
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-800 truncate">
            {documentBase.base_name}
          </h3>
          <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
            <span>{t('document_base.created')}: {formatDate(documentBase.creation_date)}</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              documentBase.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {t(`document_base.status.${documentBase.status.toLowerCase()}`)}
            </span>
          </div>
        </div>

        {isExpanded && (
          <button
            onClick={handleCreateFolderClick}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
            title={t('document_base.create_folder')}
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {isExpanded && (
        <div 
          className={`border-t border-gray-200 bg-white transition ${
            isDragOverRoot ? 'bg-blue-50' : ''
          }`}
          onDragOver={handleRootDragOver}
          onDragEnter={handleRootDragEnter}
          onDragLeave={handleRootDragLeave}
          onDrop={handleRootDrop}
        >
          {isDragOverRoot && (
            <div className="p-2 m-2 border-2 border-dashed border-blue-300 bg-blue-100 rounded-md text-center text-sm text-blue-600">
              {t('document_base.drop_here_root')}
            </div>
          )}

          {showCreateFolder && (
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                <input
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={t('document_base.folder_name_placeholder')}
                  className="flex-1 bg-transparent border-none outline-none text-sm placeholder-gray-500"
                  autoFocus
                />
                <button
                  onClick={handleCreateFolder}
                  disabled={!folderName.trim()}
                  className={`p-1 rounded ${
                    folderName.trim() 
                      ? 'text-green-600 hover:bg-green-100' 
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <CheckIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCancelCreateFolder}
                  className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {hasFolders ? (
            <div className="p-3 space-y-2">
              {folderHierarchy.map((folder) => (
                <FolderCard 
                  key={folder.folder_id} 
                  folder={folder} 
                  allFolders={folders}
                  userEmail={userEmail}
                  onProcessFiles={onProcessFiles}
                  isProcessing={isProcessing}
                  stagedFiles={stagedFiles}
                  setStagedFiles={setStagedFiles}
                />
              ))}
            </div>
          ) : !showCreateFolder ? (
            <div className="p-4 text-center text-sm text-gray-500">
              {t('document_base.no_folders')}
            </div>
          ) : null}

          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 border-t border-red-100">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentBaseCard;