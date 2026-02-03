import React, { useState } from 'react';
import { useEditorStore } from '../store/useEditorStore';
import { Moon, Sun, Maximize2, Minimize2, Download, FilePlus, ChevronDown } from 'lucide-react';
import { exportToHtml, exportToDocx, exportToPdf } from '../utils/exportUtils';
import { ConfirmModal } from './ConfirmModal';

export const Toolbar: React.FC = () => {
    const { 
        theme, toggleTheme, isZenMode, toggleZenMode, markdown, setMarkdown 
    } = useEditorStore();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const handleNewFileClick = () => {
        if (markdown.trim().length > 0 && markdown !== '# Welcome to Zenith Editor\n\nStart typing...') {
            setIsConfirmOpen(true);
        } else {
            setMarkdown('');
        }
    };

    const confirmNewFile = () => {
        setMarkdown('');
        setIsConfirmOpen(false);
    };

    const handleExport = (type: 'html' | 'docx' | 'pdf') => {
        setIsMenuOpen(false);
        if (type === 'html') exportToHtml(markdown);
        if (type === 'docx') exportToDocx(markdown);
        if (type === 'pdf') exportToPdf();
    };

    return (
        <header className="flex items-center justify-between px-4 py-3 border-b border-border/40 z-50 sticky top-0 bg-background/60 backdrop-blur-xl transition-all duration-500">
            <ConfirmModal 
                isOpen={isConfirmOpen}
                title="Create New File?"
                message="Unsaved changes will be lost. Are you sure you want to start a new file?"
                onConfirm={confirmNewFile}
                onCancel={() => setIsConfirmOpen(false)}
            />

            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-500 dark:text-indigo-400">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><path d="M11 11l-4.393 -4.393"></path></svg>
                </div>
                <h1 className="text-lg font-bold tracking-tight bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent">Zenith</h1>
            </div>
            
            <div className="flex items-center gap-2">
                {/* New File */}
                <button
                    onClick={handleNewFileClick}
                    className="p-2 rounded-lg hover:bg-muted/80 transition-all duration-200 text-muted-foreground hover:text-foreground active:scale-95"
                    title="New File"
                >
                    <FilePlus size={18} />
                </button>

                {/* Export Menu */}
                <div className="relative">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-muted/80 transition-all duration-200 text-muted-foreground hover:text-foreground text-sm font-medium active:scale-95"
                        title="Export"
                    >
                        <Download size={16} />
                        <span className="hidden sm:inline">Export</span>
                        <ChevronDown size={14} className={isMenuOpen ? "rotate-180 transition-transform" : "transition-transform"} />
                    </button>
                    
                    {isMenuOpen && (
                        <>
                            <div 
                                className="fixed inset-0 z-40" 
                                onClick={() => setIsMenuOpen(false)}
                            ></div>
                            <div className="absolute right-0 mt-2 w-40 bg-popover/90 backdrop-blur-xl border border-border/50 rounded-xl shadow-xl z-50 py-1 animate-in fade-in zoom-in-95 duration-200">
                                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Download As</div>
                                <button onClick={() => handleExport('pdf')} className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors">PDF Document</button>
                                <button onClick={() => handleExport('docx')} className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors">Word (.docx)</button>
                                <button onClick={() => handleExport('html')} className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors">HTML File</button>
                            </div>
                        </>
                    )}
                </div>

                <div className="w-px h-6 bg-border mx-2"></div>

                {/* Toggles */}
                <button
                    onClick={toggleZenMode}
                    className="p-2 rounded-lg hover:bg-muted/80 transition-all duration-200 text-muted-foreground hover:text-foreground active:scale-95"
                    title={isZenMode ? "Exit Zen Mode" : "Enter Zen Mode"}
                >
                    {isZenMode ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg hover:bg-muted/80 transition-all duration-200 text-muted-foreground hover:text-foreground active:scale-95"
                    title="Toggle Theme"
                >
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>
            </div>
        </header>
    );
};
