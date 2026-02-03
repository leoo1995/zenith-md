import { forwardRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/atom-one-dark.css';
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
                rehypePlugins={[rehypeSlug, rehypeHighlight]}
                components={{
                    // Checkbox styling
                    input: ({ node, ...props }) => {
                        if (props.type === 'checkbox') {
                             return (
                                <input 
                                    type="checkbox" 
                                    checked={props.checked} 
                                    className="mr-2 cursor-pointer accent-indigo-600 rounded-sm w-4 h-4 text-indigo-600 focus:ring-indigo-500"
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
                    },
                    // Table styling
                    table: ({ node, ...props }) => (
                        <div className="overflow-x-auto my-6 rounded-lg border border-border/50 shadow-sm bg-card/30">
                            <table className="w-full text-left text-sm text-foreground" {...props} />
                        </div>
                    ),
                    thead: ({ node, ...props }) => (
                        <thead className="bg-muted/50 text-muted-foreground uppercase tracking-wider text-xs font-semibold" {...props} />
                    ),
                    th: ({ node, ...props }) => (
                        <th className="px-6 py-4 border-b border-border/50" {...props} />
                    ),
                    td: ({ node, ...props }) => (
                        <td className="px-6 py-4 border-b border-border/10 whitespace-nowrap" {...props} />
                    ),
                    tr: ({ node, ...props }) => (
                        <tr className="hover:bg-muted/30 transition-colors" {...props} />
                    )
                }}
            >
                {debouncedMarkdown}
            </ReactMarkdown>
        </div>
    );
});

MarkdownPreview.displayName = 'MarkdownPreview';
