import { DOM, Helpers } from './ui.js';
import { addDocument } from './firebase.js';

export const SalesController = {
    getTemplate: () => `
        <h2><i class="fas fa-cash-register"></i> عملية بيع</h2>
        <div id="categoryContainer" style="margin-bottom: 20px;">
            <button id="showCategoriesBtn" style="width: 100%; padding: 15px; font-size: 18px;" class="btn-success"><i class="fas fa-tags"></i> عرض الفئات</button>
        </div>
        <div id="salesCategoryFilters" class="flex-container" style="justify-content: flex-start; margin-bottom: 15px; display: none;"></div>
        <div id="categoryPagination" style="display: none; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <button id="prevCategoriesBtn" class="btn-small btn-warning"><i class="fas fa-arrow-right"></i> السابق</button>
            <span id="categoryPageIndicator" style="font-weight: bold;"></span>
            <button id="nextCategoriesBtn" class="btn-small btn-warning">التالي <i class="fas fa-arrow-left"></i></button>
        </div>
        <div id="itemGrid" style="display: none; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px; margin-bottom: 20px;"></div>
        <div class="form-group" style="text-align: center; margin-top: -10px; margin-bottom: 20px;">
            <button id="hideCategoriesBtn" class="btn-warning" style="display:none;"><i class="fas fa-eye-slash"></i> إخفاء الفئات والأصناف</button>
        </div>
        <div class="form-group" style="position: relative;">
            <div class="flex-container">
                <input type="text" id="customerName" placeholder="اسم العميل (اختياري)" autocomplete="off" />
                <input type="tel" id="customerPhone" placeholder="رقم هاتف العميل (واتساب)" />
            </div>
            <div id="customerSuggestions"></div>
        </div>
        <div class="form-group">
            <button id="scanBarcodeBtn" style="width:100%;"><i class="fas fa-camera"></i> مسح باركود صنف</button>
        </div>
        <div class="form-group flex-container">
            <label for="deliveryFeeInput" style="flex: 0 1 auto;">خدمة التوصيل:</label>
            <div class="input-group" style="flex: 1 1 150px;">
                <button id="decreaseDeliveryBtn" class="input-group-btn btn-warning">-</button>
                <input type="number" id="deliveryFeeInput" value="30" min="0" step="5" class="input-group-field" />
                <button id="increaseDeliveryBtn" class="input-group-btn btn-success">+</button>
            </div>
            <span style="flex: 2 1 auto; font-weight: bold;">ج.م</span>
        </div>
        <h3><i class="fas fa-file-invoice"></i> تفاصيل الفاتورة</h3>
        <table>
            <thead><tr><th>الصنف</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th><th>حذف</th></tr></thead>
            <tbody id="invoiceTableBody"></tbody>
        </table>
        <h4 style="text-align: left;">إجمالي الأصناف: <span id="itemsSubtotal">0.00</span> ج.م</h4>
        <h3 style="text-align: left;">الإجمالي الكلي: <span id="invoiceTotal">0.00</span> ج.م</h3>
        <div class="form-group flex-container">
            <label for="amountPaidInput">المدفوع:</label>
            <input type="number" id="amountPaidInput" placeholder="المبلغ المدفوع" min="0" step="0.01" />
        </div>
        <div class="form-group">
            <label>طريقة الدفع:</label>
            <div id="paymentMethodRadios">
                <input type="radio" id="payCash" name="paymentMethod" value="cash" checked> <label for="payCash">نقداً</label>
                <input type="radio" id="payVisa" name="paymentMethod" value="visa"> <label for="payVisa">فيزا</label>
                <input type="radio" id="payWallet" name="paymentMethod" value="wallet"> <label for="payWallet">محفظة</label>
            </div>
        </div>
        <h3 style="text-align: left;">
            <span id="changeText">الباقي للعميل:</span><span id="changeAmount">0.00</span> ج.م
        </h3>
        <div class="flex-container flex-end" style="margin-top: 20px; flex-direction: row !important; gap: 10px;">
            <button id="sendWhatsappBtn" class="btn-success" style="background-color: #25D366;"><i class="fab fa-whatsapp"></i> واتساب</button>
            <button id="printInvoiceBtn" class="btn-success"><i class="fas fa-print"></i> طباعة</button>
            <button id="saveInvoiceBtn"><i class="fas fa-save"></i> حفظ</button>
        </div>
    `,
    
    init: (appState) => {
        SalesController.renderInvoice(appState);
        document.getElementById('deliveryFeeInput').value = appState.deliveryFee;
    },
    
    renderCategoryFilters: (appState) => { /* ... No changes needed here ... */ },
    
    renderItemsGrid: (category, appState) => { /* ... No changes needed here ... */ },

    updateTotal: (appState) => { /* ... No changes needed here ... */ },

    renderInvoice: (appState) => { /* ... No changes needed here ... */ },

    addToInvoice: (selectedItem, appState) => { /* ... No changes needed here ... */ },

    saveInvoice: async (appState) => { /* ... No changes needed here ... */ },

    bindEvents: (appState) => {
        const salesSection = document.getElementById('sales');
        if (!salesSection) return;

        salesSection.addEventListener('click', (e) => {
            const target = e.target.closest("button");
            if (!target) return;

            switch (target.id) {
                case 'scanBarcodeBtn':
                    document.getElementById('barcode-scanner-container').style.display = 'flex';
                    if (!appState.html5QrCode) { appState.html5QrCode = new Html5Qrcode("reader"); }
                    
                    const onScanSuccess = (decodedText) => {
                        appState.html5QrCode.stop().then(() => {
                            document.getElementById('barcode-scanner-container').style.display = 'none';
                            let barcodeToSearch = null; // Renamed for clarity
                            const parts = decodedText.split('|');
                            
                            if (parts.length >= 5) { 
                                barcodeToSearch = parts[4].trim(); 
                            } else { 
                                barcodeToSearch = decodedText.trim(); 
                                // No more slicing to support long barcodes
                            }
                            
                            // --- التعديل هنا ---
                            const foundItem = appState.items.find(item => item.barcode === barcodeToSearch);
                            
                            if (foundItem) SalesController.addToInvoice(foundItem, appState);
                            else Helpers.showNotification(`صنف غير موجود: ${barcodeToSearch}`);
                        });
                    };

                    appState.html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: (w, h) => ({ width: w * 0.8, height: h * 0.5 }) }, onScanSuccess, ()=>{})
                    .catch(() => Helpers.showNotification("خطأ في تشغيل الكاميرا"));
                    break;
                // ... other cases
            }
        });
        // ... other listeners
    }
};
