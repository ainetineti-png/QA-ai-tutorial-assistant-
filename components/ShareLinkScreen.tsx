import React, { useState } from 'react';
import { CheckIcon } from './icons/CheckIcon';
import { ShareIcon } from './icons/ShareIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';

interface ShareLinkScreenProps {
  folderUrl: string;
  onStartChat: () => void;
}

const ShareLinkScreen: React.FC<ShareLinkScreenProps> = ({ folderUrl, onStartChat }) => {
  const [isCopied, setIsCopied] = useState(false);
  
  const shareableLink = `${window.location.origin}${window.location.pathname}?kb=${btoa(folderUrl)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareableLink).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    });
  };

  return (
    <div className="flex items-center justify-center h-full p-4 animate-fade-in">
      <div className="w-full max-w-2xl p-8 bg-gray-850 border border-gray-700 rounded-2xl shadow-2xl text-center">
        <div className="flex justify-center items-center mb-6">
            <div className="w-16 h-16 bg-accent-green/20 text-accent-green rounded-full flex items-center justify-center">
                <CheckIcon className="w-8 h-8" />
            </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-100 mb-2">Knowledge Base Created!</h1>
        <p className="text-gray-400 mb-8">
          You can now chat with your documents or share access with others.
        </p>

        <div className="text-left mb-8">
            <label htmlFor="share-link" className="block text-sm font-medium text-gray-300 mb-2">
                <ShareIcon className="w-4 h-4 inline-block mr-2" />
                Shareable Link
            </label>
            <div className="relative">
                <input
                    id="share-link"
                    type="text"
                    value={shareableLink}
                    readOnly
                    className="w-full bg-gray-800 border border-gray-600 rounded-xl py-3 pr-28 pl-4 text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-blue"
                />
                <button 
                    onClick={handleCopy}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 w-24"
                >
                    {isCopied ? (
                        <>
                            <CheckIcon className="w-5 h-5"/> 
                            <span>Copied</span>
                        </>
                    ) : (
                         <>
                            <ClipboardIcon className="w-5 h-5"/>
                            <span>Copy</span>
                        </>
                    )}
                </button>
            </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
                onClick={onStartChat}
                className="w-full sm:w-auto bg-accent-blue hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-blue-500/50 transform hover:-translate-y-0.5"
            >
                Start Chatting
            </button>
        </div>
         <p className="text-xs text-gray-600 mt-8 max-w-md mx-auto">
            Anyone with the link can ask questions against this knowledge base without needing access to the original folder or re-indexing files.
        </p>
      </div>
    </div>
  );
};

export default ShareLinkScreen;
