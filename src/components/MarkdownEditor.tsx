import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { useEditorStore } from '../store/useEditorStore';
import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { EditorView, keymap } from '@codemirror/view';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { githubLight } from '@uiw/codemirror-theme-github';

// Expose the textarea ref to parent
export const MarkdownEditor = forwardRef((_, ref) => {
    const { markdown: content, setMarkdown, theme } = useEditorStore();
    const editorRef = useRef<any>(null); // react-codemirror ref

    useImperativeHandle(ref, () => {
        // Return the CodeMirror EditorView instance
        return editorRef.current?.view;
    }, []);

    const onChange = React.useCallback((value: string) => {
        setMarkdown(value);
    }, [setMarkdown]);

    // Custom Keymap for Checkboxes and Lists
    const smartListKeymap = React.useMemo(() => keymap.of([
        {
            key: 'Enter',
            run: (view) => {
                const { state, dispatch } = view;
                const line = state.doc.lineAt(state.selection.main.head);
                const text = line.text;
                const match = text.match(/^(\s*)([-*]|\d+\.|>)(\s+(\[([ x])\]\s)?)/);
                
                if (match) {
                     const [, indent, marker, space] = match;
                     const hasCheckbox = space && space.includes('[');
                     
                     // Empty list item -> clear it
                     if (text.trim() === marker.trim() || (hasCheckbox && text.trim() === `${marker} [ ]`)) {
                         dispatch({
                             changes: { from: line.from, to: line.to, insert: '' }
                         });
                         return true;
                     } // No return here? CodeMirror expects true if handled.
                     
                     // Insert new item
                     let nextMarker = marker;
                     if (/^\d+\.$/.test(marker)) {
                         const num = parseInt(marker);
                         nextMarker = `${num + 1}.`;
                     }
                     const nextSpace = hasCheckbox ? ' [ ] ' : ' ';
                     const insert = `\n${indent}${nextMarker}${nextSpace}`;
                     dispatch({
                         changes: { from: state.selection.main.head, insert },
                         selection: { anchor: state.selection.main.head + insert.length },
                         scrollIntoView: true
                     });
                     return true;
                }
                return false;
            }
        },
        {
            key: 'Space',
            run: (view) => {
                 const { state, dispatch } = view;
                 const pos = state.selection.main.head;
                 const line = state.doc.lineAt(pos);
                 const textBefore = line.text.slice(0, pos - line.from);
                 
                 // [ ] -> - [ ]
                 if (/^\s*\[ \]$/.test(textBefore)) {
                      const prefix = textBefore.match(/^\s*/)?.[0] || '';
                      const replacement = `${prefix}- [ ] `;
                      // Replace the "[ ]" with "- [ ] " (adding space from keypress)
                      dispatch({
                          changes: { from: line.from, to: pos, insert: replacement + ' ' }, 
                          selection: { anchor: line.from + replacement.length + 1 },
                      });
                      return true;
                 }
                 return false;
            }
        }
    ]), []);

    // CSS Transition for Active Line
    const smoothTransitionTheme = React.useMemo(() => EditorView.theme({
        "& .cm-activeLine": {
            transition: "background-color 0.3s ease-out"
        },
        "& .cm-activeLineGutter": {
            transition: "background-color 0.3s ease-out"
        }
    }), []);

    return (
        <div className="h-full w-full bg-transparent relative overflow-hidden text-base">
             <CodeMirror
                ref={editorRef}
                value={content}
                height="100%"
                theme={theme === 'dark' ? vscodeDark : githubLight}
                extensions={[
                    markdown({ base: markdownLanguage, codeLanguages: languages }),
                    EditorView.lineWrapping, 
                    smartListKeymap,
                    smoothTransitionTheme
                ]}
                onChange={onChange}
                className="h-full text-[15px]" 
                basicSetup={{
                    lineNumbers: true,
                    foldGutter: false,
                    highlightActiveLine: true,
                    indentOnInput: true,
                }}
             />
        </div>
    );
});

MarkdownEditor.displayName = 'MarkdownEditor';
