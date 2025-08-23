import { SalesController } from "./sales.js";
import { ItemsController } from "./items.js";
import { CustomersController } from "./customers.js";
import { ReportsController } from "./reports.js";
import { UsersController } from "./users.js";

export const DOM = { /* ... انسخ كل عناصر DOM من الرد السابق ... */ };

export const Helpers = {
    showNotification: (message, duration = 3000) => { /* ... */ },
    convertToArabicAndEnglishDigits: (text) => { /* ... */ },
    calculateChange: () => { /* ... */ },
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
        
        // إعادة تهيئة الحالة أو عرض البيانات بعد تحميل القالب
        if (tabId === 'sales') SalesController.init(appState);
        if (tabId === 'items') ItemsController.render(appState);
        if (tabId === 'customers') CustomersController.render(appState);
        if (tabId === 'users') UsersController.render(appState);
        if (tabId === 'invoices') ReportsController.renderInvoices(appState);
        if (tabId === 'summary') ReportsController.renderSummary(appState);
    }
};
