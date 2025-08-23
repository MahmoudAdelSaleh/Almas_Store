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
    addToInvoice: (appState) => {
        if (!appState.selectedItem) { Helpers.showNotification("يرجى اختيار صنف"); return; }
        const qty = parseInt(DOM.quantitySelect.value);
        const existingItem = appState.currentInvoice.find(i => i.id === appState.selectedItem.id);
        if (existingItem) {
            existingItem.qty += qty;
        } else {
            appState.currentInvoice.push({ ...appState.selectedItem, qty: qty });
        }
        SalesController.renderInvoice(appState);
        DOM.searchItemInput.value = "";
        appState.selectedItem = null;
        DOM.searchResultsDiv.style.display = 'none';
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
            DOM.barcodeScannerContainer.style.display = 'block';
            if (!appState.html5QrCode) { appState.html5QrCode = new Html5Qrcode("reader"); }
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
                    appState.selectedItem = { id: foundItem.sku, name: foundItem.name, price: foundItem.price };
                    SalesController.addToInvoice(appState);
                } else { Helpers.showNotification(`صنف غير موجود`); }
            };
            appState.html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: {width: 250, height: 250} }, onScanSuccess, () => {})
            .catch(() => Helpers.showNotification("خطأ في تشغيل الكاميرا"));
        });

        DOM.closeScannerBtn.addEventListener('click', () => { if (appState.html5QrCode?.isScanning) { appState.html5QrCode.stop(); } DOM.barcodeScannerContainer.style.display = 'none'; });
        DOM.addToInvoiceBtn.addEventListener("click", () => SalesController.addToInvoice(appState));
        DOM.invoiceTable.addEventListener("click", e => {
            if (e.target.classList.contains("remove-from-invoice-btn")) {
                const index = e.target.dataset.index;
                appState.currentInvoice.splice(index, 1);
                SalesController.renderInvoice(appState);
            }
        });
        DOM.saveInvoiceBtn.addEventListener("click", () => SalesController.saveInvoice(appState));
        DOM.amountPaidInput.addEventListener("input", Helpers.calculateChange);
    }
};
