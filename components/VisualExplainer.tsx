import React, { useState } from 'react';
import { CloseIcon } from './icons/CloseIcon';
import { ImageIcon } from './icons/ImageIcon';
import { MagicWandIcon } from './icons/MagicWandIcon';

interface VisualExplainerProps {
  keyword: string;
  imageUrl: string | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onEdit: (base64Image: string, prompt: string) => Promise<void>;
}

const VisualExplainer: React.FC<VisualExplainerProps> = ({ keyword, imageUrl, isLoading, error, onClose, onEdit }) => {
  const [editPrompt, setEditPrompt] = useState('');

  const handleEdit = () => {
    if (editPrompt.trim() && imageUrl && !isLoading) {
      onEdit(imageUrl, editPrompt.trim());
      setEditPrompt('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEdit();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 w-full max-w-2xl flex flex-col m-4 max-h-[90vh] animate-slide-in-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
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
        <main className="flex-grow flex flex-col p-4 relative overflow-y-auto">
          <div className="flex-grow flex items-center justify-center relative min-h-[250px]">
            {isLoading && (
              <div className="text-center text-gray-400">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-r-2 border-accent-blue mx-auto mb-4"></div>
                <p>Generating your visual explanation...</p>
              </div>
            )}
            {error && !isLoading && (
               <div className="text-center text-red-400 p-4 bg-red-900/20 rounded-lg">
                  <p className='font-semibold'>Operation Failed</p>
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
          </div>
          
          {!isLoading && imageUrl && (
             <div className="flex-shrink-0 pt-4 mt-4 border-t border-gray-700 animate-fade-in">
                <div className="relative">
                    <textarea
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={`Describe an edit... (e.g., "add a cat wearing a hat")`}
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 pr-12 text-gray-200 placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-accent-blue transition-colors"
                        rows={2}
                        disabled={isLoading}
                        aria-label="Image edit prompt"
                    />
                    <button
                        onClick={handleEdit}
                        disabled={isLoading || !editPrompt.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-lg text-white bg-accent-blue hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-200 group"
                        aria-label="Generate edit"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <MagicWandIcon className="w-5 h-5" />
                        )}
                    </button>
                </div>
             </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default VisualExplainer;
