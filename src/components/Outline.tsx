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
        <ul className="space-y-1 p-4">
            {headings.map((heading, index) => (
                <li key={`${heading.id}-${index}`} style={{ paddingLeft: `${(heading.level - 1) * 12}px` }}>
                    <button 
                        onClick={() => handleScrollTo(heading.id)}
                        className="text-sm text-left truncate w-full hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-600 dark:text-zinc-400 transition-colors"
                    >
                        {heading.text}
                    </button>
                </li>
            ))}
        </ul>
    );
};
