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
    usernameInput: () => document.getElementById("usernameInput"),
    passwordInput: () => document.getElementById("passwordInput"),
    // ... other elements will be selected within their controllers
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
        
        // Re-initialize or render data after loading the template
        if (tabId === 'sales') SalesController.init(appState);
        if (tabId === 'items') ItemsController.init(appState);
        if (tabId === 'customers') CustomersController.init(appState);
        if (tabId === 'users') UsersController.init(appState);
        if (tabId === 'invoices') ReportsController.renderInvoices(appState);
        if (tabId === 'summary') ReportsController.renderSummary(appState);
    }
};
