import React, { useState } from 'react';
import { 
  ChevronDownIcon, 
  ChevronRightIcon, 
  FolderIcon, 
  PlusIcon, 
  CheckIcon, 
  XMarkIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { useFolders } from '../../context/FoldersContext';

const FolderCard = ({ folder, level = 0, allFolders = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCreateSubfolder, setShowCreateSubfolder] = useState(false);
  const [subfolderName, setSubfolderName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(folder.folder_name);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const { createFolder, updateFolder, deleteFolder } = useFolders();
  
  const hasChildren = folder.children && folder.children.length > 0;
  const paddingLeft = level * 16;

  // Check if folder is descendant to prevent circular moves
  const isDescendantOf = (childId, parentId) => {
    if (childId === parentId) return true;
    
    const findDescendants = (folderId) => {
      const children = allFolders.filter(f => f.parent_folder_id === folderId);
      return children.flatMap(child => [child.folder_id, ...findDescendants(child.folder_id)]);
    };
    
    const descendants = findDescendants(parentId);
    return descendants.includes(childId);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleToggleExpand = () => {
    if (!isEditing && !showDeleteConfirm && !isDragging) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleCreateSubfolderClick = (e) => {
    e.stopPropagation();
    setShowCreateSubfolder(true);
    if (!isExpanded) {
      setIsExpanded(true);
    }
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditName(folder.folder_name);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
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

  const handleUpdateFolder = async () => {
    if (!editName.trim() || editName.trim() === folder.folder_name) {
      setIsEditing(false);
      return;
    }

    try {
      const response = await updateFolder(
        folder.folder_id, 
        folder.document_base_id,
        editName.trim(), 
        undefined
      );
      
      if (response.success) {
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Error updating folder:', err);
    }
  };

  const handleDeleteFolder = async () => {
    try {
      const response = await deleteFolder(folder.folder_id, folder.document_base_id);
      
      if (response.success) {
        setShowDeleteConfirm(false);
      }
    } catch (err) {
      console.error('Error deleting folder:', err);
    }
  };

  const handleDragStart = (e) => {
    e.stopPropagation();
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', JSON.stringify({
      folderId: folder.folder_id,
      folderName: folder.folder_name,
      documentBaseId: folder.document_base_id
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = (e) => {
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const dragData = JSON.parse(e.dataTransfer.getData('text/plain') || '{}');
      const draggedFolderId = dragData.folderId;
      
      // Prevent dropping on itself or descendants
      if (draggedFolderId && !isDescendantOf(folder.folder_id, draggedFolderId)) {
        setIsDragOver(true);
      }
    } catch (err) {
      console.error('Error parsing drag data:', err);
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    try {
      const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
      const { folderId: draggedFolderId, documentBaseId } = dragData;

      if (isDescendantOf(folder.folder_id, draggedFolderId)) {
        return;
      }

      const response = await updateFolder(
        draggedFolderId,
        documentBaseId,
        undefined,
        folder.folder_id
      );

      if (response.success && !isExpanded) {
        setIsExpanded(true);
      }
    } catch (err) {
      console.error('Error moving folder:', err);
    }
  };

  const handleCancelCreateSubfolder = () => {
    setSubfolderName('');
    setShowCreateSubfolder(false);
  };

  const handleCancelEdit = () => {
    setEditName(folder.folder_name);
    setIsEditing(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleCreateSubfolder();
    } else if (e.key === 'Escape') {
      handleCancelCreateSubfolder();
    }
  };

  const handleEditKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleUpdateFolder();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <div className="w-full">
      <div 
        draggable={!isEditing && !showDeleteConfirm}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex items-center gap-2 bg-white border border-gray-200 rounded-md transition group ${
          level === 0 ? 'p-2' : 'p-1.5'
        } ${
          isDragging
            ? 'opacity-50 cursor-grabbing'
            : isDragOver
              ? 'bg-blue-100 border-blue-300 border-2'
              : showDeleteConfirm 
                ? 'bg-red-50 border-red-200' 
                : isEditing 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'hover:bg-gray-50 cursor-pointer'
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
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={handleEditKeyPress}
              className={`bg-transparent border-none outline-none font-medium text-gray-700 w-full ${
                level === 0 ? 'text-sm' : 'text-xs'
              }`}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : showDeleteConfirm ? (
            <span className={`font-medium text-red-700 ${level === 0 ? 'text-sm' : 'text-xs'}`}>
              ¿Eliminar "{folder.folder_name}"?
            </span>
          ) : (
            <>
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
            </>
          )}
        </div>

        <div className="flex items-center gap-1">
          {isEditing ? (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handleUpdateFolder(); }}
                disabled={!editName.trim()}
                className={`rounded ${
                  editName.trim() 
                    ? 'text-green-600 hover:bg-green-100' 
                    : 'text-gray-400 cursor-not-allowed'
                } ${level === 0 ? 'p-1' : 'p-0.5'}`}
              >
                <CheckIcon className={level === 0 ? 'w-3 h-3' : 'w-2.5 h-2.5'} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleCancelEdit(); }}
                className={`text-gray-500 hover:bg-gray-100 rounded ${level === 0 ? 'p-1' : 'p-0.5'}`}
              >
                <XMarkIcon className={level === 0 ? 'w-3 h-3' : 'w-2.5 h-2.5'} />
              </button>
            </>
          ) : showDeleteConfirm ? (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteFolder(); }}
                className={`text-red-600 hover:bg-red-100 rounded ${level === 0 ? 'p-1' : 'p-0.5'}`}
              >
                <CheckIcon className={level === 0 ? 'w-3 h-3' : 'w-2.5 h-2.5'} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleCancelDelete(); }}
                className={`text-gray-500 hover:bg-gray-100 rounded ${level === 0 ? 'p-1' : 'p-0.5'}`}
              >
                <XMarkIcon className={level === 0 ? 'w-3 h-3' : 'w-2.5 h-2.5'} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleCreateSubfolderClick}
                className={`text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded opacity-0 group-hover:opacity-100 transition ${
                  level === 0 ? 'p-1' : 'p-0.5'
                }`}
                title="Crear subcarpeta"
              >
                <PlusIcon className={level === 0 ? 'w-3 h-3' : 'w-2.5 h-2.5'} />
              </button>

              <button
                onClick={handleEditClick}
                className={`text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded opacity-0 group-hover:opacity-100 transition ${
                  level === 0 ? 'p-1' : 'p-0.5'
                }`}
                title="Editar carpeta"
              >
                <PencilIcon className={level === 0 ? 'w-3 h-3' : 'w-2.5 h-2.5'} />
              </button>

              <button
                onClick={handleDeleteClick}
                className={`text-gray-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition ${
                  level === 0 ? 'p-1' : 'p-0.5'
                }`}
                title="Eliminar carpeta"
              >
                <TrashIcon className={level === 0 ? 'w-3 h-3' : 'w-2.5 h-2.5'} />
              </button>
            </>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="mt-1 space-y-1">
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

          {hasChildren && (
            <>
              {folder.children.map((childFolder) => (
                <FolderCard 
                  key={childFolder.folder_id} 
                  folder={childFolder} 
                  level={level + 1}
                  allFolders={allFolders}
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