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

  const editorRef = useRef<any>(null); // Holds CodeMirror EditorView instance
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
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground transition-colors duration-500 selection:bg-indigo-500/20">
      <Toolbar editorRef={editorRef} />
      {/* Main Content Area */}
      <main className="flex flex-1 overflow-hidden relative isolate">
        
         {/* Background Ambient Glow */}
         <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80 pointer-events-none opacity-20 dark:opacity-40">
            <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{clipPath: "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)"}}></div>
         </div>

        {/* Outline Column */}
        {!isZenMode && (
          <>
            <aside 
              style={{ width: outlineWidth }}
              className="flex-shrink-0 border-r border-border/40 bg-card/50 backdrop-blur-xl transition-all duration-300 overflow-hidden flex flex-col z-20"
            >
              <div className="p-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest sticky top-0 bg-card/80 backdrop-blur-md z-10 border-b border-border/20">Outline</div>
              <div className="flex-1 overflow-y-auto p-0">
                <Outline />
              </div>
            </aside>
            {/* Outline Resizer */}
            <div
                className="w-1 cursor-col-resize hover:bg-indigo-500/50 transition-colors bg-transparent z-30 group relative"
                onMouseDown={startResizingOutline}
            >
               <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-indigo-500/10 transition-colors"></div>
            </div>
          </>
        )}

        {/* Editor Column */}
        <section className={clsx("flex-1 h-full overflow-hidden flex flex-col transition-all duration-500 ease-in-out relative z-10", isZenMode && "max-w-4xl mx-auto my-8 border border-border/40 shadow-2xl rounded-xl bg-card/30 backdrop-blur-sm")}>
           <div className="flex-1 relative h-full">
             <MarkdownEditor ref={editorRef} />
           </div>
        </section>

        {/* Preview Column */}
        {!isZenMode && (
         <>
            {/* Preview Resizer */}
            <div
                className="w-1 cursor-col-resize hover:bg-indigo-500/50 transition-colors bg-transparent z-30 group relative"
                onMouseDown={startResizingPreview}
            >
               <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-indigo-500/10 transition-colors"></div>
            </div>
            <aside 
              style={{ width: `${previewWidth}%` }} 
              className="flex-shrink-0 border-l border-border/40 bg-card/40 backdrop-blur-xl transition-all duration-300 overflow-hidden z-20"
            >
               <MarkdownPreview ref={previewRef} />
            </aside>
         </>
        )}

      </main>
    </div>
  );
};
