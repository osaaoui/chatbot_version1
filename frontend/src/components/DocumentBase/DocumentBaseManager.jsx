import React from "react"
import CreateDocumentBase from "./CreateDocumentBase"
import DocumentBaseList from "./DocumentBaseList"

const DocumentBaseManager = ({ 
  onProcessFiles,
  isProcessing = false,
  stagedFiles = [],
  setStagedFiles,
  userEmail 
}) => {
  return (
    <div 
      className="w-full h-full flex flex-col overflow-x-hidden"
      style={{ backgroundColor: "var(--bg-secondary)" }}
    >
      <div className="mb-4">
        <CreateDocumentBase />
      </div>
      <div 
        className="flex-1 overflow-y-auto chat-scroll-area"
        style={{
          scrollbarWidth: "none",    
          msOverflowStyle: "none"   
        }}
      >
        <DocumentBaseList 
          onProcessFiles={onProcessFiles}
          isProcessing={isProcessing}
          stagedFiles={stagedFiles}
          setStagedFiles={setStagedFiles}
          userEmail={userEmail}
        />
      </div>
    </div>
  )
}

export default DocumentBaseManager