const AgentRun = require("../models/AgentRun");

// Get latest agent run for a specific payment

const getAgentRun = async (req, res) => {
    try {

        const { paymentId } = req.params;

        const agentRun = await AgentRun.findOne({
            paymentId
        }).sort({
            createdAt: -1
        });

        if (!agentRun) {
            return res.status(404).json({
                message: "No agent run found for this payment"
            });
        }

        res.json({
            success: true,
            run: agentRun
        });

    } catch (error) {

        console.error(
            "Agent run fetch error:",
            error
        );

        res.status(500).json({
            message: "Failed to fetch agent run",
            error: error.message
        });
    }
};


// AI Control Room

const getControlRoom = async (req, res) => {

    try {

        /*
         * -------------------------------------------------------
         * GET ALL AGENT RUNS
         * -------------------------------------------------------
         *
         * Newest runs are returned first.
         */
        const runs = await AgentRun.find({})
            .sort({
                createdAt: -1
            })
            .lean();


        /*
         * -------------------------------------------------------
         * LATEST RUN PER PAYMENT
         * -------------------------------------------------------
         *
         * A payment can have multiple recovery runs.
         *
         * Because the runs are sorted newest -> oldest,
         * the first run encountered for a payment is its
         * latest recovery outcome.
         *
         * Overall metrics use only these latest runs so that
         * one payment is counted only once.
         */

        const latestRunByPayment = new Map();

        for (const run of runs) {

            if (!latestRunByPayment.has(run.paymentId)) {

                latestRunByPayment.set(
                    run.paymentId,
                    run
                );

            }
        }

        const latestRuns = [
            ...latestRunByPayment.values()
        ];


        /*
         * -------------------------------------------------------
         * OVERALL AGENT METRICS
         * -------------------------------------------------------
         */

        const evaluated =
            latestRuns.length;


        const recovered =
            latestRuns.filter(
                (run) =>
                    run.status === "RECOVERED"
            ).length;


        const escalated =
            latestRuns.filter(
                (run) =>
                    run.status === "ESCALATED"
            ).length;


        const blocked =
            latestRuns.filter(
                (run) =>
                    run.status === "BLOCKED"
            ).length;


        const stopped =
            latestRuns.filter(
                (run) =>
                    run.status === "STOPPED"
            ).length;


        const failed =
            latestRuns.filter(
                (run) =>
                    run.status === "FAILED"
            ).length;


        /*
         * -------------------------------------------------------
         * RECENT ACTIVITY
         * -------------------------------------------------------
         *
         * The AgentRun model uses:
         *
         * OBSERVATION
         * DECISION
         * ACTION
         * POLICY
         * TERMINAL
         *
         * There is currently no RESULT step in recoveryAgent.js.
         *
         * Therefore, the terminal step is exposed to the
         * frontend as the final result.
         */

        const recentRuns = runs
            .slice(0, 20)
            .map((run) => {

                const decisionStep =
                    run.steps?.find(
                        (step) =>
                            step.type === "DECISION"
                    );


                const policyStep =
                    run.steps?.find(
                        (step) =>
                            step.type === "POLICY"
                    );


                const actionStep =
                    run.steps?.find(
                        (step) =>
                            step.type === "ACTION"
                    );


                /*
                 * The recovery agent records the final outcome
                 * using TERMINAL rather than RESULT.
                 *
                 * Find the last terminal step because a run can
                 * contain multiple steps.
                 */

                const terminalSteps =
                    run.steps?.filter(
                        (step) =>
                            step.type === "TERMINAL"
                    ) || [];


                const terminalStep =
                    terminalSteps.length > 0
                        ? terminalSteps[
                              terminalSteps.length - 1
                          ]
                        : null;


                /*
                 * Build the Control Room representation.
                 */

                return {

                    runId:
                        run.runId,

                    paymentId:
                        run.paymentId,

                    status:
                        run.status,

                    startedAt:
                        run.startedAt,

                    completedAt:
                        run.completedAt,


                    /*
                     * AI DECISION
                     */

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
                                      null,

                                  reason:
                                      decisionStep
                                          .reason ||
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


                    /*
                     * POLICY / GUARDRAIL
                     */

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
                                          ?.executionResult
                                          ?.result ||
                                      null,

                                  allowed:
                                      policyStep
                                          .output
                                          ?.allowed ??
                                      policyStep
                                          .output
                                          ?.stopResult
                                          ?.policyDecision
                                          ?.allowed ??
                                      false,

                                  reason:
                                      policyStep
                                          .reason ||
                                      policyStep
                                          .output
                                          ?.stopResult
                                          ?.policyDecision
                                          ?.reason ||
                                      null,

                                  circuitBreakerTriggered:
                                      policyStep
                                          .output
                                          ?.circuitBreakerTriggered ||
                                      false,

                                  attemptsMade:
                                      policyStep
                                          .output
                                          ?.attemptsMade ??
                                      null,

                                  maxAttempts:
                                      policyStep
                                          .input
                                          ?.maxAttempts ??
                                      null

                              }
                            : null,


                    /*
                     * ACTION
                     *
                     * Find the most recent ACTION step because
                     * retry-based recovery can contain multiple
                     * ACTION steps.
                     */

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


                    /*
                     * FINAL RESULT
                     *
                     * Derived from the TERMINAL step.
                     */

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
                                      null

                              }
                            : null

                };

            });


        /*
         * -------------------------------------------------------
         * RESPONSE
         * -------------------------------------------------------
         */

        res.json({

            success: true,

            agent: {
                status: "ONLINE"
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