// src/components/DocumentBase/DocumentBaseManager.js
import React from 'react';
import { DocumentBasesProvider } from '../../context/DocumentBasesContext';
import { FoldersProvider } from '../../context/FoldersContext';
import CreateDocumentBase from './CreateDocumentBase';
import DocumentBaseList from './DocumentBaseList';

const DocumentBaseManager = () => {
  return (
    <DocumentBasesProvider>
      <FoldersProvider>
        <div className="w-full h-full flex flex-col">
          {/* Create new document base section */}
          <div className="mb-4">
            <CreateDocumentBase />
          </div>
          
          {/* List of document bases */}
          <div className="flex-1 overflow-y-auto">
            <DocumentBaseList />
          </div>
        </div>
      </FoldersProvider>
    </DocumentBasesProvider>
  );
};

export default DocumentBaseManager;