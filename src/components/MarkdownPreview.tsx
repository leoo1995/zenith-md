import { forwardRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import { useEditorStore } from '../store/useEditorStore';
import { useDebounce } from '../hooks/useDebounce';

export const MarkdownPreview = forwardRef<HTMLDivElement>((_, ref) => {
    const { markdown, toggleLineCheckbox } = useEditorStore();
    const debouncedMarkdown = useDebounce(markdown, 300); // 300ms debounce

    return (
        <div 
            ref={ref}
            id="markdown-preview-content"
            className="h-full w-full overflow-auto p-12 prose prose-slate dark:prose-invert prose-lg max-w-none scroll-smooth prose-headings:font-sans prose-headings:tracking-tight prose-headings:font-bold prose-p:leading-relaxed prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border/50 prose-blockquote:border-indigo-500 prose-a:text-indigo-500 prose-img:rounded-xl prose-img:shadow-lg"
        >
            <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSlug]}
                components={{
                    input: ({ node, ...props }) => {
                        if (props.type === 'checkbox') {
                             return (
                                <input 
                                    type="checkbox" 
                                    checked={props.checked} 
                                    className="mr-2 cursor-pointer accent-indigo-600"
                                    onChange={() => {}} 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const position = node?.position;
                                        if (position) {
                                            toggleLineCheckbox(position.start.line);
                                        }
                                    }}
                                />
                            );
                        }
                        return <input {...props} />;
                    }
                }}
            >
                {debouncedMarkdown}
            </ReactMarkdown>
        </div>
    );
});

MarkdownPreview.displayName = 'MarkdownPreview';
