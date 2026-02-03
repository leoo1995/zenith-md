import React, { useEffect } from 'react';
import { useEditorStore } from '../store/useEditorStore';
import clsx from 'clsx';
// import { Moon, Sun, Maximize2, Minimize2 } from 'lucide-react'; // Icons moved to Toolbar
import { MarkdownEditor } from './MarkdownEditor';
import { MarkdownPreview } from './MarkdownPreview';
import { Outline } from './Outline';
import { Toolbar } from './Toolbar';

import { useRef } from 'react';
import { useScrollSync } from '../hooks/useScrollSync';

export const EditorLayout: React.FC = () => {
  const { 
    theme, isZenMode,
    outlineWidth, setOutlineWidth, previewWidth, setPreviewWidth 
  } = useEditorStore();

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useScrollSync(editorRef, previewRef);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme); 
  }, [theme]);

  // Resizing Logic
  const startResizingOutline = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = outlineWidth;

    const onMouseMove = (e: MouseEvent) => {
      const newWidth = startWidth + (e.clientX - startX);
      if (newWidth > 150 && newWidth < 400) {
        setOutlineWidth(newWidth);
      }
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [outlineWidth, setOutlineWidth]);
  
  const startResizingPreview = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const containerWidth = window.innerWidth - (isZenMode ? 0 : outlineWidth); 
    const startPWidth = previewWidth;

    const onMouseMove = (e: MouseEvent) => {
        const delta = startX - e.clientX;
        const newWidthPercent = startPWidth + (delta / containerWidth * 100);
        if (newWidthPercent > 20 && newWidthPercent < 80) {
            setPreviewWidth(newWidthPercent);
        }
    };
    
    const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [previewWidth, setPreviewWidth, outlineWidth, isZenMode]);


  return (
    <div className="flex h-screen w-full flex-col bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 transition-colors duration-400">
      <Toolbar />
      {/* Main Content Area */}
      <main className="flex flex-1 overflow-hidden relative">
        {/* Outline Column */}
        {!isZenMode && (
          <>
            <aside 
              style={{ width: outlineWidth }}
              className="flex-shrink-0 border-r border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 transition-all duration-300 overflow-auto"
            >
              <div className="p-4 text-xs font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider sticky top-0 bg-slate-50 dark:bg-zinc-950 z-10">Outline</div>
              <Outline />
            </aside>
            {/* Outline Resizer */}
            <div
                className="w-1 cursor-col-resize hover:bg-indigo-500 dark:hover:bg-indigo-400 transition-colors bg-transparent z-10"
                onMouseDown={startResizingOutline}
            />
          </>
        )}

        {/* Editor Column */}
        <section className={clsx("flex-1 h-full overflow-hidden flex flex-col transition-all duration-300", isZenMode && "max-w-3xl mx-auto border-x border-slate-200 dark:border-zinc-800 shadow-xl")}>
           <div className="flex-1 relative h-full">
             <MarkdownEditor ref={editorRef} />
           </div>
        </section>

        {/* Preview Column */}
        {!isZenMode && (
         <>
            {/* Preview Resizer */}
            <div
                className="w-1 cursor-col-resize hover:bg-indigo-500 dark:hover:bg-indigo-400 transition-colors bg-transparent z-10"
                onMouseDown={startResizingPreview}
            />
            <aside 
              style={{ width: `${previewWidth}%` }} 
              className="flex-shrink-0 border-l border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-all duration-300 overflow-hidden"
            >
               <MarkdownPreview ref={previewRef} />
            </aside>
         </>
        )}

      </main>
    </div>
  );
};
