const { runRecoveryAgent } = require("./agent/recoveryAgent");

const runRecovery = async (paymentId) => {

    return await runRecoveryAgent(paymentId);

};

module.exports = {
    runRecovery
};