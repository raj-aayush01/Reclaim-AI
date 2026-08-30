import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

export const Modal = ({
    isOpen,
    onClose,
    title = "AI Recovery",
    children,
    maxWidth = "max-w-4xl",
    footer
}) => {
    const scrollContainerRef = useRef(null);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen && scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const originalOverflow = document.body.style.overflow;

        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    return (
        <div
            className="
                fixed
                inset-0
                z-[100]
                flex
                items-center
                justify-center
                p-3
                sm:p-6
                bg-slate-950/85
                backdrop-blur-sm
                animate-fade-in
            "
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                className={`
                    relative
                    w-full
                    ${maxWidth}
                    max-h-[calc(100vh-1.5rem)]
                    sm:max-h-[calc(100vh-3rem)]
                    flex
                    flex-col
                    overflow-hidden
                    rounded-2xl
                    border
                    border-slate-700/80
                    bg-slate-900
                    shadow-2xl
                    shadow-black/60
                `}
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div
                    className="
                        shrink-0
                        flex
                        items-center
                        justify-between
                        gap-4
                        px-5
                        py-4
                        sm:px-6
                        bg-slate-900
                        border-b
                        border-slate-800
                    "
                >
                    <div className="min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-slate-100 truncate">
                            {title}
                        </h3>

                        <p className="text-[11px] text-slate-500 mt-0.5">
                            Recovery execution details
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="
                            shrink-0
                            p-2
                            rounded-lg
                            text-slate-400
                            hover:text-slate-100
                            hover:bg-slate-800
                            transition-colors
                            cursor-pointer
                        "
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div
                    ref={scrollContainerRef}
                    className="
                        flex-1
                        min-h-0
                        overflow-y-auto
                        overscroll-contain
                        px-4
                        py-5
                        sm:px-6
                        sm:py-6
                        scrollbar-thin
                        scrollbar-thumb-slate-700
                        scrollbar-track-slate-900
                    "
                >
                    {children}
                </div>

                {footer && (
                    <div
                        className="
                            shrink-0
                            px-4
                            py-3
                            sm:px-6
                            sm:py-4
                            bg-slate-900
                            border-t
                            border-slate-800
                        "
                    >
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;