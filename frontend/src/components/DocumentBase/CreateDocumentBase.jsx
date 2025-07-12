// src/components/DocumentBase/CreateDocumentBase.js
import React, { useState } from 'react';
import { useDocumentBases } from '../../context/DocumentBasesContext';
import { PlusIcon } from '@heroicons/react/24/outline';

const COMPANY_ID = '';

const CreateDocumentBase = () => {
  const [baseName, setBaseName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { createDocumentBase, error } = useDocumentBases();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!baseName.trim()) {
      return;
    }

    setIsCreating(true);
    try {
      const data = {
        base_name: baseName.trim(),
        company_id: COMPANY_ID
      };
      
      const response = await createDocumentBase(data);
      
      if (response.success) {
        setBaseName('');
      }
    } catch (err) {
      console.error('Error creating document base:', err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="w-full mb-6">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={baseName}
          onChange={(e) => setBaseName(e.target.value)}
          placeholder="Nombre de la base de documentos"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isCreating}
        />
        <button
          type="submit"
          disabled={isCreating || !baseName.trim()}
          className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-1 transition ${
            isCreating || !baseName.trim()
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <PlusIcon className="w-4 h-4" />
          Crear
        </button>
      </form>
      
      {error && (
        <div className="mt-2 text-sm text-red-500">
          {error}
        </div>
      )}
    </div>
  );
};

export default CreateDocumentBase;