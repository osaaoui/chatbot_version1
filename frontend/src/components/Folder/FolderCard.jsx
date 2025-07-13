import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { 
  ChevronDownIcon, 
  ChevronRightIcon, 
  FolderIcon, 
  PlusIcon, 
  CheckIcon, 
  XMarkIcon,
  PencilIcon,
  TrashIcon,
  ArrowUpTrayIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { useFolders } from '../../context/FoldersContext';
import { useLanguage } from '../../hooks/useLanguaje';
import DocumentList from '../Document/DocumentList';

const FolderCard = ({ 
  folder, 
  level = 0, 
  allFolders = [], 
  userEmail,
  onProcessFiles,
  isProcessing = false,
  stagedFiles = [],
  setStagedFiles
}) => {
  // Estados del componente
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCreateSubfolder, setShowCreateSubfolder] = useState(false);
  const [subfolderName, setSubfolderName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(folder.folder_name);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [processedFiles, setProcessedFiles] = useState([]);
  
  const fileInputRef = useRef(null);
  const documentListRef = useRef(null);
  const { createFolder, updateFolder, deleteFolder } = useFolders();
  const { t } = useLanguage();
  
  const hasChildren = folder.children && folder.children.length > 0;
  const paddingLeft = level * 16;

  // Sincronizar estado local con stagedFiles cuando se procesan desde el sidebar
  useEffect(() => {
    if (stagedFiles && stagedFiles.length > 0) {
      const folderStagedFiles = stagedFiles.filter(f => f.folderId === folder.folder_id);
      
      setProcessedFiles(prev => {
        const updatedFiles = prev.map(localFile => {
          const stagedFile = folderStagedFiles.find(sf => 
            sf.documentId === localFile.documentId || 
            (sf.name === localFile.name && sf.folderId === localFile.folderId)
          );
          
          if (stagedFile) {
            if (stagedFile.status === "processed") {
              return { ...localFile, status: "processed" };
            }
            if (stagedFile.status === "processing") {
              return { ...localFile, status: "processing" };
            }
          }
          
          return localFile;
        });
        
        return updatedFiles;
      });
      
      setTimeout(() => {
        setProcessedFiles(prev => 
          prev.filter(f => f.status !== "processed")
        );
      }, 1000);
    }
  }, [stagedFiles, folder.folder_id]);

  // =================== FUNCIONES DE UTILIDAD ===================
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

  const getCurrentFolderFiles = () => {
    const currentFolderUploads = uploadingFiles.filter(f => f.folderId === folder.folder_id);
    const currentFolderProcessed = processedFiles.filter(f => f.folderId === folder.folder_id);
    
    const stagedFilesForFolder = stagedFiles.filter(f => 
      f.folderId === folder.folder_id && (f.status === "uploaded" || f.status === "ready_to_process")
    );
    
    const localFilesToProcess = currentFolderProcessed.filter(f => 
      f.status === "ready_to_process" && 
      !stagedFiles.some(sf => sf.documentId === f.documentId && sf.status === "processed")
    );
    
    const allFilesToProcess = [...localFilesToProcess, ...stagedFilesForFolder];
    const processingFiles = currentFolderProcessed.filter(f => f.status === "processing");
    
    return {
      currentFolderUploads,
      currentFolderProcessed,
      filesToProcess: allFilesToProcess,
      processingFiles,
      hasFilesToProcess: allFilesToProcess.length > 0,
      isProcessingFiles: processingFiles.length > 0 || isProcessing
    };
  };

  // =================== FUNCIONES DE MANEJO DE ARCHIVOS ===================
  const handleFileUpload = async (files) => {
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("document_base_id", folder.document_base_id);
        formData.append("folder_id", folder.folder_id);
        
        const response = await axios.post(
          "http://localhost:8001/api/v2/uploads/upload/",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        
        console.log(`Documento subido exitosamente: ${file.name}, ID: ${response.data.document_id}`);
        
        // Agregar archivo al stagedFiles para la lógica unificada
        const newStagedFile = {
          name: response.data.filename || file.name,
          original: file.name,
          documentId: response.data.document_id,
          status: "uploaded",
          folderId: folder.folder_id,
          document_id: folder.document_base_id, // ← AGREGAR ESTA LÍNEA
          documentBaseId: folder.document_base_id 
        };
        
        if (setStagedFiles) {
          setStagedFiles(prev => [...prev, newStagedFile]);
        } else {
          setProcessedFiles(prev => [...prev, {
            name: response.data.filename || file.name,
            original: file.name,
            documentId: response.data.document_id,
            status: "ready_to_process",
            folderId: folder.folder_id,
            document_id: folder.document_base_id, // ← AGREGAR ESTA LÍNEA
            documentBaseId: folder.document_base_id
          }]);
        }
        
        // Refrescar la lista de documentos con un pequeño delay
        setTimeout(() => {
          if (documentListRef.current) {
            console.log("Refreshing document list after upload");
            documentListRef.current.refreshDocuments();
          }
        }, 500);
        
      } catch (err) {
        console.error("Error uploading file:", file.name, err);
      }
    }
  };

  // Función de procesamiento unificada
  const processFiles = async () => {
    const { filesToProcess } = getCurrentFolderFiles();
    
    if (filesToProcess.length === 0) {
      console.log("No hay archivos para procesar en esta carpeta");
      return;
    }

    console.log("🟣 FolderCard processFiles called");
    console.log("🟣 Sending to process:", filesToProcess.map((f) => f.name));

    if (onProcessFiles && typeof onProcessFiles === 'function') {
      try {
        const filesToProcessForUnified = filesToProcess.map(f => ({
          name: f.name || f.original,
          original: f.original || f.name,
          status: "uploaded",
          documentId: f.documentId,
          folderId: f.folderId,
          document_id: folder.document_base_id, // ← AGREGAR ESTA LÍNEA
          documentBaseId: folder.document_base_id 
        }));
        
        if (setStagedFiles) {
          setStagedFiles(prev =>
            prev.map(f =>
              f.folderId === folder.folder_id && (f.status === "uploaded" || f.status === "ready_to_process")
                ? { ...f, status: "processing" }
                : f
            )
          );
        }
        
        await onProcessFiles(filesToProcessForUnified);
        
        setTimeout(() => {
          setProcessedFiles(prev =>
            prev.filter(f => 
              !(f.folderId === folder.folder_id && (f.status === "processed" || f.status === "processing"))
            )
          );
        }, 1000);
        
      } catch (err) {
        console.error("Error processing files with unified function:", err);
        
        if (setStagedFiles) {
          setStagedFiles(prev =>
            prev.map(f =>
              f.folderId === folder.folder_id && f.status === "processing"
                ? { ...f, status: "error" }
                : f
            )
          );
        }
        
        setProcessedFiles(prev =>
          prev.map(f =>
            f.folderId === folder.folder_id && f.status === "processing"
              ? { ...f, status: "process_error" }
              : f
          )
        );
      }
      return;
    }

    // Fallback a la lógica original
    setProcessedFiles(prev =>
      prev.map(f =>
        f.folderId === folder.folder_id && f.status === "ready_to_process"
          ? { ...f, status: "processing" }
          : f
      )
    );

    try {
      const response = await axios.post(
        "http://localhost:8001/api/v2/documents/process/",
        {
          user_id: userEmail || "default@email.com",
          filenames: filesToProcess.map((f) => f.name),
          document_id : folder.document_base_id,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const processed = response.data.processed_files || [];
      console.log("🟣 Backend response:", response.data);

      setProcessedFiles(prev =>
        prev.map(f => {
          if (f.folderId === folder.folder_id && processed.includes(f.name)) {
            return { ...f, status: "processed" };
          }
          return f;
        })
      );

      alert(
        `✅ ${response.data.overall_message || "Processing completed"}: ${
          response.data.total_chunks || "?"
        } chunks`
      );

      setTimeout(() => {
        setProcessedFiles(prev =>
          prev.filter(f => 
            !(f.folderId === folder.folder_id && f.status === "processed")
          )
        );
      }, 1000);

      console.log(`Archivos procesados exitosamente en carpeta: ${folder.folder_name}`);
        
    } catch (err) {
      console.error("Error processing files:", err);
      
      setProcessedFiles(prev =>
        prev.map(f =>
          f.folderId === folder.folder_id && f.status === "processing"
            ? { ...f, status: "process_error" }
            : f
        )
      );

      alert("❌ Failed to process file(s)");
    }
  };

  // =================== FUNCIONES DE MANEJO DE CARPETAS ===================
  const createSubfolder = async () => {
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

  const updateFolderName = async () => {
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

  const deleteFolderConfirm = async () => {
    try {
      const response = await deleteFolder(folder.folder_id, folder.document_base_id);
      
      if (response.success) {
        setShowDeleteConfirm(false);
      }
    } catch (err) {
      console.error('Error deleting folder:', err);
    }
  };

  // =================== FUNCIONES DE DRAG AND DROP ===================
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

  // =================== FUNCIONES DE UI/UX ===================
  const handleToggleExpand = () => {
    if (!isEditing && !showDeleteConfirm && !isDragging) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleUploadClick = (e) => {
    e.stopPropagation();
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleProcessFiles = (e) => {
    e.stopPropagation();
    processFiles();
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

  // =================== FUNCIONES DE CANCELACIÓN ===================
  const cancelCreateSubfolder = () => {
    setSubfolderName('');
    setShowCreateSubfolder(false);
  };

  const cancelEdit = () => {
    setEditName(folder.folder_name);
    setIsEditing(false);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  // =================== FUNCIONES DE TECLADO ===================
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      createSubfolder();
    } else if (e.key === 'Escape') {
      cancelCreateSubfolder();
    }
  };

  const handleEditKeyPress = (e) => {
    if (e.key === 'Enter') {
      updateFolderName();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const {
    currentFolderUploads,
    currentFolderProcessed,
    filesToProcess,
    processingFiles,
    hasFilesToProcess,
    isProcessingFiles
  } = getCurrentFolderFiles();

  // =================== RENDER ===================
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
              {t('folder.deleteConfirm', { folderName: folder.folder_name })}
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
                  {t('folder.created')}: {formatDate(folder.creation_date)}
                </span>
              )}
              {(hasFilesToProcess || isProcessingFiles) && (
                <div className="text-xs text-gray-500 mt-1">
                  {hasFilesToProcess && (
                    <span className="text-blue-600">
                      {filesToProcess.length} listos para procesar
                    </span>
                  )}
                  {isProcessingFiles && (
                    <span className="text-orange-600 ml-2">
                      {processingFiles.length > 0 ? processingFiles.length : ''} procesando...
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-1">
          {isEditing ? (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); updateFolderName(); }}
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
                onClick={(e) => { e.stopPropagation(); cancelEdit(); }}
                className={`text-gray-500 hover:bg-gray-100 rounded ${level === 0 ? 'p-1' : 'p-0.5'}`}
              >
                <XMarkIcon className={level === 0 ? 'w-3 h-3' : 'w-2.5 h-2.5'} />
              </button>
            </>
          ) : showDeleteConfirm ? (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); deleteFolderConfirm(); }}
                className={`text-red-600 hover:bg-red-100 rounded ${level === 0 ? 'p-1' : 'p-0.5'}`}
              >
                <CheckIcon className={level === 0 ? 'w-3 h-3' : 'w-2.5 h-2.5'} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); cancelDelete(); }}
                className={`text-gray-500 hover:bg-gray-100 rounded ${level === 0 ? 'p-1' : 'p-0.5'}`}
              >
                <XMarkIcon className={level === 0 ? 'w-3 h-3' : 'w-2.5 h-2.5'} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleUploadClick}
                className={`text-gray-400 hover:text-green-600 hover:bg-green-50 rounded opacity-0 group-hover:opacity-100 transition ${
                  level === 0 ? 'p-1' : 'p-0.5'
                }`}
                title="Subir documento"
              >
                <ArrowUpTrayIcon className={level === 0 ? 'w-3 h-3' : 'w-2.5 h-2.5'} />
              </button>

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

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.txt,.docx,.jpg,.jpeg,.png"
        className="hidden"
        multiple
      />

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
                  onClick={createSubfolder}
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
                  onClick={cancelCreateSubfolder}
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
                  userEmail={userEmail}
                  onProcessFiles={onProcessFiles}
                  isProcessing={isProcessing}
                  stagedFiles={stagedFiles}
                  setStagedFiles={setStagedFiles}
                />
              ))}
            </>
          )}

          <DocumentList 
            ref={documentListRef}
            folderId={folder.folder_id} 
            level={level}
          />
        </div>
      )}
    </div>
  );
};

export default FolderCard;