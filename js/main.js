import { db } from './firebase.js';
import { Auth } from './auth.js';
import { SalesController } from './sales.js';
import { ReportsController } from './reports.js';
import { DOM, Helpers } from './ui.js';

// الحالة العامة للتطبيق
const appState = {
    items: [], invoices: [], customers: [], users: [], adminPIN: null, currentUser: null,
    currentInvoice: [], selectedItem: null, selectedCustomer: null, html5QrCode: null
};

// وحدة التطبيق الرئيسية
const App = {
    init: async () => {
        App.bindEvents();
        App.listenToFirebase();

        // تحميل الأصناف من ملف p.json
        try {
            const response = await fetch('../p.json'); // Note the ../ to go up one directory
            appState.items = await response.json();
            // عرض الأصناف في تبويب الأصناف للعرض فقط
            document.getElementById("itemsTable").innerHTML = appState.items
                .map(item => `<tr><td>${item.sku}</td><td>${item.name}</td><td>${item.price.toFixed(2)}</td><td>${item['category ']}</td></tr>`)
                .join('');
        } catch (error) {
            console.error("Could not load p.json", error);
            Helpers.showNotification("فشل تحميل ملف الأصناف p.json", 5000);
        }
        
        // التحقق من وجود مستخدم مسجل
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            appState.currentUser = JSON.parse(savedUser);
            Auth.showApp(appState.currentUser.role, appState);
        }

        // ملء قائمة الكميات
        for (let i = 1; i <= 100; i++) {
            DOM.quantitySelect.innerHTML += `<option value="${i}">${i}</option>`;
        }
    },

    listenToFirebase: () => {
        window.readCollection("customers", data => appState.customers = data, "name", "asc");
        window.readCollection("invoices", data => { 
            appState.invoices = data; 
            if(document.getElementById('invoices').classList.contains('active')) ReportsController.renderInvoices(appState);
            if(document.getElementById('summary').classList.contains('active')) ReportsController.renderSummary(appState);
        });
        window.readCollection("users", data => appState.users = data, "username", "asc");
        window.getDocument("config", "admin").then(doc => { 
            appState.adminPIN = doc?.pin || "790707071"; 
        });
    },

    bindEvents: () => {
        DOM.loginForm.addEventListener("submit", e => { 
            e.preventDefault(); 
            Auth.login(DOM.usernameInput.value, DOM.passwordInput.value, appState); 
        });

        DOM.logoutBtn.addEventListener("click", Auth.logout);

        DOM.navButtons.forEach(btn => btn.addEventListener("click", e => {
            const tabId = e.currentTarget.dataset.tab;
            Helpers.switchTab(tabId, appState);
        }));

        SalesController.bindSalesEvents(appState);
    }
};

App.init();
