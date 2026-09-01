const { runRecoveryAgent } = require("./agent/recoveryAgent");
const {
    syncSubscriptionAfterRecovery
} = require("./subscriptionSync");

const runRecovery = async (paymentId) => {

    const result =
        await runRecoveryAgent(paymentId);

    let subscription = null;

    if (result?.payment) {
        subscription =
            await syncSubscriptionAfterRecovery(
                result.payment
            );
    }

    return {
        ...result,
        subscription
    };
};

module.exports = {
    runRecovery
};