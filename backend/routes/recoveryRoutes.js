const express = require("express");

const {
    getPolicyFirings
} = require("../controllers/recoveryController");

const router = express.Router();

router.get(
    "/policy-firings",
    getPolicyFirings
);

module.exports = router;