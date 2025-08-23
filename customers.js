import { Helpers } from './ui.js';
import { addDocument, updateDocument, deleteDocument } from './firebase.js';

export const CustomersController = {
    getTemplate: () => `
        <h2><i class="fas fa-users"></i> إدارة العملاء</h2>
        <div class="form-group flex-container">
            <input type="text" id="newCustomerId" placeholder="رقم العميل" />
            <input type="text" id="newCustomerName" placeholder="اسم العميل" />
            <input type="tel" id="newCustomerPhone" placeholder="هاتف العميل" />
            <button id="saveCustomerBtn"><i class="fas fa-save"></i> حفظ العميل</button>
        </div>
        <div id="customersList"></div>
    `,

    init: (appState) => {
        CustomersController.render(appState);
        CustomersController.bindEvents(appState);
    },

    render: (appState) => {
        const customersList = document.getElementById("customersList");
        if(customersList) {
            customersList.innerHTML = appState.customers.map(cust => `
                <div class="customer-card">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                        <div><b>${cust.name}</b><br/><small>رقم: ${cust.customerId} | هاتف: ${cust.phone || 'غير مسجل'}</small></div>
                        <div class="flex-container">
                            <button class="btn-small btn-warning edit-customer-btn" data-id="${cust.id}"><i class="fas fa-edit"></i></button>
                            <button class="btn-small btn-danger delete-customer-btn" data-id="${cust.id}"><i class="fas fa-trash-alt"></i></button>
                        </div>
                    </div>
                </div>`
            ).join("");
        }
    },

    clearForm: () => {
        document.getElementById("newCustomerId").value = "";
        document.getElementById("newCustomerName").value = "";
        document.getElementById("newCustomerPhone").value = "";
        document.getElementById("saveCustomerBtn").innerHTML = '<i class="fas fa-save"></i> حفظ العميل';
    },

    save: async (appState) => {
        const customerData = {
            customerId: Helpers.convertToArabicAndEnglishDigits(document.getElementById("newCustomerId").value.trim()),
            name: document.getElementById("newCustomerName").value.trim(),
            phone: Helpers.convertToArabicAndEnglishDigits(document.getElementById("newCustomerPhone").value.trim())
        };
        if (!customerData.customerId || !customerData.name) { Helpers.showNotification("يرجى إدخال رقم واسم العميل."); return; }
        
        try {
            if (appState.editingCustomerId) {
                await updateDocument("customers", appState.editingCustomerId, customerData);
                Helpers.showNotification("تم تعديل العميل.");
            } else {
                await addDocument("customers", customerData);
                Helpers.showNotification("تم حفظ العميل.");
            }
            appState.editingCustomerId = null;
            CustomersController.clearForm();
        } catch (error) { 
            console.error("Error saving customer:", error);
            Helpers.showNotification("حدث خطأ."); 
        }
    },

    edit: (id, appState) => {
        const customer = appState.customers.find(c => c.id === id);
        if (!customer) return;
        document.getElementById("newCustomerId").value = customer.customerId;
        document.getElementById("newCustomerName").value = customer.name;
        document.getElementById("newCustomerPhone").value = customer.phone || "";
        appState.editingCustomerId = id;
        document.getElementById("saveCustomerBtn").innerHTML = '<i class="fas fa-edit"></i> تعديل';
    },

    delete: async (id) => {
        if (confirm("هل أنت متأكد من حذف هذا العميل؟")) {
            try {
                await deleteDocument("customers", id);
                Helpers.showNotification("تم حذف العميل.");
            } catch (error) { 
                console.error("Error deleting customer:", error);
                Helpers.showNotification("حدث خطأ."); 
            }
        }
    },

    bindEvents: (appState) => {
        const customersSection = document.getElementById('customers');
        if(!customersSection) return;

        customersSection.addEventListener('click', e => {
            const target = e.target.closest("button");
            if (!target) return;

            if (target.id === 'saveCustomerBtn') {
                CustomersController.save(appState);
                return;
            }

            const id = target.dataset.id;
            if (target.classList.contains("edit-customer-btn")) CustomersController.edit(id, appState);
            else if (target.classList.contains("delete-customer-btn")) CustomersController.delete(id);
        });
    }
};
