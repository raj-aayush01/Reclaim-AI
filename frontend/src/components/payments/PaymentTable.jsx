import React from "react";
import PaymentRow from "./PaymentRow";
import EmptyState from "../common/EmptyState";
import Loader from "../common/Loader";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const PaymentTable = ({
    payments = [],
    pagination = {},
    loading = false,
    onRunRecovery,
    executingId,
    onPageChange
}) => {
    if (loading && payments.length === 0) {
        return <Loader text="Fetching payments..." />;
    }

    if (!loading && payments.length === 0) {
        return (
            <EmptyState
                title="No Payments Match Filter"
                description="Try clearing or adjusting your search query and status filters."
            />
        );
    }

    return (
        <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-900/80 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            <th className="px-4 py-3.5">Payment ID</th>
                            <th className="px-4 py-3.5">Customer ID</th>
                            <th className="px-4 py-3.5">Amount</th>
                            <th className="px-4 py-3.5">Scenario</th>
                            <th className="px-4 py-3.5">Status</th>
                            <th className="px-4 py-3.5">Attempts & Action</th>
                            <th className="px-4 py-3.5">Created At</th>
                            <th className="px-4 py-3.5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                        {payments.map((payment) => (
                            <PaymentRow
                                key={payment._id || payment.paymentId}
                                payment={payment}
                                onRunRecovery={onRunRecovery}
                                isExecuting={executingId === payment.paymentId}
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {pagination && pagination.pages > 1 && (
                <div className="px-6 py-4 bg-slate-900/60 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <div>
                        Showing page <span className="font-bold text-slate-200">{pagination.page}</span> of{" "}
                        <span className="font-bold text-slate-200">{pagination.pages}</span> ({pagination.total} total payments)
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            disabled={pagination.page <= 1}
                            onClick={() => onPageChange(pagination.page - 1)}
                            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 disabled:opacity-40 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            disabled={pagination.page >= pagination.pages}
                            onClick={() => onPageChange(pagination.page + 1)}
                            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 disabled:opacity-40 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentTable;
