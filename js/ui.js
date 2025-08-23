import { DOM, Helpers } from './ui.js';

export const Auth = {
    getTemplate: () => `
        <form id="login-form">
            <h2><i class="fas fa-lock"></i> تسجيل الدخول</h2>
            <div class="form-group"><input type="text" id="usernameInput" placeholder="اسم المستخدم" required /></div>
            <div class="form-group"><input type="password" id="passwordInput" placeholder="كلمة المرور" required /></div>
            <button type="submit" id="loginBtn"><i class="fas fa-sign-in-alt"></i> دخول</button>
        </form>
    `,
    login: (username, password, appState) => {
        const pin = Helpers.convertToArabicAndEnglishDigits(password);
        if (pin === appState.adminPIN) {
            appState.currentUser = { username: "المدير", role: "admin" };
            localStorage.setItem('currentUser', JSON.stringify(appState.currentUser));
            Auth.showApp("admin");
            return;
        }
        const user = appState.users.find(u => u.username === username && u.password === pin);
        if (user) {
            appState.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            Auth.showApp("user");
        } else { Helpers.showNotification("بيانات الدخول غير صحيحة"); }
    },
    logout: () => {
        localStorage.removeItem('currentUser');
        location.reload();
    },
    showApp: (role) => {
        DOM.loginContainer.style.display = "none";
        DOM.loginContainer.innerHTML = ''; // Clear login form
        DOM.appContainer.style.display = "block";
        document.querySelector('[data-tab="users"]').classList.toggle("hidden", role !== "admin");
        document.querySelector('[data-tab="sales"]').click();
    }
};
