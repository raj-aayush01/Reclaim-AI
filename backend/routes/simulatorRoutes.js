const express = require("express");

const {
    generateDemoData
} = require("../controllers/simulatorController");

const router = express.Router();

router.post("/generate", generateDemoData);

module.exports = router;