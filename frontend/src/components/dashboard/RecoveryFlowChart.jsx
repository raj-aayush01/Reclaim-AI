import React, { useState, useRef, useMemo, useEffect } from "react";

const formatAmount = (amount) => {
    if (amount >= 100000) {
        return `₹${(amount / 100000).toFixed(2)}L`;
    }

    if (amount >= 1000) {
        return `₹${(amount / 1000).toFixed(1)}K`;
    }

    return `₹${Math.round(amount)}`;
};

export const RecoveryFlowChart = ({ data = [], timeRange = "7D" }) => {
    const containerRef = useRef(null);

    const [activeIndex, setActiveIndex] = useState(
        data.length > 0 ? data.length - 1 : 0
    );

    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        setActiveIndex(data.length > 0 ? data.length - 1 : 0);
    }, [data]);

    const points = useMemo(() => {
        if (!data.length) {
            return [];
        }

        const chartWidth = 720;
        const chartTop = 20;
        const chartBottom = 210;
        const chartHeight = chartBottom - chartTop;

        const maxValue = Math.max(
            ...data.map((point) =>
                Math.max(point.atRisk || 0, point.recovered || 0)
            ),
            1
        );

        return data.map((point, index) => {
            const x =
                data.length === 1
                    ? 40
                    : 40 + (index / (data.length - 1)) * chartWidth;

            const atRiskY =
                chartBottom -
                ((point.atRisk || 0) / maxValue) * chartHeight;

            const recoveredY =
                chartBottom -
                ((point.recovered || 0) / maxValue) * chartHeight;

            return {
                ...point,
                x,
                yAtRisk: atRiskY,
                yRecovered: recoveredY,
                atRiskLabel: formatAmount(point.atRisk || 0),
                recLabel: formatAmount(point.recovered || 0)
            };
        });
    }, [data]);

    const handleMouseMove = (e) => {
        if (!containerRef.current || points.length === 0) {
            return;
        }

        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;

        let closestIdx = 0;
        let minDiff = Infinity;

        points.forEach((point, index) => {
            const scaledX = (point.x / 800) * rect.width;
            const diff = Math.abs(mouseX - scaledX);

            if (diff < minDiff) {
                minDiff = diff;
                closestIdx = index;
            }
        });

        setActiveIndex(closestIdx);
    };

    const activePoint = points[activeIndex];

    const createSmoothPath = (key) => {
        if (points.length === 0) {
            return "";
        }

        if (points.length === 1) {
            return `M ${points[0].x} ${points[0][key]}`;
        }

        let path = `M ${points[0].x} ${points[0][key]}`;

        for (let i = 1; i < points.length; i++) {
            const previous = points[i - 1];
            const current = points[i];

            const controlX = (previous.x + current.x) / 2;

            path += ` C ${controlX} ${previous[key]}, ${controlX} ${current[key]}, ${current.x} ${current[key]}`;
        }

        return path;
    };

    const atRiskPath = createSmoothPath("yAtRisk");
    const recoveredPath = createSmoothPath("yRecovered");

    const atRiskAreaPath =
        points.length > 0
            ? `${atRiskPath} L ${points[points.length - 1].x} 210 L ${points[0].x} 210 Z`
            : "";

    const maxChartValue = Math.max(
        ...points.map((point) => point.atRisk || 0),
        ...points.map((point) => point.recovered || 0),
        1
    );

    const yAxisValues = [
        maxChartValue,
        maxChartValue * 0.75,
        maxChartValue * 0.5,
        maxChartValue * 0.25,
        0
    ];

    const getRangeLabel = () => {
        if (timeRange === "Today") {
            return "Today";
        }

        if (timeRange === "30D") {
            return "Last 30 days";
        }

        return "Last 7 days";
    };

    return (
        <div className="panel p-6 rounded-xl flex flex-col justify-between h-full">
            <div>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3
                            style={{
                                fontSize: "0.9375rem",
                                fontWeight: 600,
                                color: "var(--ink)",
                                fontFamily: "'Inter', sans-serif"
                            }}
                        >
                            Recovery Flow
                        </h3>

                        <p
                            style={{
                                fontSize: "0.6875rem",
                                color: "var(--mute)",
                                marginTop: "2px"
                            }}
                        >
                            At-risk vs recovered — {getRangeLabel()}
                        </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-semibold">
                        <span className="flex items-center gap-1.5" style={{ color: "var(--warn)" }}>
                            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--warn)" }} />
                            At Risk
                        </span>

                        <span className="flex items-center gap-1.5" style={{ color: "var(--up)" }}>
                            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--up)" }} />
                            Recovered
                        </span>
                    </div>
                </div>

                {points.length === 0 ? (
                    <div
                        className="h-64 flex items-center justify-center font-mono"
                        style={{ fontSize: "0.75rem", color: "var(--mute)" }}
                    >
                        No recovery data available for this period.
                    </div>
                ) : (
                    <>
                        <div
                            ref={containerRef}
                            onMouseMove={handleMouseMove}
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                            className="relative h-64 w-full my-2 pt-6 pb-6 px-2 cursor-crosshair select-none"
                        >
                            {yAxisValues.map((value, index) => {
                                const topPositions = [24, 74, 122, 170, 218];

                                return (
                                    <div
                                        key={index}
                                        className="absolute inset-x-0 flex items-center font-mono"
                                        style={{
                                            top: `${topPositions[index]}px`,
                                            borderBottom: "1px solid var(--line)",
                                            fontSize: "0.625rem",
                                            color: "var(--mute)"
                                        }}
                                    >
                                        <span>{formatAmount(value)}</span>
                                    </div>
                                );
                            })}

                            <svg
                                viewBox="0 0 800 230"
                                className="absolute inset-0 w-full h-full overflow-visible"
                            >
                                <defs>
                                    <linearGradient
                                        id="amberGradient"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="0%"
                                            stopColor="var(--warn)"
                                            stopOpacity="0.25"
                                        />

                                        <stop
                                            offset="100%"
                                            stopColor="var(--warn)"
                                            stopOpacity="0"
                                        />
                                    </linearGradient>
                                </defs>

                                <path
                                    d={atRiskAreaPath}
                                    fill="url(#amberGradient)"
                                />

                                <path
                                    d={atRiskPath}
                                    fill="none"
                                    stroke="var(--warn)"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                />

                                <path
                                    d={recoveredPath}
                                    fill="none"
                                    stroke="var(--up)"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                />

                                {isHovered && activePoint && (
                                    <>
                                        <line
                                            x1={activePoint.x}
                                            y1="20"
                                            x2={activePoint.x}
                                            y2="215"
                                            stroke="var(--mute)"
                                            strokeWidth="1"
                                            strokeDasharray="3 3"
                                            opacity="0.6"
                                        />

                                        <circle
                                            cx={activePoint.x}
                                            cy={activePoint.yAtRisk}
                                            r="5"
                                            fill="var(--warn)"
                                            stroke="var(--surface-solid)"
                                            strokeWidth="2"
                                        />

                                        <circle
                                            cx={activePoint.x}
                                            cy={activePoint.yRecovered}
                                            r="5"
                                            fill="var(--up)"
                                            stroke="var(--surface-solid)"
                                            strokeWidth="2"
                                        />
                                    </>
                                )}
                            </svg>

                            {isHovered && activePoint && (
                                <div
                                    className="absolute pointer-events-none z-10 transition-all duration-150 ease-out"
                                    style={{
                                        left: `${Math.min(
                                            Math.max(
                                                (activePoint.x / 800) * 100,
                                                15
                                            ),
                                            80
                                        )}%`,
                                        top: `${Math.max(
                                            activePoint.yAtRisk - 10,
                                            20
                                        )}px`,
                                        transform: "translateX(-50%)"
                                    }}
                                >
                                    <div
                                        className="chart-tooltip"
                                        style={{ minWidth: "140px" }}
                                    >
                                        <div className="chart-tooltip-label">
                                            {activePoint.label ||
                                                activePoint.date}
                                        </div>

                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                gap: "0.75rem",
                                                color: "var(--warn)",
                                                fontWeight: 700,
                                                fontFamily: "'JetBrains Mono', monospace",
                                                fontSize: "0.75rem"
                                            }}
                                        >
                                            <span>At Risk:</span>
                                            <span>
                                                {activePoint.atRiskLabel}
                                            </span>
                                        </div>

                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                gap: "0.75rem",
                                                color: "var(--up)",
                                                fontWeight: 700,
                                                fontFamily: "'JetBrains Mono', monospace",
                                                fontSize: "0.75rem",
                                                marginTop: "2px"
                                            }}
                                        >
                                            <span>Recovered:</span>
                                            <span>
                                                {activePoint.recLabel}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                fontSize: "0.625rem",
                                fontFamily: "'JetBrains Mono', monospace",
                                color: "var(--mute)",
                                paddingTop: "0.5rem",
                                paddingLeft: "1rem",
                                paddingRight: "1rem",
                                borderTop: "1px solid var(--line)"
                            }}
                        >
                            <span>
                                {points[0]?.label || points[0]?.date}
                            </span>

                            <span>
                                {points[points.length - 1]?.label ||
                                    points[points.length - 1]?.date}
                            </span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default RecoveryFlowChart;