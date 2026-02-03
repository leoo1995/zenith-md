import React from 'react';
import { createPortal } from 'react-dom';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel
}) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-background/50 backdrop-blur-sm transition-opacity"
                onClick={onCancel}
            ></div>
            
            {/* Modal */}
            <div className="relative w-full max-w-sm overflow-hidden rounded-xl border border-border/50 bg-background/90 backdrop-blur-xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <h3 className="text-lg font-bold tracking-tight text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                    {message}
                </p>
                
                <div className="flex items-center justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted/80 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
