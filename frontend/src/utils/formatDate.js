/**
 * Formats ISO date string to human-readable date and time format
 * @param {string|Date} dateInput 
 * @returns {string} Formatted date string
 */
export const formatDate = (dateInput) => {
    if (!dateInput) return "N/A";

    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return "Invalid Date";

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });
};

/**
 * Returns a relative time string (e.g. "5 mins ago", "2 hours ago")
 * @param {string|Date} dateInput 
 * @returns {string}
 */
export const formatRelativeTime = (dateInput) => {
    if (!dateInput) return "";

    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return "";

    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 30) return `${diffDays}d ago`;

    return formatDate(dateInput);
};
