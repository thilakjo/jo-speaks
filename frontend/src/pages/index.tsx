import React, { useState } from 'react';
import PdfUpload from '@/components/PdfUpload';
import QuestionAnswer from '@/components/QuestionAnswer';

const Index = () => {
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);

  const handleUploadSuccess = (documentId: string, filename: string) => {
    console.log('Upload successful:', { documentId, filename });
    setDocumentId(documentId);
    setFilename(filename);
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">PDF Pal</h1>
        <p className="text-lg text-gray-600">Upload your PDF documents and ask questions</p>
      </div>
      
      {!documentId ? (
        <PdfUpload onUploadSuccess={handleUploadSuccess} />
      ) : (
        <div className="w-full max-w-2xl mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Currently using document:</p>
              <p className="text-sm text-blue-700">{filename}</p>
            </div>
            <button 
              onClick={() => {
                setDocumentId(null);
                setFilename(null);
              }}
              className="text-sm text-blue-700 hover:text-blue-900 underline"
            >
              Upload a different document
            </button>
          </div>
          <QuestionAnswer documentId={documentId} />
        </div>
      )}
      
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>PDF Pal - Ask questions about your documents</p>
      </div>
    </div>
  );
};

export default Index;
