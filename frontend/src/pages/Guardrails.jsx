import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ShieldCheck,
    DollarSign,
    Hash,
    AlertOctagon,
    HelpCircle,
    Target,
    Eye,
    ChevronLeft,
    ChevronRight
} from "lucide-react";

import { getPolicyFirings } from "../services/recoveryService";
import { formatCurrency } from "../utils/formatCurrency";
import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";


/*
 * Global recovery guardrails.
 *
 * These rules describe the safety boundaries enforced
 * by the backend recovery policy engine.
 */
const rules = [
    {
        num: "01",
        icon: DollarSign,
        title: "High-Value Threshold",
        desc: "Payments above ₹20,000 are escalated to human review — never auto-retried."
    },
    {
        num: "02",
        icon: Hash,
        title: "Retry Limit",
        desc: "The system stops after 3 recovery attempts to prevent compounding losses."
    },
    {
        num: "03",
        icon: Target,
        title: "Scenario Guard",
        desc: "Retry is valid only for temporary failures; blocked for all other failure modes."
    },
    {
        num: "04",
        icon: AlertOctagon,
        title: "Unknown Failures",
        desc: "Any unrecognised failure mode is escalated, never guessed."
    },
    {
        num: "05",
        icon: HelpCircle,
        title: "Confidence Threshold",
        desc: "A recommendation is rejected if AI confidence is below the policy minimum."
    }
];


/*
 * Converts backend recovery action names into
 * readable business-facing labels.
 */
const formatAction = (action) => {
    if (!action) {
        return "—";
    }

    return action
        .replace(/_/g, " ")
        .toUpperCase();
};


export const Guardrails = () => {

    const navigate = useNavigate();

    const [firings, setFirings] = useState([]);
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 20,
        pages: 1
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


    /*
     * Fetch real policy-firing events from the backend.
     *
     * Only events where the recovery policy rejected
     * or overrode an AI recommendation are returned.
     */
    const fetchPolicyFirings = async (page = 1) => {

        setLoading(true);
        setError(null);

        try {

            const data = await getPolicyFirings({
                page,
                limit: 20
            });

            setFirings(
                data?.firings || []
            );

            if (data?.pagination) {
                setPagination(
                    data.pagination
                );
            }

        } catch (err) {

            console.error(
                "Guardrails fetch error:",
                err
            );

            setError(
                err.message ||
                "Failed to load policy firings"
            );

        } finally {

            setLoading(false);
        }
    };


    /*
     * Load the latest policy firings
     * when the page is opened.
     */
    useEffect(() => {
        fetchPolicyFirings(1);
    }, []);


    /*
     * Navigate to the existing payment inspection page.
     *
     * This lets the user inspect the complete AI recovery
     * journey for the payment that triggered the guardrail.
     */
    const handleInspect = (paymentId) => {

        if (!paymentId) {
            return;
        }

        navigate(
            `/payments/${paymentId}`
        );
    };


    return (
        <div className="space-y-6 animate-fade-in font-sans">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="panel panel-accent-up p-6 rounded-xl flex items-center justify-between">

                <div>

                    <span
                        className="eyebrow"
                        style={{
                            color: "var(--up)",
                            display: "block",
                            marginBottom: "2px"
                        }}
                    >
                        POLICY ENGINE
                    </span>

                    <h1
                        style={{
                            fontSize: "1.25rem",
                            fontWeight: 700,
                            color: "var(--ink)",
                            fontFamily: "'Inter', sans-serif",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem"
                        }}
                    >
                        <ShieldCheck
                            className="w-5 h-5"
                            style={{
                                color: "var(--up)"
                            }}
                        />

                        Rules the Agent Follows
                    </h1>

                </div>

                <div className="count-pill count-pill-up">
                    05 ACTIVE RULES
                </div>

            </div>


            {/* =================================================
                ACTIVE GUARDRAILS
            ================================================= */}

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">

                {rules.map((rule) => {

                    const Icon = rule.icon;

                    return (
                        <div
                            key={rule.num}
                            className="panel p-5 rounded-xl space-y-3"
                        >

                            <div className="flex items-center justify-between">

                                <span
                                    style={{
                                        fontSize: "1.125rem",
                                        fontWeight: 800,
                                        fontFamily:
                                            "'JetBrains Mono', monospace",
                                        color: "var(--up)"
                                    }}
                                >
                                    {rule.num}
                                </span>

                                <div className="icon-box icon-box-sm icon-box-up">

                                    <Icon className="w-4 h-4" />

                                </div>

                            </div>

                            <h3
                                style={{
                                    fontSize: "0.8125rem",
                                    fontWeight: 700,
                                    color: "var(--ink)"
                                }}
                            >
                                {rule.title}
                            </h3>

                            <p
                                style={{
                                    fontSize: "0.6875rem",
                                    color: "var(--mute)",
                                    lineHeight: 1.5
                                }}
                            >
                                {rule.desc}
                            </p>

                        </div>
                    );
                })}

            </div>


            {/* =================================================
                RECENT POLICY FIRINGS
            ================================================= */}

            <div className="panel p-6 rounded-xl space-y-4">

                <div className="flex items-center justify-between">

                    <div>

                        <span
                            className="eyebrow"
                            style={{
                                color: "var(--up)",
                                display: "block",
                                marginBottom: "2px"
                            }}
                        >
                            LIVE POLICY EVENTS
                        </span>

                        <h3
                            style={{
                                fontSize: "1rem",
                                fontWeight: 700,
                                color: "var(--ink)",
                                fontFamily:
                                    "'Inter', sans-serif"
                            }}
                        >
                            Recent Policy Firings
                        </h3>

                    </div>

                    <span
                        style={{
                            fontSize: "0.75rem",
                            fontFamily:
                                "'JetBrains Mono', monospace",
                            fontWeight: 700,
                            color: "var(--mute)"
                        }}
                    >
                        {pagination.total || 0} FIRED
                    </span>

                </div>


                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (
                    <ErrorMessage
                        message={error}
                        onRetry={() =>
                            fetchPolicyFirings(
                                pagination.page || 1
                            )
                        }
                    />
                )}


                {/* =================================================
                    LOADING
                ================================================= */}

                {loading ? (

                    <Loader
                        text="Loading policy firings..."
                    />

                ) : !error ? (

                    firings.length === 0 ? (

                        /* =================================================
                           EMPTY STATE
                        ================================================= */

                        <div
                            style={{
                                padding: "3rem 1rem",
                                textAlign: "center",
                                color: "var(--mute)",
                                fontSize: "0.8125rem"
                            }}
                        >
                            <ShieldCheck
                                size={32}
                                style={{
                                    margin:
                                        "0 auto 0.75rem",
                                    color: "var(--up)"
                                }}
                            />

                            <div
                                style={{
                                    fontWeight: 700,
                                    color: "var(--ink)",
                                    marginBottom: "0.35rem"
                                }}
                            >
                                No Policy Firings Yet
                            </div>

                            <div>
                                All recent AI recovery
                                recommendations have passed
                                the configured guardrails.
                            </div>
                        </div>

                    ) : (

                        /* =================================================
                           FIRINGS TABLE
                        ================================================= */

                        <>

                            <div className="overflow-x-auto">

                                <table className="tf-table">

                                    <thead>

                                        <tr>
                                            <th>Payment ID</th>
                                            <th>Amount</th>
                                            <th>AI Recommendation</th>
                                            <th>Final Action</th>
                                            <th>Reason</th>
                                            <th
                                                style={{
                                                    textAlign:
                                                        "right"
                                                }}
                                            >
                                                Actions
                                            </th>
                                        </tr>

                                    </thead>

                                    <tbody>

                                        {firings.map(
                                            (firing, index) => (

                                                <tr
                                                    key={
                                                        firing.id ||
                                                        `${firing.paymentId}-${index}`
                                                    }
                                                    className="row-hover"
                                                >

                                                    {/* Payment ID */}

                                                    <td
                                                        className="font-mono"
                                                        style={{
                                                            fontWeight: 600,
                                                            color:
                                                                "var(--ink)",
                                                            whiteSpace:
                                                                "nowrap"
                                                        }}
                                                    >
                                                        {
                                                            firing.paymentId
                                                        }
                                                    </td>


                                                    {/* Amount */}

                                                    <td
                                                        style={{
                                                            fontWeight: 700,
                                                            color:
                                                                "var(--ink)",
                                                            whiteSpace:
                                                                "nowrap"
                                                        }}
                                                    >
                                                        {formatCurrency(
                                                            firing.amount
                                                        )}
                                                    </td>


                                                    {/* AI recommendation */}

                                                    <td>

                                                        <span
                                                            className="badge-warn"
                                                            style={{
                                                                display:
                                                                    "inline-block",
                                                                padding:
                                                                    "0.1875rem 0.5rem",
                                                                borderRadius:
                                                                    "0.25rem",
                                                                fontSize:
                                                                    "0.625rem",
                                                                fontWeight: 700,
                                                                fontFamily:
                                                                    "'JetBrains Mono', monospace",
                                                                whiteSpace:
                                                                    "nowrap"
                                                            }}
                                                        >
                                                            {formatAction(
                                                                firing.aiAction
                                                            )}
                                                        </span>

                                                    </td>


                                                    {/* Final action */}

                                                    <td
                                                        style={{
                                                            fontWeight: 700,
                                                            color:
                                                                "var(--ink)",
                                                            whiteSpace:
                                                                "nowrap"
                                                        }}
                                                    >
                                                        {formatAction(
                                                            firing.finalAction
                                                        )}
                                                    </td>


                                                    {/* Reason */}

                                                    <td
                                                        style={{
                                                            color:
                                                                "var(--mute)",
                                                            maxWidth:
                                                                "420px",
                                                            minWidth:
                                                                "280px",
                                                            fontSize:
                                                                "0.6875rem",
                                                            lineHeight: 1.5
                                                        }}
                                                    >
                                                        {
                                                            firing.reason
                                                        }
                                                    </td>


                                                    {/* Inspect */}

                                                    <td
                                                        style={{
                                                            textAlign:
                                                                "right"
                                                        }}
                                                    >

                                                        <button
                                                            onClick={() =>
                                                                handleInspect(
                                                                    firing.paymentId
                                                                )
                                                            }
                                                            className="icon-btn"
                                                            title="Inspect payment recovery"
                                                        >
                                                            <Eye
                                                                size={14}
                                                            />
                                                        </button>

                                                    </td>

                                                </tr>

                                            )
                                        )}

                                    </tbody>

                                </table>

                            </div>


                            {/* =================================================
                                PAGINATION
                            ================================================= */}

                            {pagination.pages > 1 && (

                                <div className="table-footer">

                                    <span>

                                        Page{" "}

                                        <strong
                                            style={{
                                                color:
                                                    "var(--ink)"
                                            }}
                                        >
                                            {
                                                pagination.page
                                            }
                                        </strong>

                                        {" "}of{" "}

                                        <strong
                                            style={{
                                                color:
                                                    "var(--ink)"
                                            }}
                                        >
                                            {
                                                pagination.pages
                                            }
                                        </strong>

                                    </span>


                                    <div
                                        style={{
                                            display:
                                                "flex",
                                            alignItems:
                                                "center",
                                            gap:
                                                "0.5rem"
                                        }}
                                    >

                                        <button
                                            disabled={
                                                pagination.page <=
                                                1 ||
                                                loading
                                            }
                                            onClick={() =>
                                                fetchPolicyFirings(
                                                    pagination.page -
                                                        1
                                                )
                                            }
                                            style={{
                                                padding:
                                                    "0.3125rem",
                                                borderRadius:
                                                    "0.375rem",
                                                border:
                                                    "1px solid var(--line)",
                                                background:
                                                    "var(--surface-solid)",
                                                color:
                                                    "var(--mute)",
                                                cursor:
                                                    pagination.page <=
                                                        1 ||
                                                    loading
                                                        ? "not-allowed"
                                                        : "pointer",
                                                opacity:
                                                    pagination.page <=
                                                        1 ||
                                                    loading
                                                        ? 0.4
                                                        : 1,
                                                display:
                                                    "flex",
                                                alignItems:
                                                    "center"
                                            }}
                                            title="Previous page"
                                        >
                                            <ChevronLeft
                                                size={14}
                                            />
                                        </button>


                                        <button
                                            disabled={
                                                pagination.page >=
                                                pagination.pages ||
                                                loading
                                            }
                                            onClick={() =>
                                                fetchPolicyFirings(
                                                    pagination.page +
                                                        1
                                                )
                                            }
                                            style={{
                                                padding:
                                                    "0.3125rem",
                                                borderRadius:
                                                    "0.375rem",
                                                border:
                                                    "1px solid var(--line)",
                                                background:
                                                    "var(--surface-solid)",
                                                color:
                                                    "var(--mute)",
                                                cursor:
                                                    pagination.page >=
                                                        pagination.pages ||
                                                    loading
                                                        ? "not-allowed"
                                                        : "pointer",
                                                opacity:
                                                    pagination.page >=
                                                        pagination.pages ||
                                                    loading
                                                        ? 0.4
                                                        : 1,
                                                display:
                                                    "flex",
                                                alignItems:
                                                    "center"
                                            }}
                                            title="Next page"
                                        >
                                            <ChevronRight
                                                size={14}
                                            />
                                        </button>

                                    </div>

                                </div>

                            )}

                        </>

                    )

                ) : null}

            </div>

        </div>
    );
};

export default Guardrails;