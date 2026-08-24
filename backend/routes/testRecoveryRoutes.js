const express = require("express");

const {
    createTestPayment
} = require("../controllers/testRecoveryController");

const router = express.Router();

router.post("/payment", createTestPayment);

module.exports = router;