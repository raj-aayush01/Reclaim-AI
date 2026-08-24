const {
    generateCustomersAndPayments
} = require("../services/paymentSimulator");

const generateDemoData = async (req, res) => {
    try {
        const count = Number(req.body.count) || 200;

        if (count < 1 || count > 1000) {
            return res.status(400).json({
                message: "Count must be between 1 and 1000"
            });
        }

        const result = await generateCustomersAndPayments(count);

        res.status(201).json({
            message: "Demo payment data generated successfully",
            ...result
        });
    } catch (error) {
        console.error("Simulator error:", error);

        res.status(500).json({
            message: "Failed to generate demo data",
            error: error.message
        });
    }
};

module.exports = {
    generateDemoData
};