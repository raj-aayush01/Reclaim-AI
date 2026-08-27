const express = require("express");

const {
    completePaymentLink
} = require("../services/paymentLinkService");

const router = express.Router();

router.post("/complete/:paymentLinkId", async (req, res) => {

    try {

        const { paymentLinkId } = req.params;

        const result =
            await completePaymentLink(paymentLinkId);

        res.status(200).json({
            message: "Payment link processed successfully",
            result
        });

    } catch (error) {

        console.error(
            "Payment link completion error:",
            error
        );

        res.status(500).json({
            message: "Failed to process payment link",
            error: error.message
        });
    }
});

module.exports = router;