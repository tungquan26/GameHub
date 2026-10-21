export function showToast(message, isError = false) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const item = document.createElement('div');
    item.className = `toast-msg \${isError ? 'error' : ''}`;
    item.textContent = message;
    container.appendChild(item);
    setTimeout(() => item.remove(), 3000);
}