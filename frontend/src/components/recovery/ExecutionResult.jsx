import React, { useState } from "react";

import {
    Copy,
    ExternalLink,
    CheckCircle2,
    XCircle,
    Clock,
    Zap,
    UserCheck,
    AlertTriangle,
    RotateCcw,
    ShieldAlert
} from "lucide-react";

import { formatRecoveryAction } from "../../utils/statusHelpers";
import PaymentStatusBadge from "../payments/PaymentStatusBadge";
import { formatCurrency } from "../../utils/formatCurrency";


const getOutcomeExplanation = ({
    action,
    result,
    payment,
    executionResult
}) => {

    if (
        result === "recovered" ||
        result === "RECOVERED"
    ) {
        return {
            title: "Payment recovered successfully",
            description: `${
                payment.amount !== undefined
                    ? formatCurrency(payment.amount)
                    : "The payment"
            } was successfully recovered. The payment is no longer outstanding.`,
            icon: CheckCircle2,
            statusClass: "status-up"
        };
    }


    if (action === "CREATE_PAYMENT_LINK") {

        if (
            executionResult?.paymentLinkId ||
            executionResult?.paymentLinkUrl ||
            payment?.paymentLinkId ||
            payment?.paymentLinkUrl
        ) {
            return {
                title: "Alternative payment route created",
                description:
                    "The system created a payment link so the customer has another way to complete the payment. The money has not been recovered yet.",
                icon: Clock,
                statusClass: "status-warn"
            };
        }


        return {
            title: "Alternative payment route selected",
            description:
                "The system selected a payment link as the recovery method. The payment remains outstanding until the customer completes it.",
            icon: Clock,
            statusClass: "status-warn"
        };
    }


    if (action === "RETRY_PAYMENT") {

        if (
            result === "failed" ||
            result === "FAILED"
        ) {

            return {
                title: "Payment attempt was unsuccessful",
                description:
                    "The system made another payment attempt, but the gateway rejected it. The payment remains unrecovered.",
                icon: XCircle,
                statusClass: "status-down"
            };
        }


        return {
            title: "Payment attempt processed",
            description:
                "The system initiated another payment attempt. The latest payment state determines whether recovery was successful.",
            icon: RotateCcw,
            statusClass: "status-primary"
        };
    }


    if (action === "ESCALATE_TO_HUMAN") {

        return {
            title: "Payment sent for human review",
            description:
                "No additional automatic payment attempt was made. The payment was moved into a human-review workflow.",
            icon: UserCheck,
            statusClass: "status-primary"
        };
    }


    if (action === "STOP_RECOVERY") {

        return {
            title: "Automatic recovery stopped",
            description:
                "The system will not make another automatic payment attempt. The payment remains unrecovered.",
            icon: AlertTriangle,
            statusClass: "status-mute"
        };
    }


    return {
        title: "Recovery action processed",
        description:
            "The system processed the selected recovery action. The current payment state shows the resulting outcome.",
        icon: Zap,
        statusClass: "status-primary"
    };
};


