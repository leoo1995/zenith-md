import React, { useState, useRef } from 'react';
import { useEditorStore } from '../store/useEditorStore';
import { 
    Moon, Sun, Maximize2, Minimize2, Download, FilePlus, ChevronDown, 
    FolderOpen, Save, Undo, Redo, Bold, Italic, Code, Quote, List, CheckSquare, 
    Heading1, Heading2, Heading3, Eraser, Loader2
} from 'lucide-react';
import { exportToHtml, exportToDocx, exportToPdf } from '../utils/exportUtils';
import { ConfirmModal } from './ConfirmModal';


interface ToolbarProps {
    editorRef: React.RefObject<HTMLTextAreaElement | null>;
}

export const Toolbar: React.FC<ToolbarProps> = ({ editorRef }) => {
    const { 
        theme, toggleTheme, isZenMode, toggleZenMode, markdown, setMarkdown,
        history, historyIndex, undo, redo, addToHistory
    } = useEditorStore();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- File Operations ---
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
        // Reset history
        // ideally we should clear history here but store doesn't expose it. 
        // calling setMarkdown adds to history via our effect (if we had one) or we just accept it starts a new history node.
    };

    const handleOpenFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                setMarkdown(content);
                addToHistory(content);
            };
            reader.readAsText(file);
        }
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSaveMd = async () => {
        try {
            // Modern File System Access API
            if ('showSaveFilePicker' in window) {
                const handle = await (window as any).showSaveFilePicker({
                    suggestedName: `Zenith-Doc-${new Date().toISOString().split('T')[0]}.md`,
                    types: [{
                        description: 'Markdown File',
                        accept: { 'text/markdown': ['.md'] },
                    }],
                });
                const writable = await handle.createWritable();
                await writable.write(markdown);
                await writable.close();
                return;
            }
        } catch (err) {
            // Ignore cancel errors, fall through to fallback if needed
            if ((err as Error).name !== 'AbortError') {
                 console.warn('FileSystemAccess API failed, using fallback', err);
            } else {
                return; // User cancelled
            }
        }

        // Fallback: Robust Anchor Download
        const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        link.download = `Zenith-Doc-${timestamp}.md`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        
        // Delay cleanup to ensure browser captures the download
        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        }, 1000);
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
        const textarea = editorRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selectedText = text.substring(start, end);

        const before = text.substring(0, start);
        const after = text.substring(end);

        // Check if already applied (naive check for partial toggle)
        // For simplicity, we just wrap. Enhancements: check surrounding chars.
        
        const newText = before + prefix + selectedText + suffix + after;
        setMarkdown(newText);
        addToHistory(newText);
        
        requestAnimationFrame(() => {
            textarea.focus();
            textarea.setSelectionRange(start + prefix.length, end + prefix.length);
        });
    };

    const insertBlockFormat = (prefix: string) => {
        const textarea = editorRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const text = textarea.value;
        
        // Find start of current line
        const lineStart = text.lastIndexOf('\n', start - 1) + 1;
        const lineEnd = text.indexOf('\n', start);
        const actualLineEnd = lineEnd === -1 ? text.length : lineEnd;
        
        const currentLine = text.substring(lineStart, actualLineEnd);
        
        // Toggle if already exists
        let newLine = currentLine;
        if (currentLine.startsWith(prefix)) {
            newLine = currentLine.substring(prefix.length);
        } else if (prefix === '# ' || prefix === '## ' || prefix === '### ') {
             // specific logic for headers to replace other headers
             newLine = prefix + currentLine.replace(/^#{1,6}\s/, '');
        } else {
            newLine = prefix + currentLine;
        }

        const newText = text.substring(0, lineStart) + newLine + text.substring(actualLineEnd);
        setMarkdown(newText);
        addToHistory(newText);

        requestAnimationFrame(() => {
            textarea.focus();
            // Move cursor to end of line or maintain relative pos?
            textarea.setSelectionRange(lineStart + newLine.length, lineStart + newLine.length);
        });
    };

    const formatDocument = () => {
         // remove trailing whitespace, condense multiple newlines to max 2
         let newText = markdown.replace(/[ \t]+$/gm, ''); // trailing spaces
         newText = newText.replace(/\n{3,}/g, '\n\n'); // multiple breaks
         setMarkdown(newText);
         addToHistory(newText);
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

                {/* Group 1: File Actions */}
                <div className="flex items-center gap-1 border-r border-border/20 pr-2">
                    <button onClick={handleNewFileClick} className={btnClass} title="New File">
                        <FilePlus size={18} />
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className={btnClass} title="Open File">
                        <FolderOpen size={18} />
                    </button>
                    <button onClick={handleSaveMd} className={btnClass} title="Save Markdown">
                        <Save size={18} />
                    </button>
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

                {/* Group 2: History */}
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

                {/* Group 3: Formatting */}
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

                {/* Group 4: Special */}
                <div className="flex items-center gap-1">
                    <button onClick={formatDocument} className={btnClass} title="Format Document">
                        <Eraser size={18} />
                    </button>
                </div>
            </div>

            {/* Right Side: Toggles */}
            <div className="flex items-center gap-2 ml-auto">
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
