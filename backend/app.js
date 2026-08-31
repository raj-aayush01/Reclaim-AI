const express = require("express");
const cors = require("cors");

const simulatorRoutes = require("./routes/simulatorRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const agentRoutes = require("./routes/agentRoutes");
const paymentLinkRoutes = require("./routes/paymentLinkRoutes");
const testRecoveryRoutes = require("./routes/testRecoveryRoutes");
const recoveryRoutes = require("./routes/recoveryRoutes");

const app = express();

app.use(cors());

app.use(express.json());

app.use("/api/simulator", simulatorRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/agent", agentRoutes);
app.use("/api/payment-links", paymentLinkRoutes);
app.use("/api/test", testRecoveryRoutes);
app.use("/api/recovery", recoveryRoutes);

app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        message: "ReclaimAI backend is running"
    });
});

module.exports = app;