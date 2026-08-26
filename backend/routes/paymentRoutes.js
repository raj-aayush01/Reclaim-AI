const express = require("express");
const {
    getPayments,
    getPaymentById
} = require("../controllers/paymentController");

const router = express.Router();

router.get("/", getPayments);
router.get("/:paymentId", getPaymentById);

module.exports = router;
