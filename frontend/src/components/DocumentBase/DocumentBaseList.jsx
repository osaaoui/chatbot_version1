// src/components/DocumentBase/DocumentBaseList.js
import React from 'react';
import { useDocumentBases } from '../../context/DocumentBasesContext';
import { useTranslation } from 'react-i18next';
import DocumentBaseCard from './DocumentBaseCard';

const DocumentBaseList = ({ 
  onProcessFiles,
  isProcessing = false,
  stagedFiles = [],
  setStagedFiles,
  userEmail 
}) => {
  const { documentBases, initialLoading, error } = useDocumentBases();
  const { t } = useTranslation();

  if (initialLoading) {
    return (
      <div className="w-full p-4 text-center text-sm text-gray-500">
        {t('document_base.loading')}
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-4 text-center text-sm text-red-500">
        {t('document_base.error')}: {error}
      </div>
    );
  }

  if (!documentBases || documentBases.length === 0) {
    return (
      <div className="w-full p-4 text-center text-sm text-gray-500">
        {t('document_base.no_bases_available')}
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      {documentBases.map((documentBase) => (
        <DocumentBaseCard 
          key={documentBase.document_base_id} 
          documentBase={documentBase}
          onProcessFiles={onProcessFiles}
          isProcessing={isProcessing}
          stagedFiles={stagedFiles}
          setStagedFiles={setStagedFiles}
          userEmail={userEmail}
        />
      ))}
    </div>
  );
};

export default DocumentBaseList;