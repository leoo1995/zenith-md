import React, { useMemo } from 'react';
import { useEditorStore } from '../store/useEditorStore';
import Slugger from 'github-slugger';

export const Outline: React.FC = () => {
    const { markdown } = useEditorStore();
    const slugger = new Slugger();

    const headings = useMemo(() => {
        slugger.reset();
        const regex = /^(#{1,6})\s+(.+)$/gm;
        const results = [];
        let match;
        while ((match = regex.exec(markdown)) !== null) {
            results.push({
                level: match[1].length,
                text: match[2],
                id: slugger.slug(match[2])
            });
        }
        return results;
    }, [markdown]);

    const handleScrollTo = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    if (headings.length === 0) {
        return <div className="p-4 text-sm text-slate-400 dark:text-zinc-600 italic">No headings found.</div>;
    }

    return (
        <ul className="space-y-0.5 p-4">
            {headings.map((heading, index) => (
                <li key={`${heading.id}-${index}`} style={{ paddingLeft: `${(heading.level - 1) * 12}px` }}>
                    <button 
                        onClick={() => handleScrollTo(heading.id)}
                        className="text-[13px] text-left truncate w-full py-1 px-2 rounded-md hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all duration-200 border border-transparent hover:border-border/40"
                    >
                        {heading.text}
                    </button>
                </li>
            ))}
        </ul>
    );
};
