/**
 * Formats a number to Indian Rupee standard format (e.g. 2685275 => ₹26,85,275)
 * @param {number|string} amount 
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return "₹0";
    }

    const num = Number(amount);

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(num);
};

/**
 * Formats large amounts to dynamic abbreviated forms (e.g., ₹2.68M or ₹45.2K)
 * @param {number} amount 
 * @returns {string}
 */
export const formatCompactCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return "₹0";
    }

    const num = Number(amount);

    if (num >= 10000000) {
        return `₹${(num / 10000000).toFixed(2)}Cr`;
    }
    if (num >= 100000) {
        return `₹${(num / 100000).toFixed(2)}L`;
    }
    if (num >= 1000) {
        return `₹${(num / 1000).toFixed(1)}k`;
    }

    return `₹${num.toLocaleString("en-IN")}`;
};
