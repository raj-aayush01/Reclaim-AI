import { useState } from "react";
import { runAIRecovery as triggerRecovery } from "../services/recoveryService";

export const useRecovery = () => {
    const [executing, setExecuting] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const executeRecovery = async (paymentId) => {
        if (!paymentId) return;

        setExecuting(true);
        setError(null);
        setResult(null);

        try {
            const data = await triggerRecovery(paymentId);
            setResult(data.result || data);
            return data.result || data;
        } catch (err) {
            console.error("useRecovery error:", err);
            setError(err.message || "Failed to execute AI recovery pipeline");
            throw err;
        } finally {
            setExecuting(false);
        }
    };

    const clearResult = () => {
        setResult(null);
        setError(null);
    };

    return {
        executeRecovery,
        executing,
        result,
        error,
        clearResult
    };
};
