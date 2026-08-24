const express = require("express");

const {
    analyzePaymentWithAI,
    analyzeStoredPayment,
    runAIRecoveryForPayment
} = require("../controllers/aiController");

const router = express.Router();

router.post("/analyze", analyzePaymentWithAI);

router.post("/analyze/:paymentId", analyzeStoredPayment);

router.post(
    "/recovery/:paymentId",
    runAIRecoveryForPayment
);

module.exports = router;