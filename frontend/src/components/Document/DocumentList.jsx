import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { 
  DocumentIcon,
  CalendarIcon,
  ScaleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { documentService } from '../../services/documentService';

const DocumentList = forwardRef(({ folderId, level = 0 }, ref) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const paddingLeft = (level * 16);

  // Exponer función de refresh al componente padre
  useImperativeHandle(ref, () => ({
    refreshDocuments: fetchDocuments
  }));

  useEffect(() => {
    if (folderId) {
      fetchDocuments();
    }
  }, [folderId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await documentService.getDocumentsByFolder(folderId);
      
      if (response.success && response.data.documents) {
        setDocuments(response.data.documents);
      } else {
        setDocuments([]);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Error al cargar los documentos');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (fileType) => {
    const lowerType = fileType.toLowerCase();
    if (lowerType.includes('pdf')) {
      return <DocumentIcon className="w-4 h-4 text-red-500" />;
    }
    if (lowerType.includes('doc') || lowerType.includes('docx')) {
      return <DocumentTextIcon className="w-4 h-4 text-blue-500" />;
    }
    if (lowerType.includes('txt')) {
      return <DocumentTextIcon className="w-4 h-4 text-gray-500" />;
    }
    if (lowerType.includes('jpg') || lowerType.includes('jpeg') || lowerType.includes('png')) {
      return <DocumentIcon className="w-4 h-4 text-green-500" />;
    }
    return <DocumentIcon className="w-4 h-4 text-gray-500" />;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'text-green-600 bg-green-50';
      case 'processing':
        return 'text-orange-600 bg-orange-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      case 'inactive':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="mt-1" style={{ paddingLeft: `${24 + paddingLeft}px` }}>
        <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-md">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-xs text-gray-600">Cargando documentos...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-1" style={{ paddingLeft: `${24 + paddingLeft}px` }}>
        <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-md">
          <span className="text-xs text-red-600">{error}</span>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="mt-1" style={{ paddingLeft: `${24 + paddingLeft}px` }}>
        <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-md">
          <DocumentIcon className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-500">No hay documentos en esta carpeta</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-1 space-y-1" style={{ paddingLeft: `${24 + paddingLeft}px` }}>
      {documents.map((document) => (
        <div 
          key={document.document_id} 
          className="flex items-start gap-2 p-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
        >
          <div className="flex-shrink-0 mt-0.5">
            {getFileIcon(document.file_type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {document.document_name}
                </h4>
              </div>
              <div className="flex gap-1 ml-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(document.status)}`}>
                  {document.status}
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                  {document.file_type}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

DocumentList.displayName = 'DocumentList';

export default DocumentList;