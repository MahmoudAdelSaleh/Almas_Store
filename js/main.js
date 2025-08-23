import { Auth } from './auth.js';
import { SalesController } from './sales.js';
import { ItemsController } from './items.js';
import { CustomersController } from './customers.js';
import { ReportsController } from './reports.js';
import { UsersController } from './users.js';
import { DOM, Helpers } from './ui.js';
import { readCollection, getDocument, addDocument } from './firebase.js';

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
        } else {
            // عرض قالب تسجيل الدخول إذا لم يكن هناك مستخدم مسجل
            DOM.loginContainer.innerHTML = Auth.getTemplate();
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
        // استخدام event delegation لنموذج تسجيل الدخول
        document.body.addEventListener('submit', e => {
            if (e.target.id === 'login-form') {
                e.preventDefault();
                Auth.login(DOM.usernameInput().value, DOM.passwordInput().value, appState);
            }
        });
        
        DOM.logoutBtn.addEventListener("click", Auth.logout);
        
        DOM.navButtons.forEach(btn => btn.addEventListener("click", e => {
            const tabId = e.currentTarget.dataset.tab;
            Helpers.switchTab(tabId, appState);
        }));

        // --- الأسطر المفقودة التي تم إضافتها ---
        // هذه الأسطر ضرورية لتفعيل الأزرار والوظائف في كل قسم
        SalesController.bindEvents(appState);
        ItemsController.bindEvents(appState);
        CustomersController.bindEvents(appState);
        UsersController.bindEvents(appState);
        // ------------------------------------
    }
};

App.init();

// دالة استيراد الأصناف (تبقى اختيارية للاستخدام من الـ Console)
window.importItemsFromJSON = async function() {
    if (!confirm("هل أنت متأكد أنك تريد استيراد الأصناف من ملف p.json؟ هذه العملية ستقوم بإضافة كل الأصناف إلى قاعدة البيانات.")) return;
    try {
        const { db } = await import('./firebase.js');
        const { writeBatch, doc, collection } = await import("https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js");
        
        console.log("بدء عملية الاستيراد...");
        const response = await fetch('p.json');
        if (!response.ok) throw new Error('لا يمكن تحميل ملف p.json. تأكد من وجوده بجانب ملف index.html');
        
        const itemsData = await response.json();
        const itemsToImport = itemsData.filter(item => item.status === true).map(item => ({
            code: item.sku, name: item.name, price: parseFloat(item.price) || 0,
            category: item["category "]?.trim() || "غير مصنف", unit: "قطعة", stock: 999
        }));

        if (itemsToImport.length === 0) {
            alert("لم يتم العثور على أصناف صالحة للاستيراد في ملف p.json.");
            return;
        }

        console.log(`تم العثور على ${itemsToImport.length} صنف سيتم استيرادها.`);

        let batch = writeBatch(db);
        const itemsRef = collection(db, "items");
        let counter = 0;

        for (const item of itemsToImport) {
            const docRef = doc(itemsRef);
            batch.set(docRef, item);
            counter++;
            if (counter % 499 === 0) {
               await batch.commit();
               batch = writeBatch(db);
               console.log(`تم حفظ ${counter} صنف...`);
            }
        }
        await batch.commit();

        alert(`✅ اكتمل الاستيراد بنجاح! تم إضافة ${itemsToImport.length} صنف.`);
        location.reload();
    } catch (error) {
        console.error("فشل الاستيراد:", error);
        alert("فشلت عملية الاستيراد. تحقق من الـ Console لمزيد من التفاصيل.");
    }
};
