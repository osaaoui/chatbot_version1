// src/components/DocumentBase/FolderCard.js
import React, { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon, FolderIcon, PlusIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useFolders } from '../../context/FoldersContext';

const FolderCard = ({ folder, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCreateSubfolder, setShowCreateSubfolder] = useState(false);
  const [subfolderName, setSubfolderName] = useState('');
  
  const { createFolder } = useFolders();
  
  const hasChildren = folder.children && folder.children.length > 0;
  const paddingLeft = level * 16;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleCreateSubfolderClick = (e) => {
    e.stopPropagation();
    setShowCreateSubfolder(true);
    if (!isExpanded) {
      setIsExpanded(true);
    }
  };

  const handleCreateSubfolder = async () => {
    if (!subfolderName.trim()) return;

    try {
      const data = {
        folder_name: subfolderName.trim(),
        document_base_id: folder.document_base_id,
        parent_folder_id: folder.folder_id
      };
      
      const response = await createFolder(data);
      
      if (response.success) {
        setSubfolderName('');
        setShowCreateSubfolder(false);
      }
    } catch (err) {
      console.error('Error creating subfolder:', err);
    }
  };

  const handleCancelCreateSubfolder = () => {
    setSubfolderName('');
    setShowCreateSubfolder(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleCreateSubfolder();
    } else if (e.key === 'Escape') {
      handleCancelCreateSubfolder();
    }
  };

  return (
    <div className="w-full">
      <div 
        className={`flex items-center gap-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer transition group ${
          level === 0 ? 'p-2' : 'p-1.5'
        }`}
        style={{ paddingLeft: `${8 + paddingLeft}px` }}
        onClick={handleToggleExpand}
      >
        {hasChildren || showCreateSubfolder ? (
          isExpanded ? (
            <ChevronDownIcon className={`text-gray-500 ${level === 0 ? 'w-4 h-4' : 'w-3 h-3'}`} />
          ) : (
            <ChevronRightIcon className={`text-gray-500 ${level === 0 ? 'w-4 h-4' : 'w-3 h-3'}`} />
          )
        ) : (
          <div className={level === 0 ? 'w-4 h-4' : 'w-3 h-3'} />
        )}
        
        <FolderIcon className={`text-yellow-500 ${level === 0 ? 'w-4 h-4' : 'w-3 h-3'}`} />
        
        <div className="flex-1 min-w-0">
          <span className={`font-medium text-gray-700 truncate block ${
            level === 0 ? 'text-sm' : 'text-xs'
          }`}>
            {folder.folder_name}
          </span>
          {folder.creation_date && level === 0 && (
            <span className="text-xs text-gray-400 block">
              Creado: {formatDate(folder.creation_date)}
            </span>
          )}
        </div>

        {/* Create Subfolder Button */}
        <button
          onClick={handleCreateSubfolderClick}
          className={`text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded opacity-0 group-hover:opacity-100 transition ${
            level === 0 ? 'p-1' : 'p-0.5'
          }`}
          title="Crear subcarpeta"
        >
          <PlusIcon className={level === 0 ? 'w-3 h-3' : 'w-2.5 h-2.5'} />
        </button>
      </div>

      {/* Expanded content (children and create subfolder input) */}
      {isExpanded && (
        <div className="mt-1 space-y-1">
          {/* Create Subfolder Input */}
          {showCreateSubfolder && (
            <div style={{ paddingLeft: `${24 + paddingLeft}px` }}>
              <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                <input
                  type="text"
                  value={subfolderName}
                  onChange={(e) => setSubfolderName(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Nombre de la subcarpeta"
                  className="flex-1 bg-transparent border-none outline-none text-sm placeholder-gray-500"
                  autoFocus
                />
                <button
                  onClick={handleCreateSubfolder}
                  disabled={!subfolderName.trim()}
                  className={`p-1 rounded ${
                    subfolderName.trim() 
                      ? 'text-green-600 hover:bg-green-100' 
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <CheckIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCancelCreateSubfolder}
                  className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Render children folders */}
          {hasChildren && (
            <>
              {folder.children.map((childFolder) => (
                <FolderCard 
                  key={childFolder.folder_id} 
                  folder={childFolder} 
                  level={level + 1}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default FolderCard;