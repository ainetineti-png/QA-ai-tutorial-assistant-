import React, { useState } from 'react';
import { GoogleDriveIcon } from './icons/GoogleDriveIcon';
import { SourceIcon } from './icons/SourceIcon';

interface DriveInputProps {
  onIndexDrive: (url: string) => void;
}

const DriveInput: React.FC<DriveInputProps> = ({ onIndexDrive }) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidGoogleDriveFolderUrl(url)) {
      setError('');
      onIndexDrive(url);
    } else {
      setError('Please enter a valid Google Drive folder URL.');
    }
  };

  const isValidGoogleDriveFolderUrl = (url: string) => {
    return url.startsWith('https://drive.google.com/drive/folders/');
  };

  return (
    <div className="flex items-center justify-center h-full p-4 animate-fade-in">
      <div className="w-full max-w-lg p-8 bg-gray-850 border border-gray-700 rounded-2xl shadow-2xl text-center">
        <div className="flex justify-center items-center mb-6">
            <GoogleDriveIcon className="w-16 h-16 text-gray-400" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-100 mb-2">Create Your Knowledge Base</h1>
        <p className="text-gray-400 mb-8">
          Paste a link to a public Google Drive folder to get started.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative">
             <SourceIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/..."
              className="w-full bg-gray-800 border border-gray-600 rounded-xl py-3 pr-4 pl-12 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent transition-all"
              aria-label="Google Drive folder URL"
            />
          </div>
          {error && <p className="text-red-400 text-sm animate-fade-in">{error}</p>}
          <button
            type="submit"
            disabled={!url.trim()}
            className="w-full bg-accent-blue hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-blue-500/50 transform hover:-translate-y-0.5"
          >
            Create Knowledge Base
          </button>
        </form>
         <p className="text-xs text-gray-600 mt-6 max-w-md mx-auto">
            Note: This is a simulation. The app will not access your private files. For this demo, any validly formatted Google Drive folder URL will work.
        </p>
      </div>
    </div>
  );
};

export default DriveInput;
