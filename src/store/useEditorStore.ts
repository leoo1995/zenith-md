import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface EditorState {
  markdown: string;
  setMarkdown: (markdown: string) => void;
  isZenMode: boolean;
  toggleZenMode: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  outlineWidth: number;
  setOutlineWidth: (width: number) => void;
  previewWidth: number;
  setPreviewWidth: (width: number) => void;
  toggleLineCheckbox: (line: number) => void;
  // History
  history: string[];
  historyIndex: number;
  addToHistory: (newContent: string) => void;
  undo: () => void;
  redo: () => void;
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      markdown: '# Welcome to Zenith Editor\n\nStart typing...',
      setMarkdown: (markdown) => set({ markdown }),
      
      // History
      history: ['# Welcome to Zenith Editor\n\nStart typing...'],
      historyIndex: 0,
      addToHistory: (newContent) => set((state) => {
         // Create a new history entry only if content changed significantly or enough time passed
         // For simplicity in this implementation, we assume the caller handles dedup/debounce
         const currentContent = state.history[state.historyIndex];
         if (currentContent === newContent) return {};

         const newHistory = state.history.slice(0, state.historyIndex + 1);
         newHistory.push(newContent);
         
         // Helper: Limit history size
         if (newHistory.length > 50) {
             newHistory.shift();
             return { history: newHistory, historyIndex: newHistory.length - 1 };
         }
         
         return { history: newHistory, historyIndex: newHistory.length - 1 };
      }),
      undo: () => set((state) => {
          if (state.historyIndex > 0) {
              const newIndex = state.historyIndex - 1;
              return { 
                  historyIndex: newIndex, 
                  markdown: state.history[newIndex] 
              };
          }
          return {};
      }),
      redo: () => set((state) => {
          if (state.historyIndex < state.history.length - 1) {
              const newIndex = state.historyIndex + 1;
              return { 
                  historyIndex: newIndex, 
                  markdown: state.history[newIndex] 
              };
          }
          return {};
      }),

      isZenMode: false,
      toggleZenMode: () => set((state) => ({ isZenMode: !state.isZenMode })),
      theme: 'dark',
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      outlineWidth: 250,
      setOutlineWidth: (outlineWidth) => set({ outlineWidth }),
      previewWidth: 50, // Percentage
      setPreviewWidth: (previewWidth) => set({ previewWidth }),
      toggleLineCheckbox: (line) => set((state) => {
          const lines = state.markdown.split('\n');
          const index = line - 1;
          if (index >= 0 && index < lines.length) {
              const content = lines[index];
              if (content.match(/\[ \]/)) {
                  lines[index] = content.replace('[ ]', '[x]');
              } else if (content.match(/\[x\]/i)) {
                  lines[index] = content.replace(/\[x\]/i, '[ ]');
              }
              const newMarkdown = lines.join('\n');
              // Implicitly add to history on checkbox toggle
              const newHistory = state.history.slice(0, state.historyIndex + 1);
              newHistory.push(newMarkdown);
              return { markdown: newMarkdown, history: newHistory, historyIndex: newHistory.length -1 };
          }
          return {};
      }),
    }),
    {
      name: 'zenith-storage',
      partialize: (state) => ({ 
        markdown: state.markdown, 
        theme: state.theme,
        outlineWidth: state.outlineWidth,
        previewWidth: state.previewWidth,
        // Don't persist history to avoid bloat, or do? User didn't specify. 
        // Persisting text but not history is safer for storage limits.
      }), 
    }
  )
);
