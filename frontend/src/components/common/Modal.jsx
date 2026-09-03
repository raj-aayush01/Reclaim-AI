import React, {
    useEffect,
    useRef
} from "react";
import { createPortal } from "react-dom";
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

        window.addEventListener(
            "keydown",
            handleKeyDown
        );

        return () => {
            window.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };
    }, [isOpen, onClose]);

    useEffect(() => {
        if (
            isOpen &&
            scrollContainerRef.current
        ) {
            scrollContainerRef.current.scrollTop = 0;
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const originalOverflow =
            document.body.style.overflow;

        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow =
                originalOverflow;
        };
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    const modal = (
        <div
            onMouseDown={(event) => {
                if (
                    event.target ===
                    event.currentTarget
                ) {
                    onClose();
                }
            }}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0.75rem",
                background:
                    "oklch(0.1 0.01 250 / 0.55)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter:
                    "blur(6px)"
            }}
        >
            <div
                onMouseDown={(event) =>
                    event.stopPropagation()
                }
                className={maxWidth}
                style={{
                    position: "relative",
                    width: "100%",
                    maxHeight:
                        "calc(100vh - 1.5rem)",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    borderRadius: "0.875rem",
                    border:
                        "1px solid var(--line)",
                    background:
                        "var(--surface-solid)",
                    boxShadow:
                        "0 24px 64px -16px oklch(0.1 0.01 250 / 0.4), 0 0 0 1px var(--line)",
                    animation:
                        "fadeInScale 400ms cubic-bezier(0.32, 0.72, 0, 1) both"
                }}
            >
                <div
                    style={{
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent:
                            "space-between",
                        gap: "1rem",
                        padding:
                            "1rem 1.25rem",
                        borderBottom:
                            "1px solid var(--line)"
                    }}
                >
                    <div
                        style={{
                            minWidth: 0
                        }}
                    >
                        <span
                            className="eyebrow-primary"
                            style={{
                                display: "block",
                                marginBottom: "3px"
                            }}
                        >
                            Recovery Execution
                        </span>

                        <h3
                            style={{
                                fontSize:
                                    "0.9375rem",
                                fontWeight: 600,
                                color:
                                    "var(--ink)",
                                fontFamily:
                                    "'Inter', sans-serif",
                                letterSpacing:
                                    "-0.01em",
                                whiteSpace:
                                    "nowrap",
                                overflow:
                                    "hidden",
                                textOverflow:
                                    "ellipsis"
                            }}
                        >
                            {title}
                        </h3>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            flexShrink: 0,
                            padding:
                                "0.375rem",
                            borderRadius:
                                "0.375rem",
                            border:
                                "1px solid var(--line)",
                            background:
                                "transparent",
                            color:
                                "var(--mute)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems:
                                "center",
                            justifyContent:
                                "center",
                            transition:
                                "all 150ms ease"
                        }}
                        onMouseEnter={(event) => {
                            event.currentTarget.style.background =
                                "var(--line)";
                            event.currentTarget.style.color =
                                "var(--ink)";
                        }}
                        onMouseLeave={(event) => {
                            event.currentTarget.style.background =
                                "transparent";
                            event.currentTarget.style.color =
                                "var(--mute)";
                        }}
                        aria-label="Close modal"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div
                    ref={scrollContainerRef}
                    style={{
                        flex: 1,
                        minHeight: 0,
                        overflowY: "auto",
                        overscrollBehavior:
                            "contain",
                        padding: "1.25rem"
                    }}
                >
                    {children}
                </div>

                {footer && (
                    <div
                        style={{
                            flexShrink: 0,
                            padding:
                                "0.875rem 1.25rem",
                            borderTop:
                                "1px solid var(--line)"
                        }}
                    >
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );

    return createPortal(
        modal,
        document.body
    );
};

export default Modal;