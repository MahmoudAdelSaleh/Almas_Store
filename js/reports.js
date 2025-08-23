import { Helpers } from './ui.js';

// دالة مساعدة لحساب رقم الأسبوع في السنة
const getWeekNumber = (d) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return [d.getUTCFullYear(), weekNo];
};

export const ReportsController = {
    getInvoicesTemplate: () => `
        <h2><i class="fas fa-file-invoice-dollar"></i> الفواتير المحفوظة</h2>
        <div id="invoicesList"></div>
    `,
    getSummaryTemplate: () => `
        <h2><i class="fas fa-chart-bar"></i> التقارير</h2>
        <div class="form-group flex-container">
            <label for="summaryGroupSelect">تجميع حسب:</label>
            <select id="summaryGroupSelect">
                <option value="day">اليوم</option>
                <option value="week">الأسبوع</option>
                <option value="month">الشهر</option>
            </select>
        </div>
        <div class="summary-box">
            <i class="fas fa-coins"></i> <strong>المجموع الكلي للمبيعات:</strong> <span id="totalSalesAmount">0.00</span> ج.م
        </div>
        <table>
            <thead><tr><th>الفترة</th><th>عدد الفواتير</th><th>المبلغ</th></tr></thead>
            <tbody id="salesSummaryTable"></tbody>
        </table>
        <div style="margin-top: 30px;">
            <h3><i class="fas fa-star"></i> الأصناف الأكثر مبيعًا</h3>
            <div id="bestSellingItems" class="summary-box"><p>لا توجد بيانات متاحة.</p></div>
        </div>
    `,

    renderInvoices: (appState) => {
        const invoicesList = document.getElementById("invoicesList");
        if(!invoicesList) return;
        if (!appState.invoices || appState.invoices.length === 0) {
            invoicesList.innerHTML = "<p>لا توجد فواتير محفوظة.</p>";
            return;
        }
        invoicesList.innerHTML = appState.invoices.map(inv => {
            const date = inv.createdAt.toDate().toLocaleString('ar-EG', { dateStyle: 'long', timeStyle: 'short' });
            return `<div class="summary-box">
                <p><strong>التاريخ:</strong> ${date}</p>
                <p><strong>العميل:</strong> ${inv.customerName || 'نقدي'}</p>
                <p><strong>الإجمالي:</strong> ${inv.total.toFixed(2)} ج.م</p>
                <table style="font-size: 14px;">
                    <thead><tr><th>الصنف</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr></thead>
                    <tbody>${inv.items.map(i => `<tr><td>${i.name}</td><td>${i.qty}</td><td>${i.price.toFixed(2)}</td><td>${(i.price * i.qty).toFixed(2)}</td></tr>`).join('')}</tbody>
                </table>
            </div>`;
        }).join('');
    },

    renderSummary: (appState) => {
        const summarySection = document.getElementById("summary");
        if(!summarySection) return;

        const summaryGroupSelect = document.getElementById("summaryGroupSelect");
        summaryGroupSelect.addEventListener('change', () => ReportsController.renderSummary(appState));

        let summary = {};
        let itemSales = {};
        let totalAmount = 0;

        appState.invoices.forEach(inv => {
            const invDate = inv.createdAt.toDate();
            let key, displayKey;
            const groupBy = summaryGroupSelect.value;

            if (groupBy === 'day') {
                key = invDate.toISOString().slice(0, 10);
                displayKey = invDate.toLocaleDateString('ar-EG', { dateStyle: 'long' });
            } else if (groupBy === 'week') {
                const [year, week] = getWeekNumber(invDate);
                key = `${year}-${week}`;
                displayKey = `الأسبوع ${week} من عام ${year}`;
            } else { // month
                key = invDate.toISOString().slice(0, 7);
                displayKey = invDate.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' });
            }

            if (!summary[key]) summary[key] = { count: 0, amount: 0, display: displayKey };
            summary[key].count++;
            summary[key].amount += inv.total;
            totalAmount += inv.total;

            inv.items.forEach(item => {
                if (!itemSales[item.id]) itemSales[item.id] = { name: item.name, totalQty: 0 };
                itemSales[item.id].totalQty += item.qty;
            });
        });

        document.getElementById("totalSalesAmount").textContent = totalAmount.toFixed(2);
        const summaryData = Object.values(summary).sort((a,b) => b.display.localeCompare(a.display));
        document.getElementById("salesSummaryTable").innerHTML = summaryData.map(row => `<tr><td>${row.display}</td><td>${row.count}</td><td>${row.amount.toFixed(2)}</td></tr>`).join("");
        
        const sortedItems = Object.values(itemSales).sort((a, b) => b.totalQty - a.totalQty).slice(0, 10);
        const bestSellingDiv = document.getElementById("bestSellingItems");
        if (sortedItems.length > 0) {
            bestSellingDiv.innerHTML = `<table><thead><tr><th>اسم الصنف</th><th>الكمية المباعة</th></tr></thead><tbody>
                ${sortedItems.map(item => `<tr><td>${item.name}</td><td>${item.totalQty}</td></tr>`).join("")}
            </tbody></table>`;
        } else {
            bestSellingDiv.innerHTML = "<p>لا توجد بيانات متاحة.</p>";
        }
    }
};
