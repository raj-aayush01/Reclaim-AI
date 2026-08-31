import React, { useEffect, useState } from "react";
import {
    Activity,
    CheckCircle2,
    ShieldAlert,
    AlertOctagon,
    Bot,
    ArrowUpRight,
    X,
    Eye,
    Clock,
    Zap
} from "lucide-react";
import AnimatedNumber from "../components/common/AnimatedNumber";
import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";
import {
    getControlRoom,
    getAgentRun
} from "../services/agentService";

const getActionLabel = (action) => {
    const labels = {
        RETRY_PAYMENT: "Retry payment",
        CREATE_PAYMENT_LINK: "Create payment link",
        ESCALATE_TO_HUMAN: "Escalate to human",
        STOP_RECOVERY: "Stop recovery"
    };

    return labels[action] || action || "No action";
};

const getStatusClass = (status) => {
    if (
        status === "RECOVERED" ||
        status === "APPROVED"
    ) {
        return "badge-up";
    }

    if (
        status === "ESCALATED" ||
        status === "BLOCKED" ||
        status === "STOPPED"
    ) {
        return "badge-down";
    }

    return "badge-primary";
};

const getStatusLabel = (status) => {
    const labels = {
        RECOVERED: "Recovered",
        ESCALATED: "Human review",
        BLOCKED: "Blocked",
        STOPPED: "Stopped",
        FAILED: "Failed",
        RUNNING: "In progress",
        COMPLETED: "Completed",
        PENDING: "Pending",
        MAX_STEPS_REACHED: "Stopped safely"
    };

    return labels[status] || status || "Unknown";
};

const getDecisionExplanation = (run) => {
    const decisionStep = run.steps?.find(
        (step) => step.type === "DECISION"
    );

    const policyStep = run.steps?.find(
        (step) => step.type === "POLICY"
    );

    const resultStep = run.steps?.find(
        (step) => step.type === "RESULT"
    );

    const action =
        decisionStep?.output?.action ||
        policyStep?.output?.finalAction ||
        null;

    if (action === "RETRY_PAYMENT") {
        return "The payment showed signs of a temporary problem, so the agent recommended trying the payment again.";
    }

    if (action === "CREATE_PAYMENT_LINK") {
        return "The original payment method was not successful, so the agent recommended offering the customer another way to pay.";
    }

    if (action === "ESCALATE_TO_HUMAN") {
        return "The case was considered too risky or uncertain for automatic recovery, so it was sent for human review.";
    }

    if (action === "STOP_RECOVERY") {
        return "The agent determined that continuing recovery was not safe or useful, so further attempts were stopped.";
    }

    if (resultStep?.reason) {
        return resultStep.reason;
    }

    return "The agent completed its assessment of the payment.";
};

const getPolicyExplanation = (run) => {
    const policyStep = run.steps?.find(
        (step) => step.type === "POLICY"
    );

    if (policyStep) {
        if (policyStep.output?.allowed === true) {
            return (
                policyStep.reason ||
                "The recommended recovery action passed the configured safety rules."
            );
        }

        if (policyStep.output?.allowed === false) {
            return (
                policyStep.reason ||
                "The recommended recovery action was blocked by the configured safety rules."
            );
        }

        return (
            policyStep.reason ||
            "The recovery policy was evaluated before execution."
        );
    }

    const action = getRunAction(run);

    if (
        run.status === "STOPPED" ||
        action === "STOP_RECOVERY"
    ) {
        return "Recovery was stopped because the configured retry or safety limits did not allow another attempt.";
    }

    if (run.status === "BLOCKED") {
        return "The recovery action was blocked by the configured recovery policy.";
    }

    if (run.status === "ESCALATED") {
        return "The case was sent for human review because automatic recovery was not permitted.";
    }

    if (run.status === "RECOVERED") {
        return "The recovery recommendation was allowed and the payment was successfully recovered.";
    }

    return "The recovery policy was applied before the agent proceeded with the recovery process.";
};

const getActionExplanation = (run) => {
    const actionStep = run.steps?.find(
        (step) => step.type === "ACTION"
    );

    if (!actionStep) {
        if (
            run.status === "STOPPED" ||
            run.status === "BLOCKED"
        ) {
            return "No recovery action was executed.";
        }

        if (run.status === "ESCALATED") {
            return "No automatic recovery action was executed because the case requires human review.";
        }

        return "No recovery action was recorded.";
    }

    if (actionStep.output?.message) {
        return actionStep.output.message;
    }

    if (actionStep.output?.success === true) {
        return "The recommended recovery action was executed successfully.";
    }

    return "The recovery action was executed by the agent.";
};

const getResultExplanation = (run) => {
    const resultStep = run.steps?.find(
        (step) => step.type === "RESULT"
    );

    if (resultStep?.reason) {
        return resultStep.reason;
    }

    if (run.status === "RECOVERED") {
        return "The payment was successfully recovered.";
    }

    if (run.status === "ESCALATED") {
        return "The case was safely handed over for human review.";
    }

    if (run.status === "BLOCKED") {
        return "The recovery action was blocked by policy.";
    }

    if (run.status === "STOPPED") {
        return "Recovery was stopped according to the configured recovery policy.";
    }

    if (run.status === "FAILED") {
        return "The recovery process did not complete successfully.";
    }

    return "The agent completed its assessment.";
};

const formatDate = (date) => {
    if (!date) {
        return "—";
    }

    return new Date(date).toLocaleString();
};

const getRunConfidence = (run) => {
    const decisionStep = run.steps?.find(
        (step) => step.type === "DECISION"
    );

    return decisionStep?.confidence ?? null;
};

const getRunAction = (run) => {
    const decisionStep = run.steps?.find(
        (step) => step.type === "DECISION"
    );

    const policyStep = run.steps?.find(
        (step) => step.type === "POLICY"
    );

    return (
        decisionStep?.output?.action ||
        policyStep?.output?.finalAction ||
        null
    );
};

const DetailRow = ({ label, children }) => {
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "1rem",
                padding: "0.7rem 0",
                borderBottom: "1px solid var(--line)"
            }}
        >
            <span
                style={{
                    fontSize: "0.6875rem",
                    color: "var(--mute)",
                    flexShrink: 0
                }}
            >
                {label}
            </span>

            <span
                style={{
                    fontSize: "0.75rem",
                    color: "var(--ink)",
                    textAlign: "right"
                }}
            >
                {children}
            </span>
        </div>
    );
};

const FlowStep = ({
    number,
    title,
    label,
    description,
    icon: Icon,
    last = false
}) => {
    return (
        <div
            style={{
                display: "flex",
                gap: "0.875rem",
                position: "relative"
            }}
        >
            {!last && (
                <div
                    style={{
                        position: "absolute",
                        left: "14px",
                        top: "32px",
                        bottom: "-14px",
                        width: "1px",
                        background: "var(--line)"
                    }}
                />
            )}

            <div
                style={{
                    width: "29px",
                    height: "29px",
                    borderRadius: "9999px",
                    background: "var(--primary-soft)",
                    border: "1px solid var(--primary-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--primary)",
                    flexShrink: 0,
                    position: "relative",
                    zIndex: 1
                }}
            >
                <Icon size={14} />
            </div>

            <div
                style={{
                    paddingBottom: last ? 0 : "1.25rem",
                    flex: 1
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem"
                    }}
                >
                    <span
                        style={{
                            fontSize: "0.8125rem",
                            fontWeight: 700,
                            color: "var(--ink)"
                        }}
                    >
                        {number}. {title}
                    </span>

                    <span
                        className="eyebrow"
                        style={{
                            fontSize: "0.5625rem"
                        }}
                    >
                        {label}
                    </span>
                </div>

                <p
                    style={{
                        marginTop: "0.3rem",
                        fontSize: "0.6875rem",
                        lineHeight: 1.55,
                        color: "var(--mute)"
                    }}
                >
                    {description}
                </p>
            </div>
        </div>
    );
};

