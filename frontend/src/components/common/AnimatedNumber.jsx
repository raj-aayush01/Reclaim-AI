import React, { useState, useEffect } from "react";

export const AnimatedNumber = ({
    value = 0,
    duration = 1200,
    decimals = 0,
    prefix = "",
    suffix = ""
}) => {
    const [displayVal, setDisplayVal] = useState(0);

    useEffect(() => {
        let startTimestamp = null;
        const target = Number(value) || 0;

        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;

            const progress = Math.min(
                (timestamp - startTimestamp) / duration,
                1
            );

            const easeOutProgress =
                1 - Math.pow(1 - progress, 3);

            const current = easeOutProgress * target;

            setDisplayVal(current);

            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };

        window.requestAnimationFrame(step);
    }, [value, duration]);

    const formattedValue = displayVal.toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });

    return (
        <span className="font-extrabold tracking-tight">
            {prefix}{formattedValue}{suffix}
        </span>
    );
};

export default AnimatedNumber;