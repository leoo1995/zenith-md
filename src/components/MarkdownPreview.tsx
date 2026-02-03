import { forwardRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import { useEditorStore } from '../store/useEditorStore';

export const MarkdownPreview = forwardRef<HTMLDivElement>((_, ref) => {
    const { markdown, toggleLineCheckbox } = useEditorStore();

    return (
        <div 
            ref={ref}
            id="markdown-preview-content"
            className="h-full w-full overflow-auto p-8 prose prose-slate dark:prose-invert prose-lg max-w-none scroll-smooth"
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
                {markdown}
            </ReactMarkdown>
        </div>
    );
});

MarkdownPreview.displayName = 'MarkdownPreview';
