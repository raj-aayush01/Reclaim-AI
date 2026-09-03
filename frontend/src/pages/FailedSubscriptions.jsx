import React, { useState } from "react";
import { useSubscriptions } from "../hooks/useSubscriptions";
import { runAIRecovery } from "../services/recoveryService";
import { getPaymentById } from "../services/paymentService";
import AgentRunTimeline from "../components/recovery/AgentRunTimeline";
import VoiceRecovery from "../components/recovery/VoiceRecovery";
import PaymentStatusBadge from "../components/payments/PaymentStatusBadge";
import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";
import Modal from "../components/common/Modal";
import Button from "../components/common/Button";
import { formatCurrency } from "../utils/formatCurrency";
import { formatDateParts } from "../utils/formatDate";
import {
    Zap,
    Mic,
    Repeat,
    ChevronLeft,
    ChevronRight
} from "lucide-react";

export const FailedSubscriptions = () => {
    const {
        subscriptions,
        pagination,
        loading,
        error,
        refetch,
        updateFilters
    } = useSubscriptions({
        status: "past_due"
    });

    const [selectedSubscription, setSelectedSubscription] = useState(null);
    const [executing, setExecuting] = useState(false);
    const [agentRun, setAgentRun] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [execError, setExecError] = useState(null);

    /*
     * Voice Recovery — separate state so it never interferes
     * with the existing "Run AI Recovery" modal/flow above.
     */
    const [voiceLoadingId, setVoiceLoadingId] = useState(null);
    const [voicePayment, setVoicePayment] = useState(null);
    const [voiceCustomer, setVoiceCustomer] = useState(null);
    const [voiceModalOpen, setVoiceModalOpen] = useState(false);

    const currentPage = Number(pagination?.page) || 1;
    const totalPages = Number(pagination?.pages) || 1;
    const totalSubscriptions = Number(pagination?.total) || 0;

    const isFirstPage = currentPage <= 1;
    const isLastPage = currentPage >= totalPages;

    const handlePreviousPage = () => {
        if (isFirstPage) {
            return;
        }

        updateFilters({
            page: currentPage - 1
        });
    };

    const handleNextPage = () => {
        if (isLastPage) {
            return;
        }

        updateFilters({
            page: currentPage + 1
        });
    };

    // ---------------------------------------------------------
    // Run AI recovery for a selected subscription's current
    // failed renewal payment
    // ---------------------------------------------------------

    const handleTriggerAgent = async (subscription) => {
        const paymentId = subscription?.currentPaymentId;

        if (!paymentId || executing) {
            return;
        }

        setSelectedSubscription(subscription);
        setExecuting(true);
        setExecError(null);
        setAgentRun(null);
        setModalOpen(true);

        try {
            const recoveryRes = await runAIRecovery(paymentId);

            const result =
                recoveryRes?.result ||
                recoveryRes?.run ||
                recoveryRes;

            if (result) {
                setAgentRun(result);
            }

            setExecuting(false);

            /*
             * Refresh the subscription list so status
             * (past_due -> active/canceled) reflects the
             * latest sync performed by the backend.
             */
            try {
                await refetch();
            } catch (refreshError) {
                console.warn(
                    "Subscription list refresh failed:",
                    refreshError
                );
            }
        } catch (err) {
            console.error(
                "AI Recovery Agent execution error:",
                err
            );

            setExecError(
                err.message ||
                "Failed to execute AI recovery agent"
            );

            setExecuting(false);
        }
    };

    const handleCloseModal = () => {
        if (executing) {
            return;
        }

        setModalOpen(false);
        setSelectedSubscription(null);
        setAgentRun(null);
        setExecError(null);
    };

    // ---------------------------------------------------------
    // Open Voice Recovery for a subscription's current
    // failed renewal payment
    //
    // Subscriptions don't carry customer name either, so we
    // fetch the full payment + customer record for the
    // subscription's currentPaymentId before opening the modal.
    // ---------------------------------------------------------

    const handleOpenVoiceRecovery = async (subscription) => {
        const paymentId = subscription?.currentPaymentId;

        if (!paymentId || voiceLoadingId) {
            return;
        }

        setVoiceLoadingId(paymentId);

        try {
            const data = await getPaymentById(paymentId);

            setVoicePayment(
                data?.payment || {
                    paymentId,
                    amount: subscription.amount,
                    customerId: subscription.customerId
                }
            );
            setVoiceCustomer(data?.customer || null);
        } catch (err) {
            console.warn(
                "Voice recovery payment fetch failed:",
                err
            );

            setVoicePayment({
                paymentId,
                amount: subscription.amount,
                customerId: subscription.customerId
            });
            setVoiceCustomer(null);
        } finally {
            setVoiceLoadingId(null);
            setVoiceModalOpen(true);
        }
    };

    const handleCloseVoiceRecovery = () => {
        setVoiceModalOpen(false);
        setVoicePayment(null);
        setVoiceCustomer(null);
    };

    return (
        <div className="page-stack">

            {/* =================================================
                PAGE HEADER
            ================================================== */}

            <div className="panel page-header-panel panel-accent-warn">
                <div>
                    <span
                        className="eyebrow"
                        style={{
                            color: "var(--warn)",
                            display: "block",
                            marginBottom: "4px"
                        }}
                    >
                        Dedicated Agent Workflow
                    </span>

                    <h1 className="page-title">
                        <Repeat
                            size={20}
                            style={{ color: "var(--warn)" }}
                        />

                        Failed Subscriptions Workflow Desk
                    </h1>

                    <p className="page-desc">
                        Choose one past-due subscription, trigger the
                        agent, and inspect the recovery decision.
                    </p>
                </div>

                <span className="count-pill count-pill-warn">
                    {pagination?.total ?? subscriptions.length} PAST DUE SUBSCRIPTIONS
                </span>
            </div>

            {/* =================================================
                ERROR
            ================================================== */}

            {error && !loading && (
                <ErrorMessage
                    message={error}
                    onRetry={refetch}
                />
            )}

            {/* =================================================
                SUBSCRIPTION TABLE
            ================================================== */}

            {loading && subscriptions.length === 0 ? (
                <Loader
                    text="Fetching past-due subscriptions..."
                />
            ) : !error ? (
                <div
                    className="panel"
                    style={{ overflow: "hidden" }}
                >
                    <div style={{ overflowX: "auto" }}>
                        <table className="tf-table tf-table-compact">
                            <thead>
                                <tr>
                                    <th>Subscription ID</th>
                                    <th>Customer ID</th>
                                    <th>Plan</th>
                                    <th>Amount</th>
                                    <th>Billing Cycle</th>
                                    <th>Failed Renewals</th>
                                    <th>Status</th>
                                    <th style={{ minWidth: "92px" }}>
                                        Last Renewal
                                    </th>
                                    <th style={{ textAlign: "right" }}>
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {subscriptions.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={9}
                                            style={{
                                                padding: "3rem",
                                                textAlign: "center",
                                                color: "var(--mute)"
                                            }}
                                        >
                                            No past-due subscriptions
                                            found in the system.
                                        </td>
                                    </tr>
                                ) : (
                                    subscriptions.map((subscription) => {
                                        const isCurrentSubscriptionExecuting =
                                            executing &&
                                            selectedSubscription?.subscriptionId ===
                                                subscription.subscriptionId;

                                        const isVoiceLoading =
                                            voiceLoadingId ===
                                            subscription.currentPaymentId;

                                        const { date, time } =
                                            formatDateParts(
                                                subscription.lastRenewalDate
                                            );

                                        return (
                                            <tr
                                                key={subscription.subscriptionId}
                                                className="row-hover"
                                            >
                                                <td
                                                    style={{
                                                        fontWeight: 600,
                                                        color: "var(--ink)"
                                                    }}
                                                >
                                                    {subscription.subscriptionId}
                                                </td>

                                                <td
                                                    style={{
                                                        color: "var(--mute)"
                                                    }}
                                                >
                                                    {subscription.customerId}
                                                </td>

                                                <td>
                                                    <span className="chip">
                                                        {subscription.planName}
                                                    </span>
                                                </td>

                                                <td
                                                    style={{
                                                        fontWeight: 700
                                                    }}
                                                >
                                                    {formatCurrency(
                                                        subscription.amount
                                                    )}
                                                </td>

                                                <td
                                                    style={{
                                                        color: "var(--mute)",
                                                        fontSize: "0.75rem"
                                                    }}
                                                >
                                                    {subscription.billingCycle}
                                                </td>

                                                <td
                                                    style={{
                                                        fontWeight: 700,
                                                        color: "var(--down)"
                                                    }}
                                                >
                                                    {subscription.failedRenewalCount}
                                                </td>

                                                <td>
                                                    <PaymentStatusBadge
                                                        status={
                                                            subscription.status
                                                        }
                                                    />
                                                </td>

                                                <td
                                                    style={{
                                                        color: "var(--mute)",
                                                        fontSize: "0.6875rem",
                                                        lineHeight: 1.4,
                                                        whiteSpace: "normal"
                                                    }}
                                                >
                                                    <div>{date}</div>
                                                    <div>{time}</div>
                                                </td>

                                                <td
                                                    style={{
                                                        textAlign: "right"
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: "0.375rem"
                                                        }}
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            title="Voice Recovery"
                                                            loading={
                                                                isVoiceLoading
                                                            }
                                                            disabled={
                                                                executing ||
                                                                Boolean(
                                                                    voiceLoadingId
                                                                ) ||
                                                                !subscription.currentPaymentId
                                                            }
                                                            onClick={() =>
                                                                handleOpenVoiceRecovery(
                                                                    subscription
                                                                )
                                                            }
                                                            icon={Mic}
                                                        />

                                                        <Button
                                                            variant="glow"
                                                            size="sm"
                                                            loading={
                                                                isCurrentSubscriptionExecuting
                                                            }
                                                            disabled={
                                                                executing ||
                                                                !subscription.currentPaymentId
                                                            }
                                                            onClick={() =>
                                                                handleTriggerAgent(
                                                                    subscription
                                                                )
                                                            }
                                                            icon={Zap}
                                                        >
                                                            {isCurrentSubscriptionExecuting
                                                                ? "Checking..."
                                                                : "AI Recovery"}
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* =================================================
                        PAGINATION
                    ================================================== */}

                    {totalPages > 1 && (
                        <div
                            style={{
                                padding: "0.875rem 1.25rem",
                                borderTop: "1px solid var(--line)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "1rem",
                                flexWrap: "wrap",
                                fontSize: "0.75rem",
                                color: "var(--mute)",
                                fontFamily:
                                    "'JetBrains Mono', monospace"
                            }}
                        >
                            <div>
                                Showing page{" "}
                                <span
                                    style={{
                                        fontWeight: 600,
                                        color: "var(--ink)"
                                    }}
                                >
                                    {currentPage}
                                </span>{" "}
                                of{" "}
                                <span
                                    style={{
                                        fontWeight: 600,
                                        color: "var(--ink)"
                                    }}
                                >
                                    {totalPages}
                                </span>{" "}
                                ({totalSubscriptions} past-due subscriptions)
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem"
                                }}
                            >
                                <button
                                    type="button"
                                    disabled={isFirstPage}
                                    onClick={handlePreviousPage}
                                    aria-label="Go to previous page"
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "0.35rem",
                                        padding:
                                            "0.45rem 0.7rem",
                                        borderRadius: "0.375rem",
                                        border:
                                            "1px solid var(--line)",
                                        background:
                                            "var(--surface-solid)",
                                        color: isFirstPage
                                            ? "var(--mute)"
                                            : "var(--ink)",
                                        cursor: isFirstPage
                                            ? "not-allowed"
                                            : "pointer",
                                        opacity: isFirstPage
                                            ? 0.4
                                            : 1,
                                        transition:
                                            "all 150ms ease"
                                    }}
                                >
                                    <ChevronLeft size={14} />

                                    <span
                                        style={{
                                            fontFamily:
                                                "inherit",
                                            fontSize:
                                                "0.6875rem",
                                            fontWeight: 600
                                        }}
                                    >
                                        Previous
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    disabled={isLastPage}
                                    onClick={handleNextPage}
                                    aria-label="Go to next page"
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "0.35rem",
                                        padding:
                                            "0.45rem 0.7rem",
                                        borderRadius: "0.375rem",
                                        border:
                                            "1px solid var(--line)",
                                        background:
                                            "var(--surface-solid)",
                                        color: isLastPage
                                            ? "var(--mute)"
                                            : "var(--ink)",
                                        cursor: isLastPage
                                            ? "not-allowed"
                                            : "pointer",
                                        opacity: isLastPage
                                            ? 0.4
                                            : 1,
                                        transition:
                                            "all 150ms ease"
                                    }}
                                >
                                    <span
                                        style={{
                                            fontFamily:
                                                "inherit",
                                            fontSize:
                                                "0.6875rem",
                                            fontWeight: 600
                                        }}
                                    >
                                        Next
                                    </span>

                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : null}

            {/* =================================================
                AI RECOVERY MODAL
            ================================================== */}

            <Modal
                isOpen={modalOpen}
                maxWidth="max-w-4xl"
                onClose={handleCloseModal}
                title={`Subscription Renewal Recovery — ${
                    selectedSubscription?.subscriptionId || ""
                }`}
            >
                {executing ? (
                    <div
                        style={{
                            padding: "3rem 0",
                            textAlign: "center"
                        }}
                    >
                        <Loader text="Running AI recovery..." />

                        <p
                            style={{
                                fontSize: "0.75rem",
                                color: "var(--mute)",
                                marginTop: "1rem",
                                lineHeight: 1.6
                            }}
                        >
                            The system is reviewing the subscription
                            renewal, evaluating the recovery decision,
                            and processing the appropriate action.
                        </p>
                    </div>
                ) : execError ? (
                    <ErrorMessage
                        message={execError}
                        onRetry={() =>
                            selectedSubscription &&
                            handleTriggerAgent(selectedSubscription)
                        }
                    />
                ) : agentRun ? (
                    <AgentRunTimeline
                        runData={agentRun}
                        fallbackPayment={selectedSubscription}
                    />
                ) : (
                    <div
                        style={{
                            padding: "3rem 0",
                            textAlign: "center",
                            fontSize: "0.875rem",
                            color: "var(--mute)"
                        }}
                    >
                        Recovery completed, but no recovery details
                        were returned.
                    </div>
                )}
            </Modal>

            {/* =================================================
                VOICE RECOVERY
            ================================================== */}

            <VoiceRecovery
                isOpen={voiceModalOpen}
                onClose={handleCloseVoiceRecovery}
                payment={voicePayment}
                customer={voiceCustomer}
                onRecoveryComplete={async () => {
                    handleCloseVoiceRecovery();
                    await refetch();
                }}
            />
        </div>
    );
};

export default FailedSubscriptions;
