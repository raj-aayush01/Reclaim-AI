import React, { useState } from "react";
import {
    Copy,
    ExternalLink,
    CheckCircle2,
    XCircle,
    Clock,
    Zap,
    UserCheck,
    AlertTriangle
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
    if (result === "recovered") {
        return {
            title: "Payment recovered successfully",
            description: `${
                payment.amount !== undefined
                    ? formatCurrency(payment.amount)
                    : "The payment"
            } has been successfully recovered. The money is no longer at risk.`,
            icon: CheckCircle2,
            statusClass: "status-up"
        };
    }

    if (action === "CREATE_PAYMENT_LINK") {
        if (
            executionResult?.paymentLinkId ||
            executionResult?.paymentLinkUrl
        ) {
            return {
                title: "Payment link created",
                description:
                    "The customer now has another way to complete the payment. The money has not been recovered yet because the customer still needs to pay.",
                icon: Clock,
                statusClass: "status-warn"
            };
        }

        return {
            title: "Payment link recovery selected",
            description:
                "The system selected a payment link as the recovery method. The payment remains unrecovered until the customer completes it.",
            icon: Clock,
            statusClass: "status-warn"
        };
    }

    if (action === "RETRY_PAYMENT") {
        if (result === "failed" || result === "FAILED") {
            return {
                title: "Retry did not recover the payment",
                description:
                    "The additional payment attempt was unsuccessful. The payment remains unrecovered and can only continue through another permitted recovery path.",
                icon: XCircle,
                statusClass: "status-down"
            };
        }

        return {
            title: "Payment retry processed",
            description:
                "The system made another payment attempt. The current payment status determines whether the money was recovered.",
            icon: Zap,
            statusClass: "status-primary"
        };
    }

    if (action === "ESCALATE_TO_HUMAN") {
        return {
            title: "Payment sent for human review",
            description:
                "No automatic payment attempt was made. The payment has been moved to a human-review workflow.",
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
            "The recovery system processed the selected action. The current payment status shows the resulting state.",
        icon: Zap,
        statusClass: "status-primary"
    };
};

export const ExecutionResult = ({
    executionResult = {},
    payment = {}
}) => {
    const [copied, setCopied] = useState(false);

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
        actionExecuted === "CREATE_PAYMENT_LINK"
            ? executionResult.paymentLinkUrl ||
              payment.paymentLinkUrl ||
              null
            : null;

    const outcome = getOutcomeExplanation({
        action: actionExecuted,
        result: resultStatus,
        payment,
        executionResult
    });

    const handleCopy = async () => {
        if (!linkUrl) {
            return;
        }

        try {
            await navigator.clipboard.writeText(linkUrl);

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

    const isRecovered =
        resultStatus === "recovered" ||
        resultStatus === "RECOVERED";

    const OutcomeIcon = outcome.icon;

    const moneyStatusClass = isRecovered
        ? "status-up"
        : resultStatus === "pending" || resultStatus === "PENDING"
            ? "status-warn"
            : "status-down";

    const moneyStatusLabel = isRecovered
        ? "Money recovered"
        : resultStatus === "pending" || resultStatus === "PENDING"
            ? "Waiting for payment"
            : "Not recovered";

    return (
        <div
            className={`panel recovery-card ${
                isRecovered
                    ? "panel-accent-up"
                    : "panel-accent-primary"
            }`}
        >
            {/* Header */}
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
                            Recovery Outcome
                        </h4>

                        <p className="recovery-card-subtitle">
                            What the system actually did
                        </p>
                    </div>
                </div>

                <PaymentStatusBadge
                    status={resultStatus}
                />
            </div>

            {/* Action */}
            <div
                className="sub-card"
                style={{ marginBottom: "1.25rem" }}
            >
                <span
                    className="meta-label"
                    style={{ marginBottom: "0.25rem" }}
                >
                    Action Taken
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
                        ? formatRecoveryAction(actionExecuted)
                        : "No recovery action recorded"}
                </span>
            </div>

            {/* Outcome */}
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
                        className={outcome.statusClass}
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
                        style={{ marginTop: "0.25rem" }}
                    >
                        {outcome.description}
                    </p>
                </div>
            </div>

            {/* Payment link */}
            {linkUrl && (
                <div
                    className="sub-card-primary"
                    style={{ marginBottom: "1.25rem" }}
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
                            style={{ fontSize: "0.75rem" }}
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

            {/* Money state */}
            <div
                style={{
                    paddingTop: "1rem",
                    borderTop: "1px solid var(--line)"
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