export const AgentControlRoom = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedRun, setSelectedRun] = useState(null);
    const [runLoading, setRunLoading] = useState(false);
    const [runError, setRunError] = useState(null);

    const fetchControlRoom = async () => {
        try {
            setLoading(true);
            setError(null);

            const result = await getControlRoom();
            setData(result);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchControlRoom();
    }, []);

    const inspectRun = async (paymentId) => {
        try {
            setRunLoading(true);
            setRunError(null);

            const result = await getAgentRun(paymentId);

            setSelectedRun(result?.run || null);
        } catch (err) {
            setRunError(err.message);
        } finally {
            setRunLoading(false);
        }
    };

    const closeInspector = () => {
        setSelectedRun(null);
        setRunError(null);
    };

    useEffect(() => {
        if (!selectedRun) {
            return;
        }

        const previousOverflow = document.body.style.overflow;

        document.body.style.overflow = "hidden";

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                closeInspector();
            }
        };

        document.addEventListener(
            "keydown",
            handleKeyDown
        );

        return () => {
            document.body.style.overflow = previousOverflow;

            document.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };
    }, [selectedRun]);

    if (loading && !data) {
        return (
            <Loader
                fullPage
                text="Loading AI control room..."
            />
        );
    }

    if (error && !data) {
        return (
            <ErrorMessage
                message={error}
                onRetry={fetchControlRoom}
            />
        );
    }

    const agent = data?.agent || {};
    const summary = data?.summary || {};
    const decisions = data?.recentRuns || [];

    const evaluated = summary.evaluated || 0;
    const recovered = summary.recovered || 0;
    const escalated = summary.escalated || 0;
    const blocked = summary.blocked || 0;
    const stopped = summary.stopped || 0;
    const failed = summary.failed || 0;

    const recoveryRate =
        evaluated > 0
            ? (recovered / evaluated) * 100
            : 0;

    return (
        <>
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.5rem"
                }}
                className="animate-rise"
            >
                <div>
                    <span
                        className="eyebrow-primary"
                        style={{
                            display: "block",
                            marginBottom: "4px"
                        }}
                    >
                        Agent Control Room
                    </span>

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "1rem"
                        }}
                    >
                        <div>
                            <h1
                                style={{
                                    fontSize: "1.375rem",
                                    fontWeight: 700,
                                    color: "var(--ink)",
                                    letterSpacing: "-0.025em"
                                }}
                            >
                                AI Recovery Operations
                            </h1>

                            <p
                                style={{
                                    marginTop: "0.35rem",
                                    fontSize: "0.75rem",
                                    color: "var(--mute)"
                                }}
                            >
                                Monitor how the recovery agent makes
                                decisions, follows policy, and handles
                                failed payments.
                            </p>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem"
                            }}
                        >
                            <span
                                className="animate-blip"
                                style={{
                                    width: "7px",
                                    height: "7px",
                                    borderRadius: "9999px",
                                    background: "var(--up)",
                                    display: "inline-block"
                                }}
                            />

                            <span
                                style={{
                                    fontSize: "0.6875rem",
                                    color: "var(--up)",
                                    fontFamily:
                                        "'JetBrains Mono', monospace",
                                    fontWeight: 600
                                }}
                            >
                                AGENT {agent.status || "ONLINE"}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="panel panel-accent-primary p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="eyebrow">
                                Payments Evaluated
                            </span>

                            <div className="icon-box icon-box-sm icon-box-primary">
                                <Activity size={14} />
                            </div>
                        </div>

                        <div
                            style={{
                                fontSize: "1.875rem",
                                fontWeight: 700,
                                fontFamily:
                                    "'JetBrains Mono', monospace",
                                color: "var(--primary)"
                            }}
                        >
                            <AnimatedNumber
                                value={evaluated}
                                decimals={0}
                            />
                        </div>

                        <div
                            style={{
                                fontSize: "0.75rem",
                                color: "var(--mute)"
                            }}
                        >
                            reviewed by the agent
                        </div>
                    </div>

                    <div className="panel panel-accent-up p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="eyebrow">
                                Payments Recovered
                            </span>

                            <div className="icon-box icon-box-sm icon-box-up">
                                <CheckCircle2 size={14} />
                            </div>
                        </div>

                        <div
                            style={{
                                fontSize: "1.875rem",
                                fontWeight: 700,
                                fontFamily:
                                    "'JetBrains Mono', monospace",
                                color: "var(--up)"
                            }}
                        >
                            <AnimatedNumber
                                value={recovered}
                                decimals={0}
                            />
                        </div>

                        <div
                            style={{
                                fontSize: "0.75rem",
                                color: "var(--mute)"
                            }}
                        >
                            successfully recovered
                        </div>
                    </div>

                    <div className="panel panel-accent-warn p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="eyebrow">
                                Human Review
                            </span>

                            <div className="icon-box icon-box-sm icon-box-warn">
                                <ShieldAlert size={14} />
                            </div>
                        </div>

                        <div
                            style={{
                                fontSize: "1.875rem",
                                fontWeight: 700,
                                fontFamily:
                                    "'JetBrains Mono', monospace",
                                color: "var(--warn)"
                            }}
                        >
                            <AnimatedNumber
                                value={escalated}
                                decimals={0}
                            />
                        </div>

                        <div
                            style={{
                                fontSize: "0.75rem",
                                color: "var(--mute)"
                            }}
                        >
                            cases escalated safely
                        </div>
                    </div>

                    <div className="panel panel-accent-down p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="eyebrow">
                                Recovery Rate
                            </span>

                            <div className="icon-box icon-box-sm icon-box-down">
                                <ArrowUpRight size={14} />
                            </div>
                        </div>

                        <div
                            style={{
                                fontSize: "1.875rem",
                                fontWeight: 700,
                                fontFamily:
                                    "'JetBrains Mono', monospace",
                                color: "var(--primary)"
                            }}
                        >
                            <AnimatedNumber
                                value={recoveryRate}
                                decimals={1}
                                suffix="%"
                            />
                        </div>

                        <div
                            style={{
                                fontSize: "0.75rem",
                                color: "var(--mute)"
                            }}
                        >
                            successful recoveries
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className="lg:col-span-2 panel p-5">
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: "1.25rem"
                            }}
                        >
                            <div>
                                <span className="eyebrow-primary">
                                    Agent Activity
                                </span>

                                <h2
                                    style={{
                                        marginTop: "0.25rem",
                                        fontSize: "1rem",
                                        fontWeight: 700,
                                        color: "var(--ink)"
                                    }}
                                >
                                    Recent AI Decisions
                                </h2>
                            </div>

                            <Bot
                                size={18}
                                color="var(--primary)"
                            />
                        </div>

                        {decisions.length === 0 ? (
                            <div
                                style={{
                                    padding: "2rem 0",
                                    textAlign: "center",
                                    fontSize: "0.75rem",
                                    color: "var(--mute)"
                                }}
                            >
                                No recent agent decisions.
                            </div>
                        ) : (
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column"
                                }}
                            >
                                {decisions.map((run, index) => {
                                    const action =
                                        run.decision?.action ||
                                        run.policy?.action ||
                                        null;

                                    const reason =
                                        run.decision?.reason ||
                                        run.policy?.reason ||
                                        run.result?.reason ||
                                        "Agent completed its assessment.";

                                    const confidence =
                                        run.decision?.confidence;

                                    return (
                                        <div
                                            key={
                                                run.runId ||
                                                run.paymentId ||
                                                index
                                            }
                                            style={{
                                                padding: "0.875rem 0",
                                                borderBottom:
                                                    index ===
                                                    decisions.length - 1
                                                        ? "none"
                                                        : "1px solid var(--line)"
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent:
                                                        "space-between",
                                                    gap: "1rem"
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        minWidth: 0,
                                                        flex: 1
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            gap: "0.5rem",
                                                            flexWrap: "wrap"
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                fontSize:
                                                                    "0.75rem",
                                                                fontFamily:
                                                                    "'JetBrains Mono', monospace",
                                                                color:
                                                                    "var(--primary)"
                                                            }}
                                                        >
                                                            {run.paymentId ||
                                                                "Payment"}
                                                        </span>

                                                        {run.status && (
                                                            <span
                                                                className={getStatusClass(
                                                                    run.status
                                                                )}
                                                                style={{
                                                                    fontSize:
                                                                        "0.625rem"
                                                                }}
                                                            >
                                                                {getStatusLabel(
                                                                    run.status
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div
                                                        style={{
                                                            marginTop:
                                                                "0.4rem",
                                                            fontSize:
                                                                "0.8125rem",
                                                            fontWeight: 600,
                                                            color:
                                                                "var(--ink)"
                                                        }}
                                                    >
                                                        {getActionLabel(
                                                            action
                                                        )}
                                                    </div>

                                                    <div
                                                        style={{
                                                            marginTop:
                                                                "0.25rem",
                                                            fontSize:
                                                                "0.6875rem",
                                                            color:
                                                                "var(--mute)",
                                                            lineHeight: 1.5
                                                        }}
                                                    >
                                                        {reason}
                                                    </div>

                                                    {run.policy?.allowed !==
                                                        null &&
                                                        run.policy?.allowed !==
                                                            undefined && (
                                                            <div
                                                                style={{
                                                                    marginTop:
                                                                        "0.35rem",
                                                                    fontSize:
                                                                        "0.625rem",
                                                                    color:
                                                                        run
                                                                            .policy
                                                                            .allowed
                                                                            ? "var(--up)"
                                                                            : "var(--down)",
                                                                    fontFamily:
                                                                        "'JetBrains Mono', monospace"
                                                                }}
                                                            >
                                                                {run.policy
                                                                    .allowed
                                                                    ? "Policy approved"
                                                                    : "Policy blocked"}
                                                            </div>
                                                        )}
                                                </div>

                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems:
                                                            "center",
                                                        gap: "0.75rem",
                                                        flexShrink: 0
                                                    }}
                                                >
                                                    {confidence != null && (
                                                        <div
                                                            style={{
                                                                textAlign:
                                                                    "right"
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    fontSize:
                                                                        "0.875rem",
                                                                    fontWeight: 700,
                                                                    fontFamily:
                                                                        "'JetBrains Mono', monospace",
                                                                    color:
                                                                        "var(--primary)"
                                                                }}
                                                            >
                                                                {Math.round(
                                                                    confidence *
                                                                        100
                                                                )}
                                                                %
                                                            </div>

                                                            <div
                                                                style={{
                                                                    fontSize:
                                                                        "0.625rem",
                                                                    color:
                                                                        "var(--mute)"
                                                                }}
                                                            >
                                                                confidence
                                                            </div>
                                                        </div>
                                                    )}

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            inspectRun(
                                                                run.paymentId
                                                            )
                                                        }
                                                        style={{
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            gap: "0.35rem",
                                                            padding:
                                                                "0.4rem 0.6rem",
                                                            borderRadius:
                                                                "0.375rem",
                                                            border:
                                                                "1px solid var(--line)",
                                                            background:
                                                                "var(--surface-solid)",
                                                            color:
                                                                "var(--primary)",
                                                            fontSize:
                                                                "0.625rem",
                                                            fontWeight: 600,
                                                            cursor: "pointer"
                                                        }}
                                                    >
                                                        <Eye size={12} />
                                                        Inspect
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="panel p-5">
                        <div style={{ marginBottom: "1.25rem" }}>
                            <span className="eyebrow-primary">
                                Policy Control
                            </span>

                            <h2
                                style={{
                                    marginTop: "0.25rem",
                                    fontSize: "1rem",
                                    fontWeight: 700,
                                    color: "var(--ink)"
                                }}
                            >
                                Agent Outcomes
                            </h2>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.875rem"
                            }}
                        >
                            <DetailRow label="Recovered">
                                <strong
                                    style={{
                                        color: "var(--up)",
                                        fontFamily:
                                            "'JetBrains Mono', monospace"
                                    }}
                                >
                                    {recovered}
                                </strong>
                            </DetailRow>

                            <DetailRow label="Escalated">
                                <strong
                                    style={{
                                        color: "var(--warn)",
                                        fontFamily:
                                            "'JetBrains Mono', monospace"
                                    }}
                                >
                                    {escalated}
                                </strong>
                            </DetailRow>

                            <DetailRow label="Blocked">
                                <strong
                                    style={{
                                        color: "var(--down)",
                                        fontFamily:
                                            "'JetBrains Mono', monospace"
                                    }}
                                >
                                    {blocked}
                                </strong>
                            </DetailRow>

                            <DetailRow label="Stopped">
                                <strong
                                    style={{
                                        color: "var(--down)",
                                        fontFamily:
                                            "'JetBrains Mono', monospace"
                                    }}
                                >
                                    {stopped}
                                </strong>
                            </DetailRow>

                            <DetailRow label="Failed runs">
                                <strong
                                    style={{
                                        color: "var(--down)",
                                        fontFamily:
                                            "'JetBrains Mono', monospace"
                                    }}
                                >
                                    {failed}
                                </strong>
                            </DetailRow>
                        </div>

                        <div
                            style={{
                                marginTop: "1.5rem",
                                padding: "0.875rem",
                                borderRadius: "var(--radius-sm)",
                                background:
                                    "var(--primary-soft)",
                                border:
                                    "1px solid var(--primary-border)"
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    gap: "0.5rem",
                                    alignItems: "flex-start"
                                }}
                            >
                                <ShieldAlert
                                    size={15}
                                    color="var(--primary)"
                                />

                                <span
                                    style={{
                                        fontSize: "0.6875rem",
                                        lineHeight: 1.5,
                                        color: "var(--mute)"
                                    }}
                                >
                                    The agent operates within
                                    predefined recovery policies.
                                    High-risk or uncertain cases
                                    are sent for human review.
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="panel panel-accent-down p-4">
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.625rem"
                        }}
                    >
                        <AlertOctagon
                            size={16}
                            color="var(--down)"
                        />

                        <span
                            style={{
                                fontSize: "0.75rem",
                                color: "var(--ink)"
                            }}
                        >
                            <strong>
                                {escalated + blocked}
                            </strong>{" "}
                            cases currently require attention or
                            were stopped by recovery policy.
                        </span>
                    </div>
                </div>
            </div>

            {selectedRun && (
                <div
                    onClick={closeInspector}
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 100,
                        background: "rgba(0, 0, 0, 0.45)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "1.5rem",
                        overflow: "hidden"
                    }}
                >
                    <div
                        onClick={(event) => event.stopPropagation()}
                        style={{
                            width: "100%",
                            maxWidth: "720px",
                            maxHeight: "90vh",
                            overflowY: "auto",
                            overscrollBehavior: "contain",
                            background: "var(--surface-solid)",
                            opacity: 1,
                            border: "1px solid var(--line)",
                            borderRadius: "0.75rem",
                            boxShadow:
                                "0 24px 70px rgba(0, 0, 0, 0.25)"
                        }}
                    >
                        <div
                            style={{
                                padding: "1.25rem 1.5rem",
                                borderBottom:
                                    "1px solid var(--line)",
                                display: "flex",
                                alignItems: "flex-start",
                                justifyContent: "space-between",
                                gap: "1rem"
                            }}
                        >
                            <div>
                                <span className="eyebrow-primary">
                                    Recovery Inspection
                                </span>

                                <h2
                                    style={{
                                        marginTop: "0.3rem",
                                        fontSize: "1.125rem",
                                        fontWeight: 700,
                                        color: "var(--ink)"
                                    }}
                                >
                                    AI Recovery Decision
                                </h2>

                                <div
                                    style={{
                                        marginTop: "0.35rem",
                                        fontSize: "0.6875rem",
                                        color: "var(--primary)",
                                        fontFamily:
                                            "'JetBrains Mono', monospace",
                                        wordBreak: "break-all"
                                    }}
                                >
                                    {selectedRun.paymentId}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={closeInspector}
                                aria-label="Close inspection"
                                style={{
                                    width: "2rem",
                                    height: "2rem",
                                    borderRadius: "0.4rem",
                                    border:
                                        "1px solid var(--line)",
                                    background:
                                        "var(--surface-solid)",
                                    color: "var(--mute)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    flexShrink: 0
                                }}
                            >
                                <X size={15} />
                            </button>
                        </div>

                        {runLoading ? (
                            <div
                                style={{
                                    padding: "3rem",
                                    display: "flex",
                                    justifyContent: "center"
                                }}
                            >
                                <Loader text="Loading recovery details..." />
                            </div>
                        ) : runError ? (
                            <div
                                style={{
                                    padding: "2rem",
                                    textAlign: "center"
                                }}
                            >
                                <ErrorMessage
                                    message={runError}
                                    onRetry={() =>
                                        inspectRun(
                                            selectedRun.paymentId
                                        )
                                    }
                                />
                            </div>
                        ) : (
                            <>
                                <div
                                    style={{
                                        padding: "1.25rem 1.5rem",
                                        display: "grid",
                                        gridTemplateColumns:
                                            "repeat(3, minmax(0, 1fr))",
                                        gap: "0.75rem"
                                    }}
                                >
                                    <div
                                        style={{
                                            padding: "0.8rem",
                                            borderRadius:
                                                "0.5rem",
                                            background:
                                                "var(--surface-solid)",
                                            border:
                                                "1px solid var(--line)"
                                        }}
                                    >
                                        <span className="eyebrow">
                                            Outcome
                                        </span>

                                        <div
                                            style={{
                                                marginTop:
                                                    "0.3rem",
                                                fontSize:
                                                    "0.8125rem",
                                                fontWeight: 700,
                                                color:
                                                    "var(--ink)"
                                            }}
                                        >
                                            {getStatusLabel(
                                                selectedRun.status
                                            )}
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            padding: "0.8rem",
                                            borderRadius:
                                                "0.5rem",
                                            background:
                                                "var(--surface-solid)",
                                            border:
                                                "1px solid var(--line)"
                                        }}
                                    >
                                        <span className="eyebrow">
                                            Recommendation
                                        </span>

                                        <div
                                            style={{
                                                marginTop:
                                                    "0.3rem",
                                                fontSize:
                                                    "0.8125rem",
                                                fontWeight: 700,
                                                color:
                                                    "var(--primary)"
                                            }}
                                        >
                                            {getActionLabel(
                                                getRunAction(
                                                    selectedRun
                                                )
                                            )}
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            padding: "0.8rem",
                                            borderRadius:
                                                "0.5rem",
                                            background:
                                                "var(--surface-solid)",
                                            border:
                                                "1px solid var(--line)"
                                        }}
                                    >
                                        <span className="eyebrow">
                                            Confidence
                                        </span>

                                        <div
                                            style={{
                                                marginTop:
                                                    "0.3rem",
                                                fontSize:
                                                    "0.8125rem",
                                                fontWeight: 700,
                                                color:
                                                    "var(--primary)",
                                                fontFamily:
                                                    "'JetBrains Mono', monospace"
                                            }}
                                        >
                                            {getRunConfidence(
                                                selectedRun
                                            ) != null
                                                ? `${Math.round(
                                                      getRunConfidence(
                                                          selectedRun
                                                      ) * 100
                                                  )}%`
                                                : "—"}
                                        </div>
                                    </div>
                                </div>

                                <div
                                    style={{
                                        margin:
                                            "0 1.5rem 1.25rem",
                                        padding: "1rem",
                                        borderRadius:
                                            "0.5rem",
                                        background:
                                            "var(--primary-soft)",
                                        border:
                                            "1px solid var(--primary-border)"
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize:
                                                "0.625rem",
                                            fontWeight: 700,
                                            color:
                                                "var(--primary)",
                                            fontFamily:
                                                "'JetBrains Mono', monospace",
                                            textTransform:
                                                "uppercase",
                                            letterSpacing:
                                                "0.08em"
                                        }}
                                    >
                                        What happened
                                    </div>

                                    <p
                                        style={{
                                            marginTop:
                                                "0.4rem",
                                            fontSize:
                                                "0.75rem",
                                            lineHeight: 1.6,
                                            color:
                                                "var(--ink)"
                                        }}
                                    >
                                        {getDecisionExplanation(
                                            selectedRun
                                        )}
                                    </p>
                                </div>

                                <div
                                    style={{
                                        padding:
                                            "0 1.5rem 1.5rem"
                                    }}
                                >
                                    <span
                                        className="eyebrow-primary"
                                        style={{
                                            display: "block",
                                            marginBottom:
                                                "1rem"
                                        }}
                                    >
                                        Recovery Flow
                                    </span>

                                    <FlowStep
                                        number="1"
                                        title="Assessment"
                                        label="AGENT"
                                        icon={Bot}
                                        description={getDecisionExplanation(
                                            selectedRun
                                        )}
                                    />

                                    <FlowStep
                                        number="2"
                                        title="Safety check"
                                        label="POLICY"
                                        icon={ShieldAlert}
                                        description={getPolicyExplanation(
                                            selectedRun
                                        )}
                                    />

                                    <FlowStep
                                        number="3"
                                        title="Recovery action"
                                        label="ACTION"
                                        icon={Zap}
                                        description={getActionExplanation(
                                            selectedRun
                                        )}
                                    />

                                    <FlowStep
                                        number="4"
                                        title="Final result"
                                        label="RESULT"
                                        icon={CheckCircle2}
                                        description={getResultExplanation(
                                            selectedRun
                                        )}
                                        last
                                    />
                                </div>

                                <div
                                    style={{
                                        margin:
                                            "0 1.5rem 1.5rem",
                                        padding:
                                            "0.75rem 1rem",
                                        borderTop:
                                            "1px solid var(--line)",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.5rem",
                                        color: "var(--mute)"
                                    }}
                                >
                                    <Clock size={13} />

                                    <span
                                        style={{
                                            fontSize:
                                                "0.625rem"
                                        }}
                                    >
                                        Started{" "}
                                        {formatDate(
                                            selectedRun.startedAt
                                        )}

                                        {selectedRun.completedAt
                                            ? ` · Completed ${formatDate(
                                                  selectedRun.completedAt
                                              )}`
                                            : ""}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default AgentControlRoom;