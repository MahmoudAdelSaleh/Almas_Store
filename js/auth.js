// استيراد العناصر والدوال المساعدة من ملف الواجهة الرسومية
import { DOM, Helpers } from './ui.js';

// تصدير الكائن Auth ليتم استخدامه في ملف main.js
export const Auth = {

    /**
     * دالة تقوم بإرجاع كود HTML الخاص بنموذج تسجيل الدخول.
     * @returns {string} - كود HTML.
     */
    getTemplate: () => `
        <form id="login-form">
            <h2><i class="fas fa-lock"></i> تسجيل الدخول</h2>
            <div class="form-group"><input type="text" id="usernameInput" placeholder="اسم المستخدم" required /></div>
            <div class="form-group"><input type="password" id="passwordInput" placeholder="كلمة المرور" required /></div>
            <button type="submit" id="loginBtn"><i class="fas fa-sign-in-alt"></i> دخول</button>
        </form>
    `,

    /**
     * دالة لمعالجة عملية تسجيل الدخول.
     * @param {string} username - اسم المستخدم المدخل.
     * @param {string} password - كلمة المرور المدخلة.
     * @param {object} appState - الحالة العامة للتطبيق.
     */
    login: (username, password, appState) => {
        const loginBtn = document.getElementById('loginBtn');
        // تلميح: تحسين تجربة المستخدم عبر تعطيل الزر وتغيير النص أثناء محاولة الدخول
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الدخول...';

        const pin = Helpers.convertToArabicAndEnglishDigits(password);

        // 1. التحقق من الرقم السري للمدير أولاً
        if (pin === appState.adminPIN) {
            appState.currentUser = { username: "المدير", role: "admin" };
            localStorage.setItem('currentUser', JSON.stringify(appState.currentUser));
            Auth.showApp("admin");
            return; // إنهاء الدالة هنا لأن الدخول نجح
        }

        // 2. إذا لم يكن المدير، ابحث عن مستخدم عادي
        const user = appState.users.find(u => u.username === username && u.password === pin);
        if (user) {
            appState.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            Auth.showApp("user");
        } else {
            // تلميح: في حالة فشل الدخول، أظهر رسالة وأعد تفعيل الزر
            Helpers.showNotification("بيانات الدخول غير صحيحة");
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> دخول';
        }
    },

    /**
     * دالة تسجيل الخروج.
     */
    logout: () => {
        // إزالة بيانات المستخدم من الذاكرة المحلية
        localStorage.removeItem('currentUser');
        // إعادة تحميل الصفحة للعودة إلى شاشة تسجيل الدخول
        location.reload();
    },

    /**
     * دالة لإظهار واجهة التطبيق الرئيسية بعد نجاح تسجيل الدخول.
     * @param {string} role - دور المستخدم ('admin' أو 'user').
     */
    showApp: (role) => {
        // إخفاء حاوية تسجيل الدخول وإفراغها
        DOM.loginContainer.style.display = "none";
        DOM.loginContainer.innerHTML = '';
        
        // إظهار حاوية التطبيق الرئيسية
        DOM.appContainer.style.display = "block";
        
        // إظهار أو إخفاء تبويب "المستخدمون" بناءً على صلاحيات المدير
        const usersTab = document.querySelector('[data-tab="users"]');
        if (usersTab) {
            usersTab.classList.toggle("hidden", role !== "admin");
        }
        
        // الانتقال مباشرة إلى تبويب المبيعات
        document.querySelector('[data-tab="sales"]').click();
    }
};
