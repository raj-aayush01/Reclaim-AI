require("dotenv").config();

const mongoose = require("mongoose");

const Payment = require("./models/Payment");
const { runRecoveryAgent } = require("./services/agent/recoveryAgent");

const MONGO_URI = process.env.MONGO_URI;

const run = async () => {

    try {

        await mongoose.connect(MONGO_URI);

        console.log("MongoDB connected");

        const payment = await Payment.findOne({
            status: "failed",
            scenario: "TEMPORARY_FAILURE",
            amount: { $lt: 20000 },
            attemptCount: { $lt: 3 }
        });

        if (!payment) {

            console.log(
                "No suitable TEMPORARY_FAILURE payment found."
            );

            return;
        }

        console.log("\n==============================");
        console.log("STARTING RECOVERY AGENT");
        console.log("==============================\n");

        console.log(
            "Payment:",
            payment.paymentId
        );

        console.log(
            "Amount:",
            payment.amount,
            payment.currency
        );

        console.log(
            "Scenario:",
            payment.scenario
        );

        console.log(
            "Attempts:",
            payment.attemptCount
        );

        console.log(
            "Failure Reason:",
            payment.failureReason
        );

        console.log("\n------------------------------\n");

        const result =
            await runRecoveryAgent(
                payment.paymentId
            );

        console.log("\n==============================");
        console.log("AGENT FINISHED");
        console.log("==============================\n");

        console.log(result);

    } catch (error) {

        console.error(
            "\nAgent test failed:",
            error
        );

    } finally {

        await mongoose.disconnect();

        console.log(
            "\nMongoDB disconnected"
        );
    }
};

run();