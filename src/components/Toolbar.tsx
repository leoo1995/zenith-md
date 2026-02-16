import React, { useState, useRef } from 'react';
import { useEditorStore } from '../store/useEditorStore';
import { 
    Moon, Sun, Maximize2, Minimize2, Download, FilePlus, ChevronDown, 
    FolderOpen, Save, Undo, Redo, Bold, Italic, Code, Quote, List, CheckSquare, 
    Heading1, Heading2, Heading3, Eraser, Loader2
} from 'lucide-react';
import { exportToHtml, exportToDocx, exportToPdf } from '../utils/exportUtils';
import { ConfirmModal } from './ConfirmModal';
import { saveAs } from 'file-saver';


import GoogleAuthButton from './GoogleAuthButton';
import { useGoogleStore } from '../store/useGoogleStore';
import { saveFileToDrive, loadFileFromDrive, loadPicker, openDrivePicker } from '../services/googleDriveService';
import { Cloud, DownloadCloud } from 'lucide-react';

import { InputModal } from './InputModal';

interface ToolbarProps {
    editorRef: React.RefObject<any>;
}

export const Toolbar: React.FC<ToolbarProps> = ({ editorRef }) => {
    const {
        theme, toggleTheme, isZenMode, toggleZenMode, markdown, setMarkdown,
        history, historyIndex, undo, redo, addToHistory,
        driveFileId, setDriveFileId
    } = useEditorStore();
    // ... (previous imports)


    // ... (inside Toolbar component)
    const { isAuthenticated, accessToken, logout } = useGoogleStore(); // Access Google Store and logout

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isInputOpen, setIsInputOpen] = useState(false); // State for InputModal
    const [isExporting, setIsExporting] = useState(false);
    const [isDriveLoading, setIsDriveLoading] = useState(false);
    const [pendingSaveName, setPendingSaveName] = useState<string>('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Helper: Infer Filename ---
    const inferFilename = (): string => {
        const match = markdown.match(/^#\s+(.+)$/m);
        if (match && match[1]) {
            return match[1].trim() + '.md';
        }
        const timestamp = new Date().toISOString().slice(0, 10);
        return `Untitled-${timestamp}.md`;
    };

    // --- File Operations ---
    const handleNewFileClick = () => {
        if (markdown.trim().length > 0 && markdown !== '# Welcome to Zenith Editor\n\nStart typing...') {
            setIsConfirmOpen(true);
        } else {
            setMarkdown('');
            setDriveFileId(null); // Reset Drive ID for new file
        }
    };

    const confirmNewFile = () => {
        setMarkdown('');
        setDriveFileId(null);
        setIsConfirmOpen(false);
    };

    const handleOpenFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                setMarkdown(content);
                addToHistory(content);
                setDriveFileId(null); // Reset Drive ID for local file open
            };
            reader.readAsText(file);
        }
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // --- Unified Save ---
    const handleSaveClick = () => {
        if (!accessToken) {
            // Not authenticated -> Local Save
            handleLocalSave();
        } else {
            // Authenticated -> Drive Save
            if (driveFileId) {
                // If we already have an ID, update directly
                handleDriveSave(inferFilename(), driveFileId);
            } else {
                // New file on Drive -> Ask for name
                setPendingSaveName(inferFilename());
                setIsInputOpen(true);
            }
        }
    };

    const handleLocalSave = () => {
         const filename = inferFilename();
         try {
            const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
            saveAs(blob, filename);
         } catch (error) {
            console.error('Error al generar la descarga:', error);
         }
    };

    // Called by InputModal confirm
    const handleConfirmDriveSave = async (filename: string) => {
        setIsInputOpen(false);
        handleDriveSave(filename);
    };

    const handleDriveSave = async (filename: string, existingId?: string) => {
        if (!accessToken) return;

        setIsDriveLoading(true);
        try {
            const response = await saveFileToDrive(filename, markdown, accessToken, existingId);
            if (response && response.id) {
                setDriveFileId(response.id);
                // Only show alert if it was a manual new save, updates can be silent or toast (using alert for now)
                if (!existingId) alert("Saved to Google Drive!");
            }
        } catch (error: any) {
             console.error("Save to Drive failed", error);
             // Check for 401 (Unauthorized) or 403 (Insufficient Permissions)
             if (error.message.includes('401') || error.message.includes('Unauthorized') ||
                 error.message.includes('403') || error.message.includes('Insufficient Permission')) {
                 alert("Session expired or insufficient permissions. Please sign in again.");
                 logout();
             } else {
                 alert("Failed to save to Drive. See console.");
             }
        } finally {
            setIsDriveLoading(false);
        }
    };

    // --- Drive Open ---
    const handleOpenFromDrive = async () => {
        if (!accessToken) return;
        setIsDriveLoading(true);
        try {
            // Ensure Picker is loaded
            if (!window.google || !window.google.picker) {
                await loadPicker();
            }

            const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
            if (!apiKey) {
                alert("Please set VITE_GOOGLE_API_KEY to use the File Picker.");
                setIsDriveLoading(false);
                return;
            }

            const file = await openDrivePicker(accessToken, apiKey);
            if (file) {
                 const content = await loadFileFromDrive(file.id, accessToken);
                 setMarkdown(content);
                 addToHistory(content);
                 setDriveFileId(file.id); // Track the Drive ID
            }
        } catch (error: any) {
            console.error("Open from Drive failed", error);
             // Check for 401 (Unauthorized) or 403 (Insufficient Permissions)
             if (error.message.includes('401') || error.message.includes('Unauthorized') ||
                 error.message.includes('403') || error.message.includes('Insufficient Permission')) {
                 alert("Session expired or insufficient permissions. Please sign in again.");
                 logout();
             } else {
                alert("Failed to open from Drive. See console.");
             }
        } finally {
             setIsDriveLoading(false);
        }
    };

    const handleExport = async (type: 'html' | 'docx' | 'pdf') => {
        setIsMenuOpen(false);
        setIsExporting(true);
        try {
            if (type === 'html') exportToHtml(markdown);
            if (type === 'docx') await exportToDocx(markdown);
            if (type === 'pdf') await exportToPdf();
        } catch (error) {
            console.error("Export failed", error);
        } finally {
            setIsExporting(false);
        }
    };

    // --- Formatting ---
    const insertFormat = (prefix: string, suffix: string = '') => {
        const view = editorRef.current;
        if (!view || !view.dispatch) return;

        const { state, dispatch } = view;
        const { from, to } = state.selection.main;
        const selectedText = state.sliceDoc(from, to);

        const textToInsert = prefix + selectedText + suffix;

        dispatch({
            changes: { from, to, insert: textToInsert },
            selection: { anchor: from + prefix.length, head: from + prefix.length + selectedText.length },
            userEvent: 'input.format'
        });

        view.focus();
    };

    const insertBlockFormat = (prefix: string) => {
        const view = editorRef.current;
        if (!view || !view.dispatch) return;

        const { state, dispatch } = view;
        const { from } = state.selection.main;
        const line = state.doc.lineAt(from);
        const lineText = line.text;

        let changes;

        if (lineText.startsWith(prefix)) {
             // Toggle off
             changes = { from: line.from, to: line.from + prefix.length, insert: '' };
        } else if (['# ', '## ', '### '].includes(prefix)) {
             // Replace existing header
             const match = lineText.match(/^#{1,6}\s/);
             if (match) {
                 changes = { from: line.from, to: line.from + match[0].length, insert: prefix };
             } else {
                 changes = { from: line.from, insert: prefix };
             }
        } else {
             // Add prefix
             changes = { from: line.from, insert: prefix };
        }

        dispatch({ changes, userEvent: 'input.format' });
        view.focus();
    };

    const formatDocument = () => {
         const view = editorRef.current;
         if (!view || !view.dispatch) return;

         const doc = view.state.doc.toString();
         let newText = doc.replace(/[ \t]+$/gm, '');
         newText = newText.replace(/\n{3,}/g, '\n\n');

         view.dispatch({
             changes: { from: 0, to: view.state.doc.length, insert: newText },
             userEvent: 'input.format.document'
         });
    };

    // --- Helper for Button Styles ---
    const btnClass = "p-2 rounded-lg hover:bg-muted/80 transition-all duration-200 text-muted-foreground hover:text-foreground active:scale-95 disabled:opacity-30 disabled:pointer-events-none";

    return (
        <header className="flex flex-wrap items-center justify-between px-4 py-2 border-b border-border/40 z-50 sticky top-0 bg-background/80 backdrop-blur-xl transition-all duration-500 gap-y-2">
            <ConfirmModal
                isOpen={isConfirmOpen}
                title="Create New File?"
                message="Unsaved changes will be lost. Are you sure you want to start a new file?"
                onConfirm={confirmNewFile}
                onCancel={() => setIsConfirmOpen(false)}
            />
            <InputModal
                isOpen={isInputOpen}
                title="Save to Google Drive"
                message="Enter a filename for your document:"
                defaultValue={pendingSaveName}
                onConfirm={handleConfirmDriveSave}
                onCancel={() => setIsInputOpen(false)}
            />
            {/* Hidden Input for Open File */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleOpenFile}
                accept=".md,.txt"
                className="hidden"
            />

            <div className="flex flex-wrap items-center gap-4 py-1">
                {/* Logo Area */}
                <div className="flex items-center gap-3 pr-2 border-r border-border/20">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-500 dark:text-indigo-400">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><path d="M11 11l-4.393 -4.393"></path></svg>
                    </div>
                    {!isZenMode && <h1 className="text-lg font-bold tracking-tight bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent hidden md:block">Zenith</h1>}
                </div>

                {/* Group 1: File Actions (Unified) */}
                <div className="flex items-center gap-1 border-r border-border/20 pr-2">
                    <button onClick={handleNewFileClick} className={btnClass} title="New File">
                        <FilePlus size={18} />
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className={btnClass} title="Open Local File">
                        <FolderOpen size={18} />
                    </button>

                    {/* Unified Save Button */}
                     <button
                        onClick={handleSaveClick}
                        className={btnClass}
                        title={isAuthenticated ? (driveFileId ? "Save Change to Drive" : "Save to Drive") : "Download Markdown"}
                        disabled={isDriveLoading}
                    >
                         {isDriveLoading ? <Loader2 size={18} className="animate-spin" /> : (isAuthenticated ? <Cloud size={18} /> : <Save size={18} />)}
                    </button>

                     {/* Open from Drive Button (Only when auth) */}
                     {isAuthenticated && (
                        <button
                            onClick={handleOpenFromDrive}
                            className={btnClass}
                            title="Open from Drive"
                            disabled={isDriveLoading}
                        >
                            <DownloadCloud size={18} />
                        </button>
                     )}

                    {/* Export Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="flex items-center gap-1 px-2 py-2 rounded-lg hover:bg-muted/80 transition-all duration-200 text-muted-foreground hover:text-foreground text-sm font-medium active:scale-95"
                            title="Export Options"
                            disabled={isExporting}
                        >
                            {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={18} />}
                            <ChevronDown size={12} className={isMenuOpen ? "rotate-180 transition-transform" : "transition-transform"} />
                        </button>

                        {isMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)}></div>
                                <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-zinc-900 border border-border rounded-xl shadow-xl z-[100] py-1 flex flex-col gap-1">
                                     <div className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/50">Download As</div>
                                    <button onClick={() => handleExport('pdf')} className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors flex items-center gap-2">
                                        <span>📄</span> PDF Document
                                    </button>
                                    <button onClick={() => handleExport('docx')} className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors flex items-center gap-2">
                                        <span>📝</span> Word (.docx)
                                    </button>
                                    <button onClick={() => handleExport('html')} className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors flex items-center gap-2">
                                        <span>🌐</span> HTML File
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Group 3: History */}
                <div className="flex items-center gap-1 border-r border-border/20 pr-2">
                     <button 
                        onClick={undo} 
                        disabled={historyIndex <= 0} 
                        className={btnClass} 
                        title="Undo (Ctrl+Z)"
                    >
                        <Undo size={18} />
                    </button>
                    <button 
                        onClick={redo} 
                        disabled={historyIndex >= history.length - 1} 
                        className={btnClass} 
                        title="Redo (Ctrl+Y)"
                    >
                        <Redo size={18} />
                    </button>
                </div>

                {/* Group 4: Formatting */}
                <div className="flex items-center gap-1 border-r border-border/20 pr-2">
                    <button onClick={() => insertBlockFormat('# ')} className={btnClass} title="Heading 1"><Heading1 size={18} /></button>
                    <button onClick={() => insertBlockFormat('## ')} className={btnClass} title="Heading 2"><Heading2 size={18} /></button>
                    <button onClick={() => insertBlockFormat('### ')} className={btnClass} title="Heading 3"><Heading3 size={18} /></button>
                </div>
                <div className="flex items-center gap-1 border-r border-border/20 pr-2">
                    <button onClick={() => insertFormat('**', '**')} className={btnClass} title="Bold"><Bold size={18} /></button>
                    <button onClick={() => insertFormat('*', '*')} className={btnClass} title="Italic"><Italic size={18} /></button>
                    <button onClick={() => insertFormat('`', '`')} className={btnClass} title="Inline Code"><Code size={18} /></button>
                    <button onClick={() => insertBlockFormat('> ')} className={btnClass} title="Quote"><Quote size={18} /></button>
                </div>
                 <div className="flex items-center gap-1 border-r border-border/20 pr-2">
                    <button onClick={() => insertBlockFormat('- ')} className={btnClass} title="Bullet List"><List size={18} /></button>
                    <button onClick={() => insertBlockFormat('- [ ] ')} className={btnClass} title="Task List"><CheckSquare size={18} /></button>
                </div>

                {/* Group 5: Special */}
                <div className="flex items-center gap-1">
                    <button onClick={formatDocument} className={btnClass} title="Format Document">
                        <Eraser size={18} />
                    </button>
                </div>
            </div>

            {/* Right Side: Toggles */}
            <div className="flex items-center gap-2 ml-auto">
                <GoogleAuthButton />
                <button onClick={toggleZenMode} className={btnClass} title={isZenMode ? "Exit Zen Mode" : "Enter Zen Mode"}>
                    {isZenMode ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
                <button onClick={toggleTheme} className={btnClass} title="Toggle Theme">
                    {theme === 'dark' ? <Sun size={18} className="transition-all duration-300" /> : <Moon size={18} className="transition-all duration-300" />}
                </button>
            </div>
        </header>
    );
};

