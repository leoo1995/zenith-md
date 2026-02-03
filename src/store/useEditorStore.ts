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
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      markdown: '# Welcome to Zenith Editor\n\nStart typing...',
      setMarkdown: (markdown) => set({ markdown }),
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
              return { markdown: lines.join('\n') };
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
        previewWidth: state.previewWidth
      }), 
    }
  )
);