export const ExecutionResult = ({
    executionResult = {},
    payment = {}
}) => {

    const [copied, setCopied] =
        useState(false);


    const actionExecuted =
        executionResult.actionExecuted ||
        executionResult.finalAction ||
        payment.recoveryAction;


    const resultStatus =
        executionResult.result ||
        executionResult.status ||
        payment.recoveryResult ||
        payment.status ||
        "pending";


    const linkUrl =
        actionExecuted ===
        "CREATE_PAYMENT_LINK"
            ? executionResult.paymentLinkUrl ||
              payment.paymentLinkUrl ||
              null
            : null;


    const outcome =
        getOutcomeExplanation({
            action: actionExecuted,
            result: resultStatus,
            payment,
            executionResult
        });


    const isRecovered =
        resultStatus === "recovered" ||
        resultStatus === "RECOVERED";

    const isPending =
        resultStatus === "pending" ||
        resultStatus === "PENDING";

    const isStopped =
        resultStatus === "stopped" ||
        resultStatus === "STOPPED";


    const handleCopy = async () => {

        if (!linkUrl) {
            return;
        }


        try {

            await navigator.clipboard.writeText(
                linkUrl
            );

            setCopied(true);

            setTimeout(() => {
                setCopied(false);
            }, 2000);

        } catch (error) {

            console.error(
                "Unable to copy payment link:",
                error
            );
        }
    };


    const OutcomeIcon =
        outcome.icon;


    const moneyStatusClass =
        isRecovered
            ? "status-up"
            : isPending
                ? "status-warn"
                : "status-down";


    const moneyStatusLabel =
        isRecovered
            ? "Money recovered"
            : isPending
                ? "Waiting for payment"
                : "Not recovered";


    /*
     * Retry information can come directly from
     * the executor / AgentRun action output.
     */
    const attemptsMade =
        executionResult.attemptsMade ??
        executionResult.attemptNumber ??
        null;


    const maxAttempts =
        executionResult.maxAttempts ??
        null;


    const attemptsRemaining =
        executionResult.attemptsRemaining ??
        null;


    return (
        <div
            className={`panel recovery-card ${
                isRecovered
                    ? "panel-accent-up"
                    : isStopped
                        ? "panel-accent-down"
                        : "panel-accent-primary"
            }`}
        >

            {/* =====================================================
                HEADER
            ===================================================== */}

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                    marginBottom: "1.25rem"
                }}
                className="sm:flex-row sm:items-center sm:justify-between"
            >

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem"
                    }}
                >

                    <div
                        className={`icon-box icon-box-md ${
                            isRecovered
                                ? "icon-box-up"
                                : "icon-box-primary"
                        }`}
                    >
                        <Zap
                            style={{
                                width: "1.25rem",
                                height: "1.25rem"
                            }}
                        />
                    </div>


                    <div>

                        <h4 className="recovery-card-title">
                            What the System Did
                        </h4>

                        <p className="recovery-card-subtitle">
                            The actual action taken after the safety checks
                        </p>

                    </div>

                </div>


                <PaymentStatusBadge
                    status={
                        isRecovered
                            ? "recovered"
                            : resultStatus
                    }
                />

            </div>


            {/* =====================================================
                ACTION TAKEN
            ===================================================== */}

            <div
                className="sub-card"
                style={{
                    marginBottom: "1.25rem"
                }}
            >

                <span
                    className="meta-label"
                    style={{
                        marginBottom: "0.25rem"
                    }}
                >
                    Action actually taken
                </span>


                <span
                    style={{
                        display: "block",
                        fontSize: "1rem",
                        fontWeight: 700,
                        color: "var(--ink)"
                    }}
                >
                    {actionExecuted
                        ? formatRecoveryAction(
                              actionExecuted
                          )
                        : "No recovery action recorded"}
                </span>

            </div>


            {/* =====================================================
                OUTCOME
            ===================================================== */}

            <div
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                    marginBottom: "1.25rem"
                }}
            >

                <div
                    style={{
                        flexShrink: 0,
                        marginTop: "0.125rem"
                    }}
                >

                    <OutcomeIcon
                        className={
                            outcome.statusClass
                        }
                        style={{
                            width: "1.25rem",
                            height: "1.25rem"
                        }}
                    />

                </div>


                <div>

                    <h5
                        style={{
                            fontSize: "0.8125rem",
                            fontWeight: 700,
                            color: "var(--ink)"
                        }}
                    >
                        {outcome.title}
                    </h5>


                    <p
                        className="recovery-card-body-text"
                        style={{
                            marginTop: "0.25rem"
                        }}
                    >
                        {outcome.description}
                    </p>

                </div>

            </div>


            {/* =====================================================
                RETRY PROGRESS
            ===================================================== */}

            {attemptsMade !== null && (
                <div
                    className="sub-card"
                    style={{
                        marginBottom: "1.25rem"
                    }}
                >

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            marginBottom: "0.75rem"
                        }}
                    >

                        <RotateCcw
                            size={14}
                            style={{
                                color: "var(--primary)"
                            }}
                        />

                        <span className="meta-label">
                            Recovery attempts
                        </span>

                    </div>


                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "0.75rem"
                        }}
                    >

                        <div>

                            <span
                                className="meta-label"
                                style={{
                                    display: "block"
                                }}
                            >
                                Attempts made
                            </span>

                            <strong
                                style={{
                                    display: "block",
                                    marginTop: "0.25rem",
                                    fontSize: "1rem",
                                    color: "var(--ink)"
                                }}
                            >
                                {attemptsMade}
                                {maxAttempts !== null
                                    ? ` / ${maxAttempts}`
                                    : ""}
                            </strong>

                        </div>


                        {attemptsRemaining !== null && (
                            <div>

                                <span
                                    className="meta-label"
                                    style={{
                                        display: "block"
                                    }}
                                >
                                    Remaining
                                </span>

                                <strong
                                    style={{
                                        display: "block",
                                        marginTop: "0.25rem",
                                        fontSize: "1rem",
                                        color:
                                            attemptsRemaining === 0
                                                ? "var(--down)"
                                                : "var(--ink)"
                                    }}
                                >
                                    {attemptsRemaining}
                                </strong>

                            </div>
                        )}

                    </div>


                    {attemptsRemaining === 0 && (
                        <div
                            style={{
                                marginTop: "0.75rem",
                                paddingTop: "0.75rem",
                                borderTop:
                                    "1px solid var(--line)",
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "0.5rem"
                            }}
                        >

                            <ShieldAlert
                                size={14}
                                style={{
                                    color: "var(--warn)",
                                    flexShrink: 0,
                                    marginTop: "0.125rem"
                                }}
                            />

                            <span
                                style={{
                                    fontSize: "0.75rem",
                                    lineHeight: 1.5,
                                    color: "var(--mute)"
                                }}
                            >
                                The permitted retry limit has been reached.
                                No additional automatic payment retry will be made.
                            </span>

                        </div>
                    )}

                </div>
            )}


            {/* =====================================================
                PAYMENT LINK
            ===================================================== */}

            {linkUrl && (
                <div
                    className="sub-card-primary"
                    style={{
                        marginBottom: "1.25rem"
                    }}
                >

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "0.75rem",
                            marginBottom: "0.5rem"
                        }}
                    >

                        <span className="eyebrow-primary">
                            Customer Payment Link
                        </span>


                        <button
                            type="button"
                            onClick={handleCopy}
                            className="back-link"
                            style={{
                                fontSize: "0.75rem"
                            }}
                        >

                            {copied ? (
                                <CheckCircle2
                                    className="status-up"
                                    style={{
                                        width: "0.875rem",
                                        height: "0.875rem"
                                    }}
                                />
                            ) : (
                                <Copy
                                    style={{
                                        width: "0.875rem",
                                        height: "0.875rem"
                                    }}
                                />
                            )}

                            <span>
                                {copied
                                    ? "Copied!"
                                    : "Copy Link"}
                            </span>

                        </button>

                    </div>


                    <div
                        className="sub-card"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            padding: "0.625rem"
                        }}
                    >

                        <span
                            className="font-mono"
                            style={{
                                fontSize: "0.75rem",
                                color: "var(--ink)",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                flex: 1
                            }}
                        >
                            {linkUrl}
                        </span>


                        <a
                            href={linkUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="status-primary"
                            style={{
                                padding: "0.25rem",
                                flexShrink: 0
                            }}
                            aria-label="Open payment link"
                        >
                            <ExternalLink
                                style={{
                                    width: "0.875rem",
                                    height: "0.875rem"
                                }}
                            />
                        </a>

                    </div>

                </div>
            )}


            {/* =====================================================
                MONEY STATE
            ===================================================== */}

            <div
                style={{
                    paddingTop: "1rem",
                    borderTop:
                        "1px solid var(--line)"
                }}
            >

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "1rem"
                    }}
                >

                    <span
                        style={{
                            fontSize: "0.75rem",
                            color: "var(--mute)"
                        }}
                    >
                        Money recovery status
                    </span>


                    <span
                        className={moneyStatusClass}
                        style={{
                            fontSize: "0.75rem",
                            fontWeight: 700
                        }}
                    >
                        {moneyStatusLabel}
                    </span>

                </div>

            </div>

        </div>
    );
};


export default ExecutionResult;