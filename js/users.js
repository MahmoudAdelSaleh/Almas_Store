import { DOM, Helpers } from './ui.js';
import { addDocument, updateDocument, deleteDocument } from './firebase.js';

export const UsersController = {
    getTemplate: () => `
        <h2><i class="fas fa-user-shield"></i> إدارة المستخدمين</h2>
        <div class="form-group flex-container">
            <input type="text" id="newUsernameInput" placeholder="اسم المستخدم" />
            <input type="password" id="newUserPasswordInput" placeholder="كلمة المرور" />
            <button id="saveUserBtn"><i class="fas fa-plus-circle"></i> إضافة مستخدم</button>
        </div>
        <div id="usersList"></div>
        <div id="changePinSection" style="margin-top: 30px;">
            <h4><i class="fas fa-key"></i> تغيير كلمة مرور المدير العام</h4>
            <div class="form-group flex-container">
                <input type="password" id="oldPinInput" placeholder="الكلمة القديمة" />
                <input type="password" id="newPinInput" placeholder="الكلمة الجديدة" />
                <button id="changePinBtn" class="btn-warning"><i class="fas fa-sync-alt"></i> تغيير الكلمة</button>
            </div>
        </div>
    `,
    init: (appState) => {
        UsersController.render(appState);
        UsersController.bindEvents(appState);
    },
    render: (appState) => {
        const usersList = document.getElementById("usersList");
        if (usersList) {
            usersList.innerHTML = appState.users.map(user => `
                <div class="customer-card">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                        <b>${user.username}</b>
                        <div class="flex-container">
                            <button class="btn-small btn-warning edit-user-btn" data-id="${user.id}"><i class="fas fa-edit"></i></button>
                            <button class="btn-small btn-danger delete-user-btn" data-id="${user.id}"><i class="fas fa-trash-alt"></i></button>
                        </div>
                    </div>
                </div>`
            ).join("");
        }
    },
    clearForm: () => {
        document.getElementById("newUsernameInput").value = "";
        document.getElementById("newUserPasswordInput").value = "";
        document.getElementById("saveUserBtn").innerHTML = '<i class="fas fa-plus-circle"></i> إضافة مستخدم';
    },
    save: async (appState) => {
        const username = document.getElementById("newUsernameInput").value.trim();
        const password = Helpers.convertToArabicAndEnglishDigits(document.getElementById("newUserPasswordInput").value.trim());
        if (!username || !password) { Helpers.showNotification("يرجى إدخال اسم المستخدم وكلمة المرور."); return; }
        
        try {
            if (appState.editingUserId) {
                await updateDocument("users", appState.editingUserId, { username, password });
                Helpers.showNotification("تم تعديل المستخدم.");
            } else {
                if (appState.users.some(u => u.username === username)) {
                    Helpers.showNotification("اسم المستخدم موجود بالفعل.");
                    return;
                }
                await addDocument("users", { username, password, role: 'user' });
                Helpers.showNotification("تم إضافة مستخدم جديد.");
            }
            appState.editingUserId = null;
            UsersController.clearForm();
        } catch (error) { console.error(error); Helpers.showNotification("حدث خطأ."); }
    },
    edit: (id, appState) => {
        const user = appState.users.find(u => u.id === id);
        if (!user) return;
        document.getElementById("newUsernameInput").value = user.username;
        document.getElementById("newUserPasswordInput").value = user.password;
        appState.editingUserId = id;
        document.getElementById("saveUserBtn").innerHTML = '<i class="fas fa-edit"></i> تعديل مستخدم';
    },
    delete: async (id) => {
        if (confirm("هل أنت متأكد من حذف هذا المستخدم؟")) {
            try {
                await deleteDocument("users", id);
                Helpers.showNotification("تم حذف المستخدم.");
            } catch (error) { console.error(error); Helpers.showNotification("حدث خطأ."); }
        }
    },
    changePin: async (appState) => {
        const oldPin = Helpers.convertToArabicAndEnglishDigits(document.getElementById("oldPinInput").value);
        const newPin = Helpers.convertToArabicAndEnglishDigits(document.getElementById("newPinInput").value);
        if (oldPin !== appState.adminPIN) { Helpers.showNotification("كلمة المرور القديمة غير صحيحة."); return; }
        if (!newPin || newPin.length < 4) { Helpers.showNotification("كلمة المرور الجديدة يجب أن تكون 4 أرقام على الأقل."); return; }
        try {
            await updateDocument("config", "admin", { pin: newPin });
            appState.adminPIN = newPin;
            document.getElementById("oldPinInput").value = "";
            document.getElementById("newPinInput").value = "";
            Helpers.showNotification("تم تغيير كلمة مرور المدير بنجاح!");
        } catch(error) { console.error(error); Helpers.showNotification("حدث خطأ."); }
    },
    bindEvents: (appState) => {
        const usersSection = document.getElementById('users');
        if (!usersSection) return;

        usersSection.addEventListener('click', e => {
            const target = e.target.closest("button");
            if (!target) return;

            if(target.id === 'saveUserBtn') UsersController.save(appState);
            else if(target.id === 'changePinBtn') UsersController.changePin(appState);
            
            const id = target.dataset.id;
            if (target.classList.contains("edit-user-btn")) UsersController.edit(id, appState);
            else if (target.classList.contains("delete-user-btn")) UsersController.delete(id);
        });
    }
};
