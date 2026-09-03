const AgentRun = require("../models/AgentRun");
const Payment = require("../models/Payment");


// Serialize the current payment state for the frontend

const serializePayment = (payment) => {

    if (!payment) {
        return null;
    }

    return {
        paymentId:
            payment.paymentId,

        orderId:
            payment.orderId,

        customerId:
            payment.customerId,

        amount:
            payment.amount,

        currency:
            payment.currency,

        paymentMethod:
            payment.paymentMethod,

        status:
            payment.status,

        failureReason:
            payment.failureReason,

        attemptCount:
            payment.attemptCount,

        recoveredAmount:
            payment.recoveredAmount,

        scenario:
            payment.scenario,

        recoveryAction:
            payment.recoveryAction,

        recoveryResult:
            payment.recoveryResult,

        paymentLinkId:
            payment.paymentLinkId,

        paymentLinkUrl:
            payment.paymentLinkUrl
    };
};


// Get latest agent run + current payment for a payment

const getAgentRun = async (req, res) => {

    try {

        const { paymentId } = req.params;



        // Fetch both pieces of information together.

        // AgentRun = historical recovery timeline
        // Payment  = current authoritative payment state

        const [agentRun, payment] =
            await Promise.all([

                AgentRun.findOne({
                    paymentId
                })
                    .sort({
                        createdAt: -1
                    })
                    .lean(),

                Payment.findOne({
                    paymentId
                }).lean()

            ]);


        if (!agentRun) {

            return res.status(404).json({
                message:
                    "No agent run found for this payment",

                payment:
                    serializePayment(payment)
            });
        }


        res.json({

            success: true,

            run: agentRun,

            // Always return the current payment state.

            payment:
                serializePayment(payment)

        });

    } catch (error) {

        console.error(
            "Agent run fetch error:",
            error
        );

        res.status(500).json({

            message:
                "Failed to fetch agent run",

            error:
                error.message

        });

    }
};


// AI Control Room

const getControlRoom = async (req, res) => {

    try {
        // GET ALL AGENT RUNS

        const runs = await AgentRun.find({}).sort({ createdAt: -1 }).lean();


        // LATEST RUN PER PAYMENT
        // A payment can have multiple recovery runs.

        const latestRunByPayment =
            new Map();


        for (const run of runs) {

            if ( !latestRunByPayment.has( run.paymentId ) ) {

                latestRunByPayment.set(
                    run.paymentId,
                    run
                );
            }
        }


        const latestRuns = [...latestRunByPayment.values()];


        // OVERALL AGENT METRICS

        const evaluated =
            latestRuns.length;


        const recovered =
            latestRuns.filter(
                (run) =>
                    run.status ===
                    "RECOVERED"
            ).length;


        const escalated =
            latestRuns.filter(
                (run) =>
                    run.status ===
                    "ESCALATED"
            ).length;


        const blocked =
            latestRuns.filter(
                (run) =>
                    run.status ===
                    "BLOCKED"
            ).length;


        const stopped =
            latestRuns.filter(
                (run) =>
                    run.status ===
                    "STOPPED"
            ).length;


        const failed =
            latestRuns.filter(
                (run) =>
                    run.status ===
                    "FAILED"
            ).length;


        // RECENT ACTIVITY

        const paymentIds = runs.map( (run) => run.paymentId ).filter(Boolean);


        const payments =
            paymentIds.length > 0
                ? await Payment.find({
                    paymentId: {
                        $in: paymentIds
                    }
                }).lean()
                : [];


        const paymentById =
            new Map(
                payments.map(
                    (payment) => [
                        payment.paymentId,
                        payment
                    ]
                )
            );


        const recentRuns =
            runs
                .slice(0, 20)
                .map((run) => {

                    /*
                     * ------------------------------------------------
                     * IMPORTANT:
                     *
                     * Use the LAST ACTION step.
                     *
                     * Retry recovery can contain:
                     *
                     * ACTION retry 1
                     * ACTION retry 2
                     * ACTION retry 3
                     *
                     * Array.find() would incorrectly return retry 1.
                     * ------------------------------------------------
                     */

                    const actionSteps =
                        run.steps?.filter(
                            (step) =>
                                step.type ===
                                "ACTION"
                        ) || [];


                    const actionStep =
                        actionSteps.length > 0
                            ? actionSteps[
                                actionSteps.length - 1
                            ]
                            : null;

                    // DECISION

                    const decisionStep =
                        run.steps?.find(
                            (step) =>
                                step.type ===
                                "DECISION"
                        );


                    // POLICY

                    const policySteps =
                        run.steps?.filter(
                            (step) =>
                                step.type ===
                                "POLICY"
                        ) || [];


                    const policyStep =
                        policySteps.length > 0
                            ? policySteps[
                                policySteps.length - 1
                            ]
                            : null;


                    // TERMINAL

                    const terminalSteps =
                        run.steps?.filter(
                            (step) =>
                                step.type ===
                                "TERMINAL"
                        ) || [];


                    const terminalStep =
                        terminalSteps.length > 0
                            ? terminalSteps[
                                terminalSteps.length - 1
                            ]
                            : null;


                    // CURRENT PAYMENT

                    const currentPayment =
                        paymentById.get(
                            run.paymentId
                        ) || null;

                    // RETURN CONTROL ROOM RUN

                    return {

                        runId:
                            run.runId,

                        paymentId:
                            run.paymentId,


                        // Identifies whether this run came from, normal AI Recovery or Voice Recovery.

                        source:
                            run.source ||
                            "AI_RECOVERY",


                        // Allows the Control Room to associate, a Voice Recovery run with its conversation.

                        voiceSessionId:
                            run.voiceSessionId ||
                            null,

                        status:
                            run.status,

                        startedAt:
                            run.startedAt,

                        completedAt:
                            run.completedAt,


                        // CURRENT PAYMENT

                        payment:
                            serializePayment(
                                currentPayment
                            ),

                        // AI DECISION

                        decision:
                            decisionStep
                                ? {

                                    action:
                                        decisionStep
                                            .output
                                            ?.action ||
                                        null,

                                    confidence:
                                        decisionStep
                                            .confidence ??
                                        decisionStep
                                            .output
                                            ?.confidence ??
                                        null,

                                    reason:
                                        decisionStep
                                            .reason ||
                                        decisionStep
                                            .output
                                            ?.reason ||
                                        null,

                                    summary:
                                        decisionStep
                                            .output
                                            ?.summary ||
                                        null,

                                    whyThisDecision:
                                        decisionStep
                                            .output
                                            ?.whyThisDecision ||
                                        null,

                                    whatHappensNext:
                                        decisionStep
                                            .output
                                            ?.whatHappensNext ||
                                        null

                                }
                                : null,


                        // POLICY / SAFETY CHECK

                        policy:
                            policyStep
                                ? {

                                    action:
                                        policyStep
                                            .output
                                            ?.finalAction ||
                                        policyStep
                                            .output
                                            ?.stopResult
                                            ?.policyDecision
                                            ?.finalAction ||
                                        null,

                                    allowed:
                                        policyStep
                                            .output
                                            ?.allowed ??
                                        policyStep
                                            .output
                                            ?.policyDecision
                                            ?.allowed ??
                                        policyStep
                                            .output
                                            ?.stopResult
                                            ?.policyDecision
                                            ?.allowed ??
                                        null,

                                    reason:
                                        policyStep
                                            .reason ||
                                        policyStep
                                            .output
                                            ?.reason ||
                                        policyStep
                                            .output
                                            ?.policyDecision
                                            ?.reason ||
                                        policyStep
                                            .output
                                            ?.stopResult
                                            ?.policyDecision
                                            ?.reason ||
                                        null,

                                    circuitBreakerTriggered:
                                        policyStep
                                            .output
                                            ?.circuitBreakerTriggered ??
                                        false,

                                    attemptsMade:
                                        policyStep
                                            .output
                                            ?.attemptsMade ??
                                        policyStep
                                            .input
                                            ?.attemptsMade ??
                                        null,

                                    maxAttempts:
                                        policyStep
                                            .output
                                            ?.maxAttempts ??
                                        policyStep
                                            .input
                                            ?.maxAttempts ??
                                        null

                                }
                                : null,


                        // ACTION

                        action:
                            actionStep
                                ? {

                                    tool:
                                        actionStep.tool ||
                                        null,

                                    output:
                                        actionStep.output ||
                                        null,

                                    requestedAction:
                                        actionStep
                                            .input
                                            ?.requestedAction ||
                                        null,

                                    attemptNumber:
                                        actionStep
                                            .input
                                            ?.attemptNumber ??
                                        null

                                }
                                : null,


                        // FINAL RESULT

                        result:
                            terminalStep
                                ? {

                                    output:
                                        terminalStep.output ||
                                        null,

                                    reason:
                                        terminalStep.reason ||
                                        null,

                                    status:
                                        terminalStep
                                            .output
                                            ?.status ||
                                        run.status,

                                    executedAction:
                                        terminalStep
                                            .output
                                            ?.executedAction ||
                                        terminalStep.tool ||
                                        null,

                                    attemptsMade:
                                        terminalStep
                                            .output
                                            ?.attemptsMade ??
                                        currentPayment
                                            ?.attemptCount ??
                                        null

                                }
                                : null

                    };

                });


        // RESPONSE

        res.json({

            success: true,

            agent: {
                status:
                    "ONLINE"
            },

            summary: {

                evaluated,
                recovered,
                escalated,
                blocked,
                stopped,
                failed
            },

            recentRuns

        });


    } catch (error) {

        console.error(
            "Control room fetch error:",
            error
        );

        res.status(500).json({

            message:
                "Failed to fetch control room data",

            error:
                error.message

        });

    }

};


module.exports = {
    getAgentRun,
    getControlRoom
};