import { DOM, Helpers } from './ui.js';

export const SalesController = {
    getTemplate: () => `<h2><i class="fas fa-cash-register"></i> ... </h2> ...`,
    init: (appState) => { /* ... */ },
import { DOM, Helpers } from './ui.js';

export const SalesController = {
    renderInvoice: (appState) => {
        let total = 0;
        DOM.invoiceTable.innerHTML = appState.currentInvoice.map((item, index) => {
            const subtotal = item.price * item.qty;
            total += subtotal;
            return `<tr><td>${item.name}</td><td>${item.qty}</td><td>${item.price.toFixed(2)}</td><td>${subtotal.toFixed(2)}</td><td><button class="btn-small btn-danger remove-from-invoice-btn" data-index="${index}"><i class="fas fa-trash-alt"></i></button></td></tr>`;
        }).join("");
        DOM.invoiceTotalSpan.textContent = total.toFixed(2);
        Helpers.calculateChange();
    },
    addToInvoice: (appState, itemToAdd, quantity) => {
        if (!itemToAdd) { 
            Helpers.showNotification("يرجى اختيار صنف صحيح"); 
            return; 
        }
        const qty = parseInt(quantity) || 1;
        const existingItem = appState.currentInvoice.find(i => i.id === itemToAdd.id);
        if (existingItem) {
            existingItem.qty += qty;
        } else {
            appState.currentInvoice.push({ ...itemToAdd, qty: qty });
        }
        SalesController.renderInvoice(appState);
        DOM.searchItemInput.value = "";
        appState.selectedItem = null;
        DOM.searchResultsDiv.style.display = 'none';
        Helpers.showNotification(`تمت إضافة: ${itemToAdd.name}`);
    },
    saveInvoice: async (appState) => {
        if (appState.currentInvoice.length === 0) { Helpers.showNotification("الفاتورة فارغة"); return; }
        const total = parseFloat(DOM.invoiceTotalSpan.textContent);
        const newInvoice = {
            customerName: DOM.customerNameInput.value.trim(),
            paymentMethod: DOM.paymentMethodSelect.value,
            amountPaid: parseFloat(DOM.amountPaidInput.value) || 0,
            changeOrBalance: (parseFloat(DOM.amountPaidInput.value) || 0) - total,
            items: [...appState.currentInvoice],
            total: total,
        };
        try {
            await window.addDocument("invoices", newInvoice);
            Helpers.showNotification("تم حفظ الفاتورة بنجاح!");
            appState.currentInvoice = [];
            DOM.customerNameInput.value = "";
            DOM.amountPaidInput.value = "";
            SalesController.renderInvoice(appState);
        } catch (error) {
            console.error("Save Invoice Error:", error);
            Helpers.showNotification("حدث خطأ أثناء حفظ الفاتورة.");
        }
    },
    bindSalesEvents: (appState) => {
        DOM.searchItemInput.addEventListener("input", e => {
            const query = e.target.value.toLowerCase();
            if (query.length < 2) { DOM.searchResultsDiv.style.display = 'none'; return; }
            const matched = appState.items.filter(item => item.name.toLowerCase().includes(query) || item.sku.includes(query));
            DOM.searchResultsDiv.innerHTML = matched.map(item => `<div data-id="${item.sku}">${item.name}</div>`).join('');
            DOM.searchResultsDiv.style.display = matched.length > 0 ? 'block' : 'none';
        });
        DOM.searchResultsDiv.addEventListener("click", e => {
            const id = e.target.dataset.id;
            const selected = appState.items.find(item => item.sku === id);
            if (selected) {
                appState.selectedItem = { id: selected.sku, name: selected.name, price: selected.price };
                DOM.searchItemInput.value = selected.name;
                DOM.searchResultsDiv.style.display = 'none';
            }
        });
        DOM.scanBarcodeBtn.addEventListener('click', () => {
            DOM.barcodeScannerContainer.style.display = 'flex';
            if (!appState.html5QrCode) { 
                appState.html5QrCode = new Html5Qrcode("reader"); 
            }
            const onScanSuccess = (decodedText) => {
                if (appState.html5QrCode.isScanning) {
                    appState.html5QrCode.stop();
                }
                DOM.barcodeScannerContainer.style.display = 'none';
                let codeToSearch = null;
                const parts = decodedText.split('|');
                if (parts.length >= 5) { codeToSearch = parts[4].trim(); } 
                else { let barcode = decodedText.trim(); codeToSearch = barcode.length > 12 ? barcode.slice(-12) : barcode; }
                const foundItem = appState.items.find(item => item.sku === codeToSearch);
                if (foundItem) {
                    const itemToAdd = { id: foundItem.sku, name: foundItem.name, price: foundItem.price };
                    SalesController.addToInvoice(appState, itemToAdd, 1);
                } else { Helpers.showNotification(`صنف غير موجود`); }
            };
            
            // تلميح: تم تعديل هذا الجزء. الآن سيحاول مربع المسح أن يأخذ 80% من عرض منطقة الفيديو
            // هذا يعطي أفضل نتيجة لإزالة الهوامش الرمادية
            appState.html5QrCode.start(
                { facingMode: "environment" }, 
                { fps: 10, qrbox: (viewfinderWidth, viewfinderHeight) => {
                    const size = Math.min(viewfinderWidth, viewfinderHeight) * 0.8;
                    return { width: size, height: size };
                  } 
                }, 
                onScanSuccess, 
                () => {}
            )
            .catch(() => Helpers.showNotification("خطأ في تشغيل الكاميرا"));
        });
        
        DOM.closeScannerBtn.addEventListener('click', () => { 
            if (appState.html5QrCode?.isScanning) { 
                appState.html5QrCode.stop(); 
            } 
            DOM.barcodeScannerContainer.style.display = 'none'; 
        });
        DOM.addToInvoiceBtn.addEventListener("click", () => {
            const quantity = parseInt(DOM.quantitySelect.value);
            SalesController.addToInvoice(appState, appState.selectedItem, quantity);
        });
        DOM.invoiceTable.addEventListener("click", e => {
            if (e.target.closest(".remove-from-invoice-btn")) {
                const index = e.target.closest(".remove-from-invoice-btn").dataset.index;
                appState.currentInvoice.splice(index, 1);
                SalesController.renderInvoice(appState);
            }
        });
        DOM.saveInvoiceBtn.addEventListener("click", () => SalesController.saveInvoice(appState));
        DOM.amountPaidInput.addEventListener("input", Helpers.calculateChange);
    }
};
