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
        const textarea = e.currentTarget;
        const start = textarea.selectionStart;
        const value = textarea.value;

        if (e.key === ' ') {
            // Smart Checkbox: Convert "[ ] " to "- [ ] "
            // Get text before cursor on current line
            const lineStart = value.lastIndexOf('\n', start - 1) + 1;
            const textSinceLineStart = value.substring(lineStart, start);
            
            // Check if user typed "[ ]" (or " [ ]") at start of line
            if (/^\s*\[ \]$/.test(textSinceLineStart)) {
                e.preventDefault();
                const prefix = textSinceLineStart.match(/^\s*/)?.[0] || '';
                const replacement = `${prefix}- [ ] `;
                
                const newValue = value.substring(0, lineStart) + replacement + value.substring(start);
                setMarkdown(newValue);
                
                requestAnimationFrame(() => {
                     textarea.selectionStart = textarea.selectionEnd = lineStart + replacement.length;
                });
            }
        }

        if (e.key === 'Enter') {
            
            // Get current line up to cursor
            const lineStart = value.lastIndexOf('\n', start - 1) + 1;
            const currentLine = value.substring(lineStart, start);
            
            // Regex for list items (- , * , 1. ) and blockquotes (> )
            // Also supports task lists "- [ ]" or "- [x]"
            const listMatch = currentLine.match(/^(\s*)([-*]|\d+\.|>)(\s+(\[([ x])\]\s)?)/);
            
            if (listMatch) {
                e.preventDefault();
                const [, indent, marker, space] = listMatch;
                const hasCheckbox = space.includes('[');
                
                // If the line is empty (just the marker), finish the list
                if (currentLine.trim() === marker.trim() || (hasCheckbox && currentLine.trim() === `${marker} [ ]`)) {
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

                // Maintain checkbox state (always unchecked for new line)
                const nextSpace = hasCheckbox ? ' [ ] ' : ' ';

                const insertion = `\n${indent}${nextMarker}${nextSpace}`;
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
                            "h-[28px] text-[13px] transition-colors duration-150 flex items-center justify-end font-mono", 
                            activeLine === num ? "text-indigo-500 font-bold opacity-100" : "text-muted-foreground/30"
                        )}
                    >
                        {num}
                    </div>
                ))}
            </div>

            {/* Textarea */}
            <div className="flex-1 h-full relative">
                 {/* Active Line Highlight Background */}
                 <div 
                    className="absolute w-full h-[28px] bg-indigo-500/5 dark:bg-indigo-500/10 pointer-events-none transition-all duration-200 ease-out mt-8 border-l-2 border-indigo-500/50 backdrop-blur-[1px]"
                    style={{ top: `${(activeLine - 1) * 28}px` }} 
                 ></div>

                <textarea
                    ref={textareaRef}
                    value={markdown}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    onSelect={handleSelect}
                    onScroll={handleScroll}
                    className="w-full h-full p-8 pl-12 pr-12 bg-transparent resize-none outline-none font-mono text-[15px] text-slate-800 dark:text-zinc-300 relative z-10 placeholder:text-muted-foreground/40 selection:bg-indigo-500/30 whitespace-pre overflow-x-auto"
                    spellCheck="false"
                    style={{ lineHeight: '28px' }} 
                    placeholder="Start typing..."
                />
            </div>
        </div>
    );
});

MarkdownEditor.displayName = 'MarkdownEditor';
