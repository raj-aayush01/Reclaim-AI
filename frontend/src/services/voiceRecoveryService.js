import api from "./api";

export const sendVoiceRecoveryMessage = async (
    paymentId,
    message,
    history = [],
    phase = "INTRO",
    voiceSessionId = null
) => {
    const response = await api.post(
        `/agent/voice/${paymentId}`,
        {
            message,
            history,
            phase,
            voiceSessionId
        }
    );

    return response.data;
};