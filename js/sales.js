import { DOM, Helpers } from './ui.js';
import { addDocument } from './firebase.js';

export const SalesController = {
    getTemplate: () => `
        <h2><i class="fas fa-cash-register"></i> عملية بيع</h2>
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
        SalesController.bindEvents(appState);
    },

    updateTotal: (appState) => {
        const itemsSubtotal = appState.currentInvoice.reduce((sum, item) => sum + item.price * item.qty, 0);
        appState.deliveryFee = parseFloat(document.getElementById('deliveryFeeInput').value) || 0;
        const total = itemsSubtotal + appState.deliveryFee;
        document.getElementById('itemsSubtotal').textContent = itemsSubtotal.toFixed(2);
        document.getElementById('invoiceTotal').textContent = total.toFixed(2);
        Helpers.calculateChange();
    },

    renderInvoice: (appState) => {
        const invoiceTableBody = document.getElementById("invoiceTableBody");
        if(invoiceTableBody){
            invoiceTableBody.innerHTML = appState.currentInvoice.map((item, index) =>
                `<tr><td>${item.name}</td><td><div class="flex-container" style="justify-content:center;flex-wrap:nowrap;"><button class="btn-small btn-warning decrease-invoice-qty-btn" data-index="${index}">-</button><span style="padding:0 10px;font-weight:bold;">${item.qty}</span><button class="btn-small btn-success increase-invoice-qty-btn" data-index="${index}">+</button></div></td><td>${(item.price || 0).toFixed(2)}</td><td>${((item.price || 0) * item.qty).toFixed(2)}</td><td><button class="btn-small btn-danger remove-from-invoice-btn" data-index="${index}"><i class="fas fa-trash-alt"></i></button></td></tr>`
            ).join("");
        }
        SalesController.updateTotal(appState);
    },

    addToInvoice: (selectedItem, appState) => {
        if (!selectedItem) return;
        const existingItem = appState.currentInvoice.find(i => i.id === selectedItem.id);
        if (existingItem) { existingItem.qty++; } 
        else { appState.currentInvoice.push({ ...selectedItem, qty: 1 }); }
        SalesController.renderInvoice(appState);
        Helpers.showNotification(`تمت إضافة: ${selectedItem.name}`);
    },

    saveInvoice: async (appState) => {
        if (appState.currentInvoice.length === 0) { Helpers.showNotification("الفاتورة فارغة"); return; }
        const total = parseFloat(document.getElementById('invoiceTotal').textContent);
        const newInvoice = {
            customerName: document.getElementById('customerName').value.trim(),
            paymentMethod: document.querySelector('input[name="paymentMethod"]:checked').value,
            amountPaid: parseFloat(document.getElementById('amountPaidInput').value) || 0,
            changeOrBalance: (parseFloat(document.getElementById('amountPaidInput').value) || 0) - total,
            items: [...appState.currentInvoice],
            deliveryFee: appState.deliveryFee,
            total: total,
        };
        try {
            await addDocument("invoices", newInvoice);
            Helpers.showNotification("تم حفظ الفاتورة بنجاح!");
            appState.currentInvoice = [];
            document.getElementById('customerName').value = "";
            document.getElementById('customerPhone').value = "";
            document.getElementById('amountPaidInput').value = "";
            appState.selectedCustomer = null;
            document.getElementById('deliveryFeeInput').value = 30;
            SalesController.renderInvoice(appState);
        } catch (error) {
            console.error("Save Invoice Error:", error);
            Helpers.showNotification("حدث خطأ أثناء حفظ الفاتورة.");
        }
    },

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
                            let barcodeToSearch = null;
                            const parts = decodedText.split('|');
                            
                            if (parts.length >= 5) { barcodeToSearch = parts[4].trim(); } 
                            else { barcodeToSearch = decodedText.trim(); }
                            
                            const foundItem = appState.items.find(item => item.barcode === barcodeToSearch);
                            
                            if (foundItem) SalesController.addToInvoice(foundItem, appState);
                            else Helpers.showNotification(`صنف غير موجود: ${barcodeToSearch}`);
                        });
                    };
                    
                    appState.html5QrCode.start(
                        { facingMode: "environment" }, 
                        { fps: 10, qrbox: (w, h) => ({ width: w * 0.8, height: h * 0.5 }) }, 
                        onScanSuccess, 
                        ()=>{}
                    ).catch(() => Helpers.showNotification("خطأ في تشغيل الكاميرا"));
                    break;
                    
                case 'increaseDeliveryBtn':
                    document.getElementById('deliveryFeeInput').value = (parseInt(document.getElementById('deliveryFeeInput').value) || 0) + 5;
                    SalesController.updateTotal(appState);
                    break;

                case 'decreaseDeliveryBtn':
                    const current = parseInt(document.getElementById('deliveryFeeInput').value) || 0;
                    if (current >= 5) document.getElementById('deliveryFeeInput').value = current - 5;
                    SalesController.updateTotal(appState);
                    break;

                case 'saveInvoiceBtn':
                    SalesController.saveInvoice(appState);
                    break;
            }
            
            const index = target.dataset.index;
            if (target.classList.contains('remove-from-invoice-btn')) {
                appState.currentInvoice.splice(index, 1);
            } else if (target.classList.contains('increase-invoice-qty-btn')) {
                appState.currentInvoice[index].qty++;
            } else if (target.classList.contains('decrease-invoice-qty-btn')) {
                if (appState.currentInvoice[index].qty > 1) {
                    appState.currentInvoice[index].qty--;
                } else {
                    appState.currentInvoice.splice(index, 1);
                }
            }
            // Re-render only if an invoice item was changed
            if (index) SalesController.renderInvoice(appState);
        });

        document.getElementById('closeScannerBtn').addEventListener('click', () => {
             if (appState.html5QrCode?.isScanning) { appState.html5QrCode.stop(); } 
             document.getElementById('barcode-scanner-container').style.display = 'none';
        });
        document.getElementById('deliveryFeeInput').addEventListener('input', () => SalesController.updateTotal(appState));
        document.getElementById('amountPaidInput').addEventListener('input', Helpers.calculateChange);
    }
};
