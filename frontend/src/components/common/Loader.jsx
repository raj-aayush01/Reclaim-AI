import React from "react";

export const Loader = ({ text = "Loading data...", fullPage = false }) => {
    const content = (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "1rem",
                padding: "3rem"
            }}
        >
            {/* Blip trio instead of spinner */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {[0, 1, 2].map((i) => (
                    <span
                        key={i}
                        className="animate-blip"
                        style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "9999px",
                            background: "var(--primary)",
                            display: "inline-block",
                            animationDelay: `${i * 280}ms`
                        }}
                    />
                ))}
            </div>
            {text && (
                <p
                    style={{
                        fontSize: "0.75rem",
                        fontFamily: "'JetBrains Mono', monospace",
                        color: "var(--mute)",
                        letterSpacing: "0.04em"
                    }}
                >
                    {text}
                </p>
            )}
        </div>
    );

    if (fullPage) {
        return (
            <div
                style={{
                    minHeight: "60vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                }}
            >
                {content}
            </div>
        );
    }

    return content;
};

export default Loader;
