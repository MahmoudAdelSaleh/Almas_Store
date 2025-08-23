import { SalesController } from "./sales.js";
import { ItemsController } from "./items.js";
import { CustomersController } from "./customers.js";
import { ReportsController } from "./reports.js";
import { UsersController } from "./users.js";

// DOM elements are accessed via functions to ensure they exist after template loading
export const DOM = {
    appContainer: document.getElementById("app-container"),
    loginContainer: document.getElementById("login-container"),
    logoutBtn: document.getElementById("logoutBtn"),
    navButtons: document.querySelectorAll("nav button"),
    sections: document.querySelectorAll("main section"),
    notificationContainer: document.getElementById("notification-container"),
    // We use functions for elements inside sections because they are loaded dynamically
    usernameInput: () => document.getElementById("usernameInput"),
    passwordInput: () => document.getElementById("passwordInput"),
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
        const totalEl = document.getElementById('invoiceTotal');
        const paidEl = document.getElementById('amountPaidInput');
        if (!totalEl || !paidEl) return;

        const total = parseFloat(totalEl.textContent) || 0;
        const paid = parseFloat(paidEl.value) || 0;
        const change = paid - total;
        document.getElementById('changeText').textContent = change >= 0 ? "الباقي للعميل:" : "المطلوب منه:";
        document.getElementById('changeAmount').textContent = Math.abs(change).toFixed(2);
    },
    switchTab: (tabId, appState) => {
        DOM.sections.forEach(s => s.classList.toggle("active", s.id === tabId));
        DOM.navButtons.forEach(b => b.classList.toggle("active", b.dataset.tab === tabId));

        const templates = {
            sales: SalesController.getTemplate(),
            items: ItemsController.getTemplate(),
            customers: CustomersController.getTemplate(),
            users: UsersController.getTemplate(),
            invoices: ReportsController.getInvoicesTemplate(),
            summary: ReportsController.getSummaryTemplate(),
        };

        const section = document.getElementById(tabId);
        if (section && templates[tabId]) {
            section.innerHTML = templates[tabId];
        }
        
        // Call the init function for the specific controller after its template is loaded
        if (tabId === 'sales') SalesController.init(appState);
        if (tabId === 'items') ItemsController.init(appState);
        if (tabId === 'customers') CustomersController.init(appState);
        if (tabId === 'users') UsersController.init(appState);
        if (tabId === 'invoices') ReportsController.renderInvoices(appState);
        if (tabId === 'summary') ReportsController.renderSummary(appState);
    }
};
