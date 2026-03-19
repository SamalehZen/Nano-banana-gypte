
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ImageFile } from '../types';

interface ResultDisplayProps {
  imageFile: ImageFile | null;
  isLoading: boolean;
  onEdit?: (prompt: string) => void;
  isEditing?: boolean;
}

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);

const LoadingSpinner = ({ size = "h-16 w-16" }: { size?: string }) => (
    <div className="flex justify-center items-center h-full">
        <div className={`animate-spin rounded-full ${size} border-t-2 border-b-2 border-[var(--color-accent)]`}></div>
    </div>
);

const ResultDisplay: React.FC<ResultDisplayProps> = ({ 
    imageFile, 
    isLoading,
    onEdit,
    isEditing
}) => {
    const [isDownloading, setIsDownloading] = useState(false);
    const [isFullViewOpen, setIsFullViewOpen] = useState(false);
    const [localPrompt, setLocalPrompt] = useState('');

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsFullViewOpen(false);
            }
        };

        if (isFullViewOpen) {
            window.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'auto';
        };
    }, [isFullViewOpen]);


    const handleDownload = (resolution: '2k' | '4k') => {
        if (!imageFile) return;

        setIsDownloading(true);
        const img = new Image();
        img.src = `data:${imageFile.mimeType};base64,${imageFile.base64}`;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                setIsDownloading(false);
                return;
            };

            const targetWidth = resolution === '4k' ? 4096 : 2048;
            const aspectRatio = img.width / img.height;
            
            canvas.width = targetWidth;
            canvas.height = targetWidth / aspectRatio;

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const link = document.createElement('a');
            link.download = `Jenta-Result-${resolution}-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            setIsDownloading(false);
        }
        img.onerror = () => {
             setIsDownloading(false);
        }
    };

    const handleApplyEdit = () => {
        if (localPrompt.trim() && onEdit) {
            onEdit(localPrompt);
            setLocalPrompt('');
        }
    };

    return (
        <div className="w-full flex flex-col gap-4">
            {/* Main Result Area */}
            <div className="w-full aspect-square bg-black/10 backdrop-blur-sm rounded-3xl flex items-center justify-center overflow-hidden relative border border-white/5 shadow-inner group">
                {(isLoading || isEditing) && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
                        <LoadingSpinner />
                        <p className="mt-4 text-[10px] font-bold text-[var(--color-accent)] uppercase tracking-[0.2em] animate-pulse">
                            {isEditing ? 'Refining Design...' : 'Generating Design...'}
                        </p>
                    </div>
                )}
                
                {!isLoading && !isEditing && !imageFile && (
                    <div className="flex flex-col items-center gap-3 opacity-20">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span className="text-xs font-bold uppercase tracking-widest">Result will appear here</span>
                    </div>
                )}
                
                {!isLoading && !isEditing && imageFile && (
                     <div className="w-full h-full relative">
                        <img 
                            src={`data:${imageFile.mimeType};base64,${imageFile.base64}`} 
                            alt="Generated Design" 
                            className="object-contain w-full h-full cursor-pointer transition-transform duration-700 group-hover:scale-[1.02]"
                            onClick={() => setIsFullViewOpen(true)}
                        />
                        {/* Overlay Hint */}
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center justify-center">
                            <span className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white">Click to Enlarge</span>
                        </div>
                    </div>
                )}
            </div>

            {imageFile && !isLoading && !isEditing && (
                <div className="animate-in slide-in-from-bottom-2 duration-500 space-y-3">
                    {/* Edit Section - NOW ABOVE BUTTONS */}
                    <div className="relative">
                        <input 
                            type="text"
                            value={localPrompt}
                            onChange={(e) => setLocalPrompt(e.target.value)}
                            placeholder="Describe changes to refine result..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-xs text-white focus:outline-none focus:border-[var(--color-accent)]/50 transition-all placeholder:text-white/20"
                            onKeyDown={(e) => e.key === 'Enter' && handleApplyEdit()}
                        />
                        <button 
                            onClick={handleApplyEdit}
                            disabled={!localPrompt.trim()}
                            className="absolute right-2 top-2 bottom-2 px-6 bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] text-white text-[10px] font-black rounded-xl transition-all disabled:opacity-0 shadow-lg shadow-[var(--color-accent)]/20"
                        >
                            EDIT
                        </button>
                    </div>

                    <div className="flex gap-4">
                        <button 
                            onClick={() => handleDownload('2k')}
                            disabled={isDownloading}
                            className="flex-1 inline-flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/5 text-white font-bold py-4 px-4 rounded-2xl transition-all disabled:opacity-50 text-xs tracking-tighter"
                        >
                            <DownloadIcon />
                            DOWNLOAD 2K
                        </button>
                        <button 
                            onClick={() => handleDownload('4k')}
                            disabled={isDownloading}
                            className="flex-1 inline-flex items-center justify-center bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] text-white font-bold py-4 px-4 rounded-2xl transition-all disabled:opacity-50 text-xs tracking-tighter shadow-lg shadow-[var(--color-accent)]/20"
                        >
                            <DownloadIcon />
                            DOWNLOAD 4K
                        </button>
                    </div>
                </div>
            )}

            {/* Fullscreen Preview */}
            {isFullViewOpen && imageFile && createPortal(
                <div 
                    className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-[99999] p-4 animate-in fade-in duration-300 cursor-zoom-out"
                    onClick={() => setIsFullViewOpen(false)}
                >
                    <img
                        src={`data:${imageFile.mimeType};base64,${imageFile.base64}`}
                        alt="Full view result"
                        className="max-w-full max-h-full object-contain shadow-2xl rounded-2xl"
                    />
                    <button 
                        onClick={() => setIsFullViewOpen(false)} 
                        className="absolute top-6 right-6 text-white/50 hover:text-white transition-all p-3 bg-white/5 rounded-full hover:bg-white/10 backdrop-blur-md"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>,
                document.body
            )}
        </div>
    );
};

export default ResultDisplay;
