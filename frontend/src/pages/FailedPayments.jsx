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

    /*
     * Fetch only payments whose current status is "failed".
     *
     * Important:
     * usePayments still handles pagination, filtering,
     * URL state, loading and API errors.
     */
    const {
        payments,
        pagination,
        loading,
        error,
        refetch
    } = usePayments({
        status: "failed"
    });


    /*
     * Currently selected payment whose agent run
     * is being displayed in the modal.
     */
    const [selectedPayment, setSelectedPayment] = useState(null);

    /*
     * True while the Gemini recovery agent is executing.
     */
    const [executing, setExecuting] = useState(false);

    /*
     * Stores the AgentRun document returned by:
     * GET /api/agent/runs/:paymentId
     */
    const [agentRun, setAgentRun] = useState(null);

    /*
     * Controls the recovery modal.
     */
    const [modalOpen, setModalOpen] = useState(false);

    /*
     * Stores an execution/API error.
     */
    const [execError, setExecError] = useState(null);


    /*
     * Trigger the autonomous recovery agent for ONE payment.
     *
     * Flow:
     *
     * 1. Select payment
     * 2. Open modal
     * 3. POST /api/agent/ai/:paymentId
     * 4. Agent executes
     * 5. GET /api/agent/runs/:paymentId
     * 6. Display actual AgentRun timeline
     * 7. Refresh payment table
     */
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

            // Start the autonomous AI recovery agent.
            await runAIRecovery(payment.paymentId);

            /*
             * Once the agent finishes, retrieve the persisted
             * execution history from MongoDB.
             */
            const runRes = await getAgentRun(
                payment.paymentId
            );

            if (runRes?.run) {
                setAgentRun(runRes.run);
            } else {
                throw new Error(
                    "Agent completed but no execution history was found."
                );
            }

            /*
             * Refresh the payment list because the agent may
             * have changed the payment status.
             *
             * Example:
             * failed → recovered
             * failed → escalated
             * failed → pending
             * failed → stopped
             */
            await refetch();

        } catch (err) {

            console.error(
                "AI Recovery Agent execution error:",
                err
            );

            setExecError(
                err.message ||
                "Failed to execute AI recovery agent"
            );

        } finally {

            setExecuting(false);
        }
    };


    return (
        <div className="space-y-6 animate-fade-in font-sans">

            {/* =====================================================
                PAGE HEADER
            ====================================================== */}

            <div className="glass-panel p-6 rounded-2xl border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">

                <div>

                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 block mb-0.5">
                        DEDICATED AGENT WORKFLOW
                    </span>

                    <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">

                        <AlertOctagon className="w-5 h-5 text-amber-400" />

                        Failed Payments Workflow Desk

                    </h1>

                    <p className="text-xs text-slate-400 mt-1 font-mono">
                        Choose one failed payment → trigger the agent → watch what happened.
                    </p>

                </div>


                {/* Total failed payments across all pages */}

                <div className="px-3.5 py-1.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-800/80 text-xs font-bold font-mono">

                    {pagination?.total ?? payments.length} FAILED PAYMENTS

                </div>

            </div>


            {/* =====================================================
                ERROR FROM PAYMENT FETCH
            ====================================================== */}

            {error && !loading && (
                <ErrorMessage
                    message={error}
                    onRetry={refetch}
                />
            )}


            {/* =====================================================
                LOADING STATE
            ====================================================== */}

            {loading && payments.length === 0 ? (

                <Loader
                    text="Fetching failed payment transactions..."
                />

            ) : !error ? (

                <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">

                    <div className="overflow-x-auto">

                        <table className="w-full text-left border-collapse">

                            <thead>

                                <tr className="bg-slate-900/80 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">

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

                                    <th className="px-5 py-4 text-right">
                                        ACTIONS
                                    </th>

                                </tr>

                            </thead>


                            <tbody className="divide-y divide-slate-800/60 text-xs">

                                {payments.length === 0 ? (

                                    <tr>

                                        <td
                                            colSpan={7}
                                            className="px-6 py-12 text-center text-slate-400"
                                        >
                                            No failed payments found in the system.
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
                                                className="hover:bg-slate-800/40 transition-colors"
                                            >

                                                {/* Payment ID */}

                                                <td className="px-5 py-4 font-mono font-bold text-slate-100">

                                                    {payment.paymentId}

                                                </td>


                                                {/* Customer ID */}

                                                <td className="px-5 py-4 font-mono text-slate-400">

                                                    {payment.customerId}

                                                </td>


                                                {/* Amount */}

                                                <td className="px-5 py-4 font-bold text-slate-100">

                                                    {formatCurrency(
                                                        payment.amount
                                                    )}

                                                </td>


                                                {/* Scenario */}

                                                <td className="px-5 py-4">

                                                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold border border-slate-700">

                                                        {payment.scenario}

                                                    </span>

                                                </td>


                                                {/* Status */}

                                                <td className="px-5 py-4">

                                                    <PaymentStatusBadge
                                                        status={
                                                            payment.status
                                                        }
                                                    />

                                                </td>


                                                {/* Created At */}

                                                <td className="px-5 py-4 text-slate-400 font-mono text-[11px]">

                                                    {formatDate(
                                                        payment.createdAt
                                                    )}

                                                </td>


                                                {/* Actions */}

                                                <td className="px-5 py-4 text-right">

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
                                                        className="inline-flex items-center gap-1.5"
                                                    >

                                                        <Zap className="w-3.5 h-3.5" />

                                                        <span>
                                                            {isCurrentPaymentExecuting
                                                                ? "Running..."
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


                    {/* =================================================
                        PAGINATION
                    ================================================== */}

                    {pagination?.pages > 1 && (

                        <div className="px-5 py-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">

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


            {/* =====================================================
                AI RECOVERY MODAL
            ====================================================== */}

            <Modal
                isOpen={modalOpen}
                onClose={() => {

                    /*
                     * Don't allow the modal to close while
                     * the agent is actively executing.
                     *
                     * This prevents accidentally hiding the
                     * current execution state.
                     */
                    if (!executing) {
                        setModalOpen(false);
                    }

                }}
                title={`AI Recovery Agent Run — ${
                    selectedPayment?.paymentId || ""
                }`}
            >

                {/* Agent executing */}

                {executing ? (

                    <div className="py-12 text-center space-y-4">

                        <Loader
                            text="Autonomous Gemini AI Recovery Agent is executing tools..."
                        />

                        <p className="text-xs text-slate-400 font-mono">
                            Inspecting payment → checking history → selecting recovery action...
                        </p>

                        <p className="text-[10px] text-slate-500">
                            This run is processing one payment only.
                        </p>

                    </div>

                ) : execError ? (

                    /* Agent execution failed */

                    <ErrorMessage
                        message={execError}
                        onRetry={() =>
                            selectedPayment &&
                            handleTriggerAgent(selectedPayment)
                        }
                    />

                ) : (

                    /* Agent execution completed */

                    <AgentRunTimeline
                        runData={agentRun}
                    />

                )}

            </Modal>

        </div>
    );
};

export default FailedPayments;