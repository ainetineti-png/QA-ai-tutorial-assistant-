
import React from 'react';
import { CloseIcon } from './icons/CloseIcon';
import { ImageIcon } from './icons/ImageIcon';

interface VisualExplainerProps {
  keyword: string;
  imageUrl: string | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
}

const VisualExplainer: React.FC<VisualExplainerProps> = ({ keyword, imageUrl, isLoading, error, onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 w-full max-w-2xl aspect-square flex flex-col m-4 animate-slide-in-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-gray-200">
            Visualizing: <span className="text-accent-blue">{keyword}</span>
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
            aria-label="Close visual explainer"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>
        <main className="flex-grow flex items-center justify-center p-4 relative">
          {isLoading && (
            <div className="text-center text-gray-400">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-r-2 border-accent-blue mx-auto mb-4"></div>
              <p>Generating your visual explanation...</p>
            </div>
          )}
          {error && !isLoading && (
             <div className="text-center text-red-400 p-4 bg-red-900/20 rounded-lg">
                <p className='font-semibold'>Generation Failed</p>
                <p className="text-sm">{error}</p>
            </div>
          )}
          {!isLoading && imageUrl && (
            <img 
              src={imageUrl} 
              alt={`Visual explanation for ${keyword}`} 
              className="max-w-full max-h-full object-contain rounded-lg animate-fade-in"
            />
          )}
           {!isLoading && !imageUrl && !error && (
             <div className="text-center text-gray-500">
                <ImageIcon className="w-24 h-24 mx-auto mb-4" />
                <p>No visual available.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default VisualExplainer;
