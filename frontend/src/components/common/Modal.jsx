import React, { useEffect } from "react";
import { X } from "lucide-react";

export const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-lg" }) => {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
            <div className={`relative w-full ${maxWidth} bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl shadow-indigo-950/40 overflow-hidden transform transition-all duration-300 scale-100`}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/50">
                    <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 max-h-[80vh] overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
