import React, { useState } from 'react';
import { useEditorStore } from '../store/useEditorStore';
import { Moon, Sun, Maximize2, Minimize2, Download, FilePlus, ChevronDown } from 'lucide-react';
import { exportToHtml, exportToDocx, exportToPdf } from '../utils/exportUtils';

export const Toolbar: React.FC = () => {
    const { 
        theme, toggleTheme, isZenMode, toggleZenMode, markdown, setMarkdown 
    } = useEditorStore();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleNewFile = () => {
        if (markdown.trim().length > 0 && markdown !== '# Welcome to Zenith Editor\n\nStart typing...') {
            if (confirm('Create new file? Unsaved changes will be overwritten (unless just exported).')) {
                setMarkdown('');
            }
        } else {
            setMarkdown('');
        }
    };

    const handleExport = (type: 'html' | 'docx' | 'pdf') => {
        setIsMenuOpen(false);
        if (type === 'html') exportToHtml(markdown);
        if (type === 'docx') exportToDocx(markdown);
        if (type === 'pdf') exportToPdf();
    };

    return (
        <header className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-zinc-800 z-50 sticky top-0 bg-opacity-90 backdrop-blur-sm bg-white/50 dark:bg-zinc-950/50">
            <h1 className="text-xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400">Zenith</h1>
            
            <div className="flex items-center gap-2">
                {/* New File */}
                <button
                    onClick={handleNewFile}
                    className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors text-slate-600 dark:text-zinc-400"
                    title="New File"
                >
                    <FilePlus size={18} />
                </button>

                {/* Export Menu */}
                <div className="relative">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex items-center gap-1 px-3 py-2 rounded-md hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors text-slate-600 dark:text-zinc-400 text-sm font-medium"
                        title="Export"
                    >
                        <Download size={18} />
                        <span className="hidden sm:inline">Export</span>
                        <ChevronDown size={14} />
                    </button>
                    
                    {isMenuOpen && (
                        <>
                            <div 
                                className="fixed inset-0 z-40" 
                                onClick={() => setIsMenuOpen(false)}
                            ></div>
                            <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md shadow-lg z-50 py-1">
                                <button onClick={() => handleExport('pdf')} className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800">PDF</button>
                                <button onClick={() => handleExport('docx')} className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800">DOCX</button>
                                <button onClick={() => handleExport('html')} className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800">HTML</button>
                            </div>
                        </>
                    )}
                </div>

                <div className="w-px h-6 bg-slate-200 dark:bg-zinc-800 mx-1"></div>

                {/* Toggles */}
                <button
                    onClick={toggleZenMode}
                    className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors text-slate-600 dark:text-zinc-400"
                    title={isZenMode ? "Exit Zen Mode" : "Enter Zen Mode"}
                >
                    {isZenMode ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors text-slate-600 dark:text-zinc-400"
                    title="Toggle Theme"
                >
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>
            </div>
        </header>
    );
};
