
import React, { useState } from 'react';
import { GoogleDriveIcon } from './icons/GoogleDriveIcon';

interface DriveInputProps {
  onConnect: () => void;
  isLoading: boolean;
}

const DriveInput: React.FC<DriveInputProps> = ({ onConnect, isLoading }) => {
  const [driveLink, setDriveLink] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (driveLink && !isLoading) {
      onConnect();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in">
      <GoogleDriveIcon className="w-24 h-24 mb-6 text-gray-500" />
      <h2 className="text-3xl font-bold mb-2 text-gray-100">Connect Your Knowledge Base</h2>
      <p className="text-gray-400 mb-8 max-w-md">
        Paste a link to your Google Drive folder to create a searchable knowledge base. The application will use this context to provide intelligent answers.
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-lg">
        <div className="flex items-center bg-gray-900 border border-gray-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-accent-blue transition-all duration-300">
          <input
            type="text"
            value={driveLink}
            onChange={(e) => setDriveLink(e.target.value)}
            placeholder="https://drive.google.com/drive/folders/..."
            className="w-full p-4 bg-transparent text-gray-200 placeholder-gray-500 focus:outline-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!driveLink || isLoading}
            className="px-6 py-4 bg-accent-blue text-white font-semibold hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-300"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              'Connect'
            )}
          </button>
        </div>
      </form>
       <p className="text-xs text-gray-600 mt-4">
        Note: This is a demonstration. No files are actually processed from Google Drive. The app uses Google Search grounding for retrieval.
      </p>
    </div>
  );
};

export default DriveInput;
