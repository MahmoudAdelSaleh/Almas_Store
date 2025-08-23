import { ReportsController } from "./reports.js";

export const DOM = {
    appContainer: document.getElementById("app-container"),
    loginContainer: document.getElementById("login-container"),
    loginForm: document.getElementById("login-form"),
    usernameInput: document.getElementById("usernameInput"),
    passwordInput: document.getElementById("passwordInput"),
    logoutBtn: document.getElementById("logoutBtn"),
    navButtons: document.querySelectorAll("nav button"),
    sections: document.querySelectorAll("main section"),
    customerNameInput: document.getElementById("customerName"),
    customerSuggestionsDiv: document.getElementById("customerSuggestions"),
    searchItemInput: document.getElementById("searchItem"),
    searchResultsDiv: document.getElementById("searchResults"),
    scanBarcodeBtn: document.getElementById("scanBarcodeBtn"),
    barcodeScannerContainer: document.getElementById("barcode-scanner-container"),
    closeScannerBtn: document.getElementById("closeScannerBtn"),
    quantitySelect: document.getElementById("quantitySelect"),
    addToInvoiceBtn: document.getElementById("addToInvoiceBtn"),
    invoiceTable: document.getElementById("invoiceTable"),
    invoiceTotalSpan: document.getElementById("invoiceTotal"),
    saveInvoiceBtn: document.getElementById("saveInvoiceBtn"),
    printInvoiceBtn: document.getElementById("printInvoiceBtn"),
    paymentMethodSelect: document.getElementById("paymentMethodSelect"),
    amountPaidInput: document.getElementById("amountPaidInput"),
    changeTextSpan: document.getElementById("changeText"),
    changeAmountSpan: document.getElementById("changeAmount"),
    notificationContainer: document.getElementById("notification-container"),
    itemsTable: document.getElementById("itemsTable"),
    invoicesList: document.getElementById("invoicesList"),
    summaryContent: document.getElementById("summaryContent"),
};

export const Helpers = {
    showNotification: (message, duration = 3000) => {
        const el = document.createElement("div");
        el.className = "notification";
        el.textContent = message;
        DOM.notificationContainer.appendChild(el);
        setTimeout(() => el.classList.add("show"), 10);
        setTimeout(() => {
            el.classList.remove("show");
            setTimeout(() => el.remove(), 500);
        }, duration);
    },
    convertToArabicAndEnglishDigits: (text) => {
        if (!text) return "";
        return text.toString().replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
    },
    calculateChange: () => {
        const total = parseFloat(DOM.invoiceTotalSpan.textContent) || 0;
        const paid = parseFloat(DOM.amountPaidInput.value) || 0;
        const change = paid - total;
        DOM.changeTextSpan.textContent = change >= 0 ? "الباقي للعميل:" : "المطلوب منه:";
        DOM.changeAmountSpan.textContent = Math.abs(change).toFixed(2);
    },
    switchTab: (tabId, appState) => {
        DOM.sections.forEach(s => s.classList.toggle("active", s.id === tabId));
        DOM.navButtons.forEach(b => b.classList.toggle("active", b.dataset.tab === tabId));
        if (tabId === 'invoices') ReportsController.renderInvoices(appState);
        if (tabId === 'summary') ReportsController.renderSummary(appState);
    }
};
