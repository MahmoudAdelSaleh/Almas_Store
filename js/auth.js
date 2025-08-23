import { DOM, Helpers } from './ui.js';

export const Auth = {
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
        DOM.appContainer.style.display = "block";
        const usersTab = document.querySelector('[data-tab="users"]');
        if(usersTab) usersTab.style.display = role === "admin" ? 'flex' : 'none';
    }
};
