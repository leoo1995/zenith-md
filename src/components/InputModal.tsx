import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface InputModalProps {
    isOpen: boolean;
    title: string;
    message?: string;
    defaultValue?: string;
    onConfirm: (value: string) => void;
    onCancel: () => void;
}

export const InputModal: React.FC<InputModalProps> = ({ 
    isOpen, title, message, defaultValue = '', onConfirm, onCancel 
}) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.value = defaultValue;
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isOpen, defaultValue]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputRef.current) {
            onConfirm(inputRef.current.value);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
                    <button onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                {message && <p className="text-sm text-muted-foreground mb-4">{message}</p>}
                
                <form onSubmit={handleSubmit}>
                    <input 
                        ref={inputRef}
                        type="text" 
                        className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 mb-6 text-foreground placeholder-muted-foreground"
                        placeholder="Enter filename..."
                    />
                    
                    <div className="flex justify-end gap-3">
                        <button 
                            type="button" 
                            onClick={onCancel}
                            className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                        >
                            Confirm
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
