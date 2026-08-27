import React, { useState, useEffect } from "react";

export const AnimatedNumber = ({ value = 0, duration = 1200, decimals = 0, prefix = "", suffix = "" }) => {
    const [displayVal, setDisplayVal] = useState(0);

    useEffect(() => {
        let startTimestamp = null;
        const target = Number(value) || 0;

        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            
            // Ease out cubic function for smooth deceleration
            const easeOutProgress = 1 - Math.pow(1 - progress, 3);
            const current = easeOutProgress * target;

            setDisplayVal(current);

            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };

        window.requestAnimationFrame(step);
    }, [value, duration]);

    return (
        <span className="font-extrabold tracking-tight">
            {prefix}{displayVal.toFixed(decimals)}{suffix}
        </span>
    );
};

export default AnimatedNumber;
