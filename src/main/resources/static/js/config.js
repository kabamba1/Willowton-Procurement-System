const API_BASE_URL = "https://willowton-pms.onrender.com/api";

// Global Currency Formatter
function formatZMW(amount) {
    return new Intl.NumberFormat('en-ZM', {
        style: 'currency',
        currency: 'ZMW',
        minimumFractionDigits: 2
    }).format(amount || 0);
}