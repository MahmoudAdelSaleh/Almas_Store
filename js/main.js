import { db, addDocument, readCollection, updateDocument, deleteDocument, getDocument } from './firebase.js';
import { Auth } from './auth.js';
import { SalesController } from './sales.js';
import { ItemsController } from './items.js';
import { CustomersController } from './customers.js';
import { ReportsController } from './reports.js';
import { UsersController } from './users.js';
import { DOM, Helpers } from './ui.js';

// الحالة العامة للتطبيق
const appState = {
    items: [], invoices: [], customers: [], users: [], adminPIN: null, currentUser: null,
    currentInvoice: [], deliveryFee: 30, editingItemId: null, editingCustomerId: null,
    editingUserId: null, selectedCustomer: null, allCategories: [], 
    categoryCurrentPage: 1, categoriesPerPage: 20, html5QrCode: null
};

// وحدة التطبيق الرئيسية
const App = {
    init: () => {
        App.bindEvents();
        App.listenToFirebase();
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            appState.currentUser = JSON.parse(savedUser);
            Auth.showApp(appState.currentUser.role);
        }
    },
    listenToFirebase: () => {
        readCollection("items", data => { 
            appState.items = data; 
            appState.allCategories = [...new Set(data.map(item => item.category).filter(Boolean))].sort(); 
            if(document.getElementById('items').classList.contains('active')) ItemsController.render(appState); 
        }, "name", "asc");

        readCollection("customers", data => { appState.customers = data; if(document.getElementById('customers').classList.contains('active')) CustomersController.render(appState); }, "name", "asc");
        readCollection("invoices", data => { appState.invoices = data; if(document.getElementById('invoices').classList.contains('active')) ReportsController.renderInvoices(appState); if(document.getElementById('summary').classList.contains('active')) ReportsController.renderSummary(appState);}, "createdAt", "desc");
        readCollection("users", data => { appState.users = data; if(document.getElementById('users').classList.contains('active')) UsersController.render(appState); }, "username", "asc");
        getDocument("config", "admin").then(doc => { appState.adminPIN = doc?.pin || "790707071"; });
    },
    bindEvents: () => {
        DOM.loginForm.addEventListener("submit", e => { e.preventDefault(); Auth.login(DOM.usernameInput.value, DOM.passwordInput.value, appState); });
        DOM.logoutBtn.addEventListener("click", Auth.logout);
        DOM.navButtons.forEach(btn => btn.addEventListener("click", e => {
            const tabId = e.currentTarget.dataset.tab;
            Helpers.switchTab(tabId, appState);
        }));

        SalesController.bindEvents(appState);
        ItemsController.bindEvents(appState);
        CustomersController.bindEvents(appState);
        UsersController.bindEvents(appState);
    }
};

App.init();
