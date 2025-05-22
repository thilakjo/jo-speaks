
import React from 'react';
import PdfUpload from '@/components/PdfUpload';

const Index = () => {
  const handleUploadSuccess = (documentId: string, filename: string) => {
    console.log('Upload successful:', { documentId, filename });
    // You can handle the successful upload here, e.g., update state, navigate to a new page, etc.
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">PDF Pal Upload</h1>
        <p className="text-lg text-gray-600">Upload your PDF documents for processing</p>
      </div>
      
      <PdfUpload onUploadSuccess={handleUploadSuccess} />
      
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Supported format: PDF</p>
      </div>
    </div>
  );
};

export default Index;