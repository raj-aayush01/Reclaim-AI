import React, { useState } from "react";
import { usePayments } from "../hooks/usePayments";
import {
    runAIRecovery,
    getAgentRun
} from "../services/recoveryService";
import AgentRunTimeline from "../components/recovery/AgentRunTimeline";
import PaymentStatusBadge from "../components/payments/PaymentStatusBadge";
import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";
import Modal from "../components/common/Modal";
import Button from "../components/common/Button";
import { formatCurrency } from "../utils/formatCurrency";
import { formatDate } from "../utils/formatDate";
import { Zap, AlertOctagon } from "lucide-react";

export const FailedPayments = () => {
    const {
        payments,
        pagination,
        loading,
        error,
        refetch
    } = usePayments({
        status: "failed"
    });

    const [selectedPayment, setSelectedPayment] = useState(null);
    const [executing, setExecuting] = useState(false);
    const [agentRun, setAgentRun] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [execError, setExecError] = useState(null);

    const handleTriggerAgent = async (payment) => {
        if (!payment?.paymentId || executing) {
            return;
        }

        setSelectedPayment(payment);
        setExecuting(true);
        setExecError(null);
        setAgentRun(null);
        setModalOpen(true);

        try {
            let existingRun = null;

            try {
                const runRes = await getAgentRun(payment.paymentId);

                if (runRes?.run) {
                    existingRun = runRes.run;
                }
            } catch (historyError) {
                console.warn(
                    "No existing AgentRun found. Starting AI recovery:",
                    historyError
                );
            }

            if (existingRun) {
                setAgentRun(existingRun);
                setExecuting(false);
                return;
            }

            const recoveryRes = await runAIRecovery(payment.paymentId);

            const immediateResult =
                recoveryRes?.result ||
                recoveryRes?.run ||
                recoveryRes;

            if (immediateResult) {
                setAgentRun(immediateResult);
            }

            setExecuting(false);

            try {
                const runRes = await getAgentRun(payment.paymentId);

                if (runRes?.run) {
                    setAgentRun(runRes.run);
                }
            } catch (historyError) {
                console.warn(
                    "AgentRun could not be fetched after execution. Using AI recovery response:",
                    historyError
                );
            }

            try {
                await refetch();
            } catch (refreshError) {
                console.warn(
                    "Payment table refresh failed:",
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
        setSelectedPayment(null);
        setAgentRun(null);
        setExecError(null);
    };

    return (
        <div className="space-y-6 animate-fade-in font-sans">

            <div
                className="
                    glass-panel
                    p-6
                    rounded-2xl
                    border
                    border-amber-500/30
                    flex
                    flex-col
                    md:flex-row
                    md:items-center
                    md:justify-between
                    gap-4
                "
            >
                <div>
                    <span
                        className="
                            text-[10px]
                            font-bold
                            uppercase
                            tracking-widest
                            text-amber-400
                            block
                            mb-0.5
                        "
                    >
                        DEDICATED AGENT WORKFLOW
                    </span>

                    <h1
                        className="
                            text-xl
                            font-bold
                            text-slate-100
                            flex
                            items-center
                            gap-2
                        "
                    >
                        <AlertOctagon className="w-5 h-5 text-amber-400" />

                        Failed Payments Workflow Desk
                    </h1>

                    <p className="text-xs text-slate-400 mt-1">
                        Choose one failed payment, trigger the agent,
                        and inspect the recovery decision.
                    </p>
                </div>

                <div
                    className="
                        px-3.5
                        py-1.5
                        rounded-full
                        bg-amber-950/60
                        text-amber-300
                        border
                        border-amber-800/80
                        text-xs
                        font-bold
                    "
                >
                    {pagination?.total ?? payments.length} FAILED PAYMENTS
                </div>
            </div>

            {error && !loading && (
                <ErrorMessage
                    message={error}
                    onRetry={refetch}
                />
            )}

            {loading && payments.length === 0 ? (
                <Loader
                    text="Fetching failed payment transactions..."
                />
            ) : !error ? (
                <div
                    className="
                        glass-panel
                        rounded-2xl
                        overflow-hidden
                        border
                        border-slate-800
                    "
                >
                    <div className="overflow-x-auto">
                        <table
                            className="
                                w-full
                                text-left
                                border-collapse
                            "
                        >
                            <thead>
                                <tr
                                    className="
                                        bg-slate-900/80
                                        border-b
                                        border-slate-800
                                        text-[10px]
                                        font-bold
                                        uppercase
                                        tracking-wider
                                        text-slate-400
                                    "
                                >
                                    <th className="px-5 py-4">
                                        PAYMENT ID
                                    </th>

                                    <th className="px-5 py-4">
                                        CUSTOMER ID
                                    </th>

                                    <th className="px-5 py-4">
                                        AMOUNT
                                    </th>

                                    <th className="px-5 py-4">
                                        SCENARIO
                                    </th>

                                    <th className="px-5 py-4">
                                        STATUS
                                    </th>

                                    <th className="px-5 py-4">
                                        CREATED AT
                                    </th>

                                    <th
                                        className="
                                            px-5
                                            py-4
                                            text-right
                                        "
                                    >
                                        ACTIONS
                                    </th>
                                </tr>
                            </thead>

                            <tbody
                                className="
                                    divide-y
                                    divide-slate-800/60
                                    text-xs
                                "
                            >
                                {payments.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="
                                                px-6
                                                py-12
                                                text-center
                                                text-slate-400
                                            "
                                        >
                                            No failed payments found
                                            in the system.
                                        </td>
                                    </tr>
                                ) : (
                                    payments.map((payment) => {
                                        const isCurrentPaymentExecuting =
                                            executing &&
                                            selectedPayment?.paymentId ===
                                                payment.paymentId;

                                        return (
                                            <tr
                                                key={payment.paymentId}
                                                className="
                                                    hover:bg-slate-800/40
                                                    transition-colors
                                                "
                                            >
                                                <td
                                                    className="
                                                        px-5
                                                        py-4
                                                        font-mono
                                                        font-bold
                                                        text-slate-100
                                                    "
                                                >
                                                    {payment.paymentId}
                                                </td>

                                                <td
                                                    className="
                                                        px-5
                                                        py-4
                                                        font-mono
                                                        text-slate-400
                                                    "
                                                >
                                                    {payment.customerId}
                                                </td>

                                                <td
                                                    className="
                                                        px-5
                                                        py-4
                                                        font-bold
                                                        text-slate-100
                                                    "
                                                >
                                                    {formatCurrency(
                                                        payment.amount
                                                    )}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span
                                                        className="
                                                            px-2
                                                            py-0.5
                                                            rounded
                                                            bg-slate-800
                                                            text-slate-300
                                                            text-[10px]
                                                            font-bold
                                                            border
                                                            border-slate-700
                                                        "
                                                    >
                                                        {payment.scenario}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <PaymentStatusBadge
                                                        status={
                                                            payment.status
                                                        }
                                                    />
                                                </td>

                                                <td
                                                    className="
                                                        px-5
                                                        py-4
                                                        text-slate-400
                                                        text-[11px]
                                                    "
                                                >
                                                    {formatDate(
                                                        payment.createdAt
                                                    )}
                                                </td>

                                                <td
                                                    className="
                                                        px-5
                                                        py-4
                                                        text-right
                                                    "
                                                >
                                                    <Button
                                                        variant="glow"
                                                        size="sm"
                                                        loading={
                                                            isCurrentPaymentExecuting
                                                        }
                                                        disabled={
                                                            executing
                                                        }
                                                        onClick={() =>
                                                            handleTriggerAgent(
                                                                payment
                                                            )
                                                        }
                                                        className="
                                                            inline-flex
                                                            items-center
                                                            gap-1.5
                                                        "
                                                    >
                                                        <Zap
                                                            className="
                                                                w-3.5
                                                                h-3.5
                                                            "
                                                        />

                                                        <span>
                                                            {isCurrentPaymentExecuting
                                                                ? "Checking..."
                                                                : "AI Recovery"}
                                                        </span>
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {pagination?.pages > 1 && (
                        <div
                            className="
                                px-5
                                py-4
                                border-t
                                border-slate-800
                                bg-slate-900/60
                                flex
                                items-center
                                justify-between
                                text-xs
                                text-slate-400
                            "
                        >
                            <span>
                                Page{" "}
                                <strong className="text-slate-200">
                                    {pagination.page}
                                </strong>{" "}
                                of{" "}
                                <strong className="text-slate-200">
                                    {pagination.pages}
                                </strong>
                            </span>

                            <span>
                                {pagination.total} failed payments
                            </span>
                        </div>
                    )}
                </div>
            ) : null}

            <Modal
                isOpen={modalOpen}
                maxWidth="max-w-4xl"
                onClose={handleCloseModal}
                title={`AI Recovery — ${
                    selectedPayment?.paymentId || ""
                }`}
            >
                {executing ? (
                    <div
                        className="
                            py-12
                            text-center
                            space-y-4
                        "
                    >
                        <Loader
                            text="Running AI recovery..."
                        />

                        <p
                            className="
                                text-xs
                                text-slate-400
                            "
                        >
                            The system is reviewing the payment,
                            evaluating the recovery decision,
                            and processing the appropriate action.
                        </p>

                        <p
                            className="
                                text-[10px]
                                text-slate-500
                            "
                        >
                            Existing recovery logs are reused
                            without running Gemini again.
                        </p>
                    </div>
                ) : execError ? (
                    <ErrorMessage
                        message={execError}
                        onRetry={() =>
                            selectedPayment &&
                            handleTriggerAgent(selectedPayment)
                        }
                    />
                ) : agentRun ? (
                    <AgentRunTimeline
                        runData={agentRun}
                        fallbackPayment={selectedPayment}
                    />
                ) : (
                    <div
                        className="
                            py-12
                            text-center
                            text-sm
                            text-slate-400
                        "
                    >
                        Recovery completed, but no recovery details
                        were returned.
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default FailedPayments;