import { Helpers } from './ui.js';
import { addDocument, updateDocument, deleteDocument } from './firebase.js';

export const ItemsController = {
    getTemplate: () => `
        <h2><i class="fas fa-box"></i> إدارة الأصناف</h2>
        <div class="form-group flex-container">
            <input type="text" id="itemCode" placeholder="الباركود" />
            <input type="text" id="itemName" placeholder="اسم الصنف" required />
            <input type="text" id="itemCategory" placeholder="الفئة" />
        </div>
        <div class="form-group flex-container">
            <input type="number" id="itemPrice" placeholder="السعر" min="0" step="0.01" required/>
            <input type="number" id="itemStock" placeholder="المخزون" min="0" />
            <input type="text" id="itemUnit" placeholder="الوحدة (قطعة، كجم)" />
            <button id="saveItemBtn"><i class="fas fa-save"></i> حفظ الصنف</button>
        </div>
        <table>
            <thead><tr><th>باركود</th><th>اسم</th><th>سعر</th><th>مخزون</th><th>فئة</th><th>تعديل</th><th>حذف</th></tr></thead>
            <tbody id="itemsTableBody"></tbody>
        </table>
    `,
    init: (appState) => {
        ItemsController.render(appState);
        ItemsController.bindEvents(appState);
    },
    render: (appState) => {
        const itemsTableBody = document.getElementById("itemsTableBody");
        if(itemsTableBody) {
            itemsTableBody.innerHTML = appState.items.map(item => 
                `<tr>
                    <td>${item.barcode || ''}</td>
                    <td>${item.name}</td>
                    <td>${(item.price || 0).toFixed(2)}</td>
                    <td>${item.stock || 0}</td>
                    <td>${item.category || ''}</td>
                    <td><button class="btn-small btn-warning edit-item-btn" data-id="${item.id}"><i class="fas fa-edit"></i></button></td>
                    <td><button class="btn-small btn-danger delete-item-btn" data-id="${item.id}"><i class="fas fa-trash-alt"></i></button></td>
                </tr>`
            ).join("");
        }
    },
    clearForm: () => {
        document.getElementById("itemCode").value = "";
        document.getElementById("itemName").value = "";
        document.getElementById("itemCategory").value = "";
        document.getElementById("itemPrice").value = "";
        document.getElementById("itemStock").value = "";
        document.getElementById("itemUnit").value = "";
        document.getElementById("saveItemBtn").innerHTML = '<i class="fas fa-save"></i> حفظ الصنف';
        document.getElementById("itemName").focus();
    },
    save: async (appState) => {
        const itemData = {
            // --- التعديل هنا ---
            barcode: document.getElementById("itemCode").value.trim(),
            name: document.getElementById("itemName").value.trim(),
            category: document.getElementById("itemCategory").value.trim(),
            price: parseFloat(document.getElementById("itemPrice").value) || 0,
            stock: parseInt(document.getElementById("itemStock").value) || 0,
            unit: document.getElementById("itemUnit").value.trim()
        };
        if (!itemData.name || !itemData.price) { Helpers.showNotification("يجب إدخال اسم وسعر الصنف."); return; }
        
        try {
            if (appState.editingItemId) {
                await updateDocument("items", appState.editingItemId, itemData);
                Helpers.showNotification("تم تعديل الصنف بنجاح.");
            } else {
                await addDocument("items", itemData);
                Helpers.showNotification("تم حفظ الصنف بنجاح.");
            }
            appState.editingItemId = null;
            ItemsController.clearForm();
        } catch (error) {
            console.error("Error saving item:", error);
            Helpers.showNotification("حدث خطأ أثناء حفظ الصنف.");
        }
    },
    edit: (id, appState) => {
        const item = appState.items.find(i => i.id === id);
        if (!item) return;
        // --- التعديل هنا ---
        document.getElementById("itemCode").value = item.barcode || '';
        document.getElementById("itemName").value = item.name || '';
        document.getElementById("itemCategory").value = item.category || '';
        document.getElementById("itemPrice").value = item.price || 0;
        document.getElementById("itemStock").value = item.stock || 0;
        document.getElementById("itemUnit").value = item.unit || '';
        appState.editingItemId = id;
        document.getElementById("saveItemBtn").innerHTML = '<i class="fas fa-edit"></i> تعديل الصنف';
    },
    delete: async (id) => {
        if (confirm("هل أنت متأكد من حذف هذا الصنف نهائيًا؟")) {
            try {
                await deleteDocument("items", id);
                Helpers.showNotification("تم حذف الصنف بنجاح.");
            } catch (error) {
                console.error("Error deleting item:", error);
                Helpers.showNotification("حدث خطأ أثناء حذف الصنف.");
            }
        }
    },
    bindEvents: (appState) => {
        const itemsSection = document.getElementById('items');
        if(!itemsSection) return;

        itemsSection.addEventListener('click', e => {
            const target = e.target.closest("button");
            if (!target) return;

            if (target.id === 'saveItemBtn') {
                ItemsController.save(appState);
                return;
            }

            const id = target.dataset.id;
            if (target.classList.contains("edit-item-btn")) ItemsController.edit(id, appState);
            else if (target.classList.contains("delete-item-btn")) ItemsController.delete(id);
        });
    }
};
