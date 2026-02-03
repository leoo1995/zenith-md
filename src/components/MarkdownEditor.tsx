import React, {  useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { useEditorStore } from '../store/useEditorStore';
import clsx from 'clsx';

// Expose the textarea ref to parent
export const MarkdownEditor = forwardRef<HTMLTextAreaElement>((_, ref) => {
    const { markdown, setMarkdown } = useEditorStore();
    const [activeLine, setActiveLine] = useState(1);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lineNumbersRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => textareaRef.current!);

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMarkdown(e.target.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter') {
            const textarea = e.currentTarget;
            const start = textarea.selectionStart;
            const value = textarea.value;
            
            // Get current line up to cursor
            const lineStart = value.lastIndexOf('\n', start - 1) + 1;
            const currentLine = value.substring(lineStart, start);
            
            // Regex for list items (- , * , 1. ) and blockquotes (> )
            const listMatch = currentLine.match(/^(\s*)([-*]|\d+\.|>)(\s+)/);
            
            if (listMatch) {
                e.preventDefault();
                const [, indent, marker, space] = listMatch;
                
                // If the line is empty (just the marker), finish the list
                if (currentLine.trim() === marker.trim()) {
                     const newValue = value.substring(0, lineStart) + value.substring(start);
                     setMarkdown(newValue);
                     // Set cursor
                     requestAnimationFrame(() => {
                        textarea.selectionStart = textarea.selectionEnd = lineStart;
                     });
                     return;
                }

                // Auto-increment numbered lists
                let nextMarker = marker;
                if (/^\d+\.$/.test(marker)) {
                    const num = parseInt(marker);
                    nextMarker = `${num + 1}.`;
                }

                const insertion = `\n${indent}${nextMarker}${space}`;
                const newValue = value.substring(0, start) + insertion + value.substring(textarea.selectionEnd);
                
                setMarkdown(newValue);
                
                requestAnimationFrame(() => {
                    textarea.selectionStart = textarea.selectionEnd = start + insertion.length;
                });
            }
        }
    };

    const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
        const textarea = e.currentTarget;
        const value = textarea.value;
        const selectionStart = textarea.selectionStart;
        const currentLine = value.substr(0, selectionStart).split('\n').length;
        setActiveLine(currentLine);
    };

    const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
        if (lineNumbersRef.current) {
            lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
        }
    };

    // Generate line numbers
    const lineNumbers = React.useMemo(() => {
        const lines = markdown.split('\n').length;
        return Array.from({ length: Math.max(lines, 1) }, (_, i) => i + 1);
    }, [markdown]);

    return (
        <div className="flex h-full w-full bg-transparent relative">
            {/* Line Numbers */}
            <div 
                ref={lineNumbersRef}
                className="w-12 flex-shrink-0 h-full overflow-hidden text-right pr-3 pt-8 pb-8 text-slate-400 dark:text-zinc-600 bg-slate-50 dark:bg-zinc-950/50 font-mono text-base leading-relaxed select-none"
            >
                {lineNumbers.map((num) => (
                    <div 
                        key={num} 
                        className={clsx(
                            "h-[24px] transition-colors duration-150", 
                            activeLine === num && "text-indigo-600 dark:text-indigo-400 font-bold"
                        )}
                    >
                        {num}
                    </div>
                ))}
            </div>

            {/* Textarea */}
            <div className="flex-1 h-full relative">
                 {/* Active Line Highlight Background - Optional enhancement */}
                 <div 
                    className="absolute w-full h-[24px] bg-indigo-50/50 dark:bg-indigo-900/20 pointer-events-none transition-all duration-100 mt-8"
                    style={{ top: `${(activeLine - 1) * 24}px` }} 
                 ></div>

                <textarea
                    ref={textareaRef}
                    value={markdown}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    onSelect={handleSelect}
                    onScroll={handleScroll}
                    className="w-full h-full p-8 pl-4 pr-4 bg-transparent resize-none outline-none font-mono text-base leading-relaxed text-slate-800 dark:text-zinc-300 relative z-10"
                    spellCheck={false}
                    style={{ lineHeight: '24px' }} 
                    placeholder="# Start writing..."
                />
            </div>
        </div>
    );
});

MarkdownEditor.displayName = 'MarkdownEditor';
