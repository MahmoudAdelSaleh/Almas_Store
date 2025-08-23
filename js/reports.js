import { DOM } from './ui.js';

export const ReportsController = {
    renderInvoices: (appState) => {
        if (!appState.invoices || appState.invoices.length === 0) {
            DOM.invoicesList.innerHTML = "<p>لا توجد فواتير محفوظة.</p>";
            return;
        }
        DOM.invoicesList.innerHTML = appState.invoices.map(inv => {
            const date = inv.createdAt.toDate().toLocaleString('ar-EG');
            return `<div class="summary-box">
                <p><strong>التاريخ:</strong> ${date}</p>
                <p><strong>العميل:</strong> ${inv.customerName || 'نقدي'}</p>
                <p><strong>الإجمالي:</strong> ${inv.total.toFixed(2)} ج.م</p>
                <ul>${inv.items.map(i => `<li>${i.name} (الكمية: ${i.qty})</li>`).join('')}</ul>
            </div>`;
        }).join('');
    },
    renderSummary: (appState) => {
        if (!appState.invoices || appState.invoices.length === 0) {
            DOM.summaryContent.innerHTML = "<p>لا توجد بيانات لعرض التقارير.</p>";
            return;
        }
        const totalSales = appState.invoices.reduce((sum, inv) => sum + inv.total, 0);
        DOM.summaryContent.innerHTML = `<div class="summary-box"><h3>إجمالي المبيعات</h3><p>${totalSales.toFixed(2)} ج.م</p></div>`;
    }
};
