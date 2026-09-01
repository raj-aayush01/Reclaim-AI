import React from "react";
import {
    ShieldCheck,
    ShieldAlert,
    CheckCircle2,
    XCircle
} from "lucide-react";

import { formatRecoveryAction } from "../../utils/statusHelpers";


const getPolicyExplanation = ({
    allowed,
    action,
    originalAction,
    payment
}) => {

    /*
     * -------------------------------------------------------
     * AI RECOMMENDATION WAS OVERRIDDEN
     * -------------------------------------------------------
     */

    if (!allowed) {

        if (
            originalAction &&
            action &&
            originalAction !== action
        ) {

            if (payment?.attemptCount >= 3) {
                return (
                    `The AI recommended ${formatRecoveryAction(
                        originalAction
                    )}, but the safety policy overrode that recommendation because this payment had already reached the maximum of 3 permitted retry attempts.`
                );
            }

            return (
                `The AI recommended ${formatRecoveryAction(
                    originalAction
                )}, but the safety policy did not allow that action. The system therefore selected ${formatRecoveryAction(
                    action
                )} as the safer recovery action.`
            );
        }


        if (payment?.attemptCount >= 3) {
            return (
                "The recovery policy prevented another automatic retry because this payment has already reached the maximum of 3 permitted retry attempts."
            );
        }


        if (
            payment?.scenario ===
            "REPEATED_FAILURE"
        ) {
            return (
                "Automatic recovery was stopped because this payment has already failed repeatedly and another automatic attempt is not considered safe."
            );
        }


        return (
            "The AI recommendation did not meet the system's safety rules, so the requested automatic action was not allowed."
        );
    }


    /*
     * -------------------------------------------------------
     * APPROVED ACTIONS
     * -------------------------------------------------------
     */

    switch (action) {

        case "RETRY_PAYMENT":
            return (
                "The retry is allowed because this payment is still eligible for another automatic attempt."
            );

        case "CREATE_PAYMENT_LINK":
            return (
                "The payment link is allowed because it gives the customer another way to complete the payment without repeatedly charging the declined payment method."
            );

        case "ESCALATE_TO_HUMAN":
            return (
                "The payment is being sent for human review instead of continuing automatic recovery."
            );

        case "STOP_RECOVERY":
            return (
                "The system confirmed that no further automatic recovery should be attempted."
            );

        default:
            return (
                "The selected recovery action passed the system's safety controls."
            );
    }
};


export const PolicyDecision = ({
    policyDecision,
    payment = {},
    aiDecision = {}
}) => {

    if (!policyDecision) {
        return null;
    }


    /*
     * -------------------------------------------------------
     * DETERMINE ORIGINAL AI ACTION
     * -------------------------------------------------------
     */

    const originalAction =
        aiDecision?.action ||
        policyDecision.requestedAction ||
        null;


    /*
     * -------------------------------------------------------
     * DETERMINE FINAL ACTION
     * -------------------------------------------------------
     */

    const finalAction =
        policyDecision.finalAction ||
        policyDecision.actionExecuted ||
        null;


    /*
     * -------------------------------------------------------
     * POLICY STATUS
     * -------------------------------------------------------
     */

    const isAllowed =
        policyDecision.allowed !== false &&
        policyDecision.status !== "BLOCKED";


    /*
     * -------------------------------------------------------
     * WAS AI RECOMMENDATION OVERRIDDEN?
     * -------------------------------------------------------
     */

    const wasOverridden =
        !isAllowed &&
        originalAction &&
        finalAction &&
        originalAction !== finalAction;


    /*
     * -------------------------------------------------------
     * EXPLANATION
     * -------------------------------------------------------
     */

    const explanation =
        policyDecision.userExplanation ||
        policyDecision.reason ||
        getPolicyExplanation({
            allowed: isAllowed,
            action: finalAction,
            originalAction,
            payment
        });


    return (
        <div
            className={`panel recovery-card ${
                isAllowed
                    ? "panel-accent-up"
                    : "panel-accent-down"
            }`}
        >

            {/* ------------------------------------------------
                HEADER
            ------------------------------------------------ */}

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
                            isAllowed
                                ? "icon-box-up"
                                : "icon-box-down"
                        }`}
                    >
                        {isAllowed ? (
                            <ShieldCheck
                                style={{
                                    width: "1.25rem",
                                    height: "1.25rem"
                                }}
                            />
                        ) : (
                            <ShieldAlert
                                style={{
                                    width: "1.25rem",
                                    height: "1.25rem"
                                }}
                            />
                        )}
                    </div>


                    <div>

                        <h4 className="recovery-card-title">
                            Recovery Safety Check
                        </h4>

                        <p className="recovery-card-subtitle">
                            The system checked whether the AI decision was safe to execute
                        </p>

                    </div>

                </div>


                <div
                    className={`count-pill self-start sm:self-auto ${
                        isAllowed
                            ? "count-pill-up"
                            : "count-pill-down"
                    }`}
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.375rem"
                    }}
                >

                    {isAllowed ? (
                        <>
                            <CheckCircle2
                                style={{
                                    width: "0.875rem",
                                    height: "0.875rem"
                                }}
                            />

                            <span>
                                APPROVED
                            </span>
                        </>
                    ) : (
                        <>
                            <XCircle
                                style={{
                                    width: "0.875rem",
                                    height: "0.875rem"
                                }}
                            />

                            <span>
                                {wasOverridden
                                    ? "OVERRIDDEN"
                                    : "BLOCKED"}
                            </span>
                        </>
                    )}

                </div>

            </div>


            {/* ------------------------------------------------
                DECISION SUMMARY
            ------------------------------------------------ */}

            <div
                className="sub-card"
                style={{
                    marginBottom: "1rem"
                }}
            >

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: "1rem"
                    }}
                >

                    {/* AI recommendation */}

                    {originalAction && (
                        <div>

                            <span
                                className="meta-label"
                                style={{
                                    display: "block",
                                    marginBottom: "0.25rem"
                                }}
                            >
                                AI Recommendation
                            </span>

                            <span
                                style={{
                                    display: "block",
                                    fontSize: "0.8125rem",
                                    fontWeight: 600,
                                    color: wasOverridden
                                        ? "var(--down)"
                                        : "var(--ink)"
                                }}
                            >
                                {formatRecoveryAction(
                                    originalAction
                                )}
                            </span>

                        </div>
                    )}


                    {/* Final action */}

                    {finalAction && (
                        <div>

                            <span
                                className="meta-label"
                                style={{
                                    display: "block",
                                    marginBottom: "0.25rem"
                                }}
                            >
                                Final Action
                            </span>

                            <span
                                style={{
                                    display: "block",
                                    fontSize: "0.8125rem",
                                    fontWeight: 600,
                                    color: "var(--ink)"
                                }}
                            >
                                {formatRecoveryAction(
                                    finalAction
                                )}
                            </span>

                        </div>
                    )}

                </div>

            </div>


            {/* ------------------------------------------------
                OVERRIDE MESSAGE
            ------------------------------------------------ */}

            {wasOverridden && (
                <div
                    className="sub-card"
                    style={{
                        marginBottom: "1rem",
                        borderLeft:
                            "3px solid var(--warn)"
                    }}
                >

                    <span
                        className="meta-label"
                        style={{
                            display: "block",
                            marginBottom: "0.375rem"
                        }}
                    >
                        Safety Policy Override
                    </span>

                    <p className="recovery-card-body-text">

                        The AI recommendation was not executed.
                        The safety policy selected a safer action
                        before recovery continued.

                    </p>

                </div>
            )}


            {/* ------------------------------------------------
                EXPLANATION
            ------------------------------------------------ */}

            <div>

                <span
                    style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "var(--ink)",
                        display: "block",
                        marginBottom: "0.5rem"
                    }}
                >
                    Why?
                </span>

                <p className="recovery-card-body-text">
                    {explanation}
                </p>

            </div>

        </div>
    );
};


export default PolicyDecision;