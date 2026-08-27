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
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between h-full">
            <div>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-base font-bold text-slate-100">
                            Recovery Flow
                        </h3>

                        <p className="text-xs text-slate-400">
                            At-risk vs recovered — {getRangeLabel()}
                        </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-semibold">
                        <span className="flex items-center gap-1.5 text-amber-400">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                            At Risk
                        </span>

                        <span className="flex items-center gap-1.5 text-emerald-400">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                            Recovered
                        </span>
                    </div>
                </div>

                {points.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-xs text-slate-500 font-mono">
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
                                        className="absolute inset-x-0 border-b border-slate-800/50 flex items-center text-[10px] text-slate-500 font-mono"
                                        style={{
                                            top: `${topPositions[index]}px`
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
                                            stopColor="#f59e0b"
                                            stopOpacity="0.25"
                                        />

                                        <stop
                                            offset="100%"
                                            stopColor="#f59e0b"
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
                                    stroke="#f59e0b"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                />

                                <path
                                    d={recoveredPath}
                                    fill="none"
                                    stroke="#10b981"
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
                                            stroke="#94a3b8"
                                            strokeWidth="1"
                                            strokeDasharray="3 3"
                                            opacity="0.8"
                                        />

                                        <circle
                                            cx={activePoint.x}
                                            cy={activePoint.yAtRisk}
                                            r="5"
                                            fill="#f59e0b"
                                            stroke="#090d16"
                                            strokeWidth="2"
                                        />

                                        <circle
                                            cx={activePoint.x}
                                            cy={activePoint.yRecovered}
                                            r="5"
                                            fill="#10b981"
                                            stroke="#090d16"
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
                                    <div className="bg-[#0f172a]/95 border border-slate-700/80 backdrop-blur-xl px-4 py-3 rounded-xl shadow-2xl space-y-1 text-xs min-w-[140px]">
                                        <div className="text-[11px] font-mono text-slate-400 font-bold border-b border-slate-800 pb-1 mb-1">
                                            {activePoint.label ||
                                                activePoint.date}
                                        </div>

                                        <div className="flex items-center justify-between gap-3 text-amber-400 font-bold font-mono">
                                            <span>At Risk:</span>
                                            <span>
                                                {activePoint.atRiskLabel}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between gap-3 text-emerald-400 font-bold font-mono">
                                            <span>Recovered:</span>
                                            <span>
                                                {activePoint.recLabel}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 pt-2 px-4 border-t border-slate-800/80">
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