const express = require("express");

const {
    getSubscriptions,
    getSubscriptionById
} = require("../controllers/subscriptionController");

const router = express.Router();

router.get("/", getSubscriptions);
router.get("/:subscriptionId", getSubscriptionById);

module.exports = router;