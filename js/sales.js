// تلميح: نقوم باستيراد العناصر التي نحتاجها من ملف الواجهة الرسومية
// هذا يجعل الكود منظمًا حيث يعرف كل ملف ما هي الملفات الأخرى التي يعتمد عليها
import { DOM, Helpers } from './ui.js';

// تلميح: نضع كل الدوال المتعلقة بالمبيعات داخل كائن واحد اسمه SalesController
// هذا يمنع تداخل الدوال مع أجزاء أخرى من البرنامج
export const SalesController = {

    /**
     * تلميح: هذه الدالة مسؤولة عن عرض محتويات الفاتورة الحالية في الجدول
     * وتقوم بحساب الإجمالي وتحديثه تلقائيًا.
     * @param {object} appState - الحالة العامة للتطبيق.
     */
    renderInvoice: (appState) => {
        let total = 0;
        DOM.invoiceTable.innerHTML = appState.currentInvoice.map((item, index) => {
            const subtotal = item.price * item.qty;
            total += subtotal;
            // تلميح: استخدام Template Literals (`) يجعل كتابة HTML داخل الجافاسكريبت أسهل بكثير
            return `<tr>
                        <td>${item.name}</td>
                        <td>${item.qty}</td>
                        <td>${item.price.toFixed(2)}</td>
                        <td>${subtotal.toFixed(2)}</td>
                        <td><button class="btn-small btn-danger remove-from-invoice-btn" data-index="${index}"><i class="fas fa-trash-alt"></i></button></td>
                    </tr>`;
        }).join(""); // تلميح: .join("") تحول مصفوفة السطور إلى نص واحد لعرضه في الجدول
        
        DOM.invoiceTotalSpan.textContent = total.toFixed(2);
        Helpers.calculateChange();
    },

    /**
     * تلميح: تم تحسين هذه الدالة لتقبل الصنف والكمية كمدخلات مباشرة
     * هذا يجعلها أكثر مرونة وقابلية لإعادة الاستخدام من أماكن مختلفة (بحث نصي، باركود، ...).
     * @param {object} appState - الحالة العامة للتطبيق.
     * @param {object} itemToAdd - الصنف المراد إضافته.
     * @param {number} quantity - الكمية المطلوبة.
     */
    addToInvoice: (appState, itemToAdd, quantity) => {
        // تلميح: التحقق من وجود الصنف هو ممارسة جيدة لتجنب الأخطاء
        if (!itemToAdd) { 
            Helpers.showNotification("يرجى اختيار صنف صحيح"); 
            return; 
        }

        const qty = parseInt(quantity) || 1; // تأكد من أن الكمية رقم صحيح
        
        // تلميح: البحث إذا كان الصنف موجودًا بالفعل في الفاتورة لزيادة الكمية بدلاً من إضافته مرة أخرى
        const existingItem = appState.currentInvoice.find(i => i.id === itemToAdd.id);
        
        if (existingItem) {
            existingItem.qty += qty;
        } else {
            // تلميح: استخدام (...) لإنشاء نسخة جديدة من الصنف مع إضافة الكمية
            appState.currentInvoice.push({ ...itemToAdd, qty: qty });
        }
        
        // تلميح: بعد أي تغيير، نقوم بإعادة رسم الفاتورة لتحديث الواجهة
        SalesController.renderInvoice(appState);
        DOM.searchItemInput.value = "";
        appState.selectedItem = null;
        DOM.searchResultsDiv.style.display = 'none';
        Helpers.showNotification(`تمت إضافة: ${itemToAdd.name}`);
    },

    /**
     * تلميح: دالة مسؤولة عن حفظ الفاتورة في قاعدة البيانات.
     * @param {object} appState - الحالة العامة للتطبيق.
     */
    saveInvoice: async (appState) => {
        if (appState.currentInvoice.length === 0) { 
            Helpers.showNotification("الفاتورة فارغة"); 
            return; 
        }
        
        const total = parseFloat(DOM.invoiceTotalSpan.textContent);
        
        // تلميح: بناء كائن (Object) نظيف ومحدد بالبيانات التي نريد حفظها فقط
        const newInvoice = {
            customerName: DOM.customerNameInput.value.trim(),
            paymentMethod: DOM.paymentMethodSelect.value,
            amountPaid: parseFloat(DOM.amountPaidInput.value) || 0,
            changeOrBalance: (parseFloat(DOM.amountPaidInput.value) || 0) - total,
            items: [...appState.currentInvoice], // نسخة من الأصناف
            total: total,
        };
        
        // تلميح: استخدام try...catch هي الطريقة الصحيحة للتعامل مع العمليات التي قد تفشل (مثل الاتصال بالانترنت)
        try {
            await window.addDocument("invoices", newInvoice);
            Helpers.showNotification("تم حفظ الفاتورة بنجاح!");
            
            // تلميح: إعادة تعيين الحقول والفاتورة بعد الحفظ الناجح
            appState.currentInvoice = [];
            DOM.customerNameInput.value = "";
            DOM.amountPaidInput.value = "";
            SalesController.renderInvoice(appState);
        } catch (error) {
            console.error("Save Invoice Error:", error); // مهم للمطور لمعرفة سبب الخطأ
            Helpers.showNotification("حدث خطأ أثناء حفظ الفاتورة.");
        }
    },

    /**
     * تلميح: هذه الدالة تقوم بربط كل الأزرار والحقول في صفحة المبيعات بوظائفها مرة واحدة عند بدء التطبيق.
     * @param {object} appState - الحالة العامة للتطبيق.
     */
    bindSalesEvents: (appState) => {
        // --- البحث النصي عن الأصناف ---
        DOM.searchItemInput.addEventListener("input", e => {
            const query = e.target.value.toLowerCase();
            if (query.length < 2) { 
                DOM.searchResultsDiv.style.display = 'none'; 
                return; 
            }
            const matched = appState.items.filter(item => item.name.toLowerCase().includes(query) || item.sku.includes(query));
            DOM.searchResultsDiv.innerHTML = matched.map(item => `<div data-id="${item.sku}">${item.name}</div>`).join('');
            DOM.searchResultsDiv.style.display = matched.length > 0 ? 'block' : 'none';
        });

        // --- عند اختيار صنف من قائمة البحث ---
        DOM.searchResultsDiv.addEventListener("click", e => {
            const id = e.target.dataset.id;
            const selected = appState.items.find(item => item.sku === id);
            if (selected) {
                // تلميح: هنا نقوم فقط بتعيين الصنف المختار مؤقتًا، وزر "إضافة للفاتورة" سيقوم بالباقي
                appState.selectedItem = { id: selected.sku, name: selected.name, price: selected.price };
                DOM.searchItemInput.value = selected.name;
                DOM.searchResultsDiv.style.display = 'none';
            }
        });

        // --- مسح الباركود بالكاميرا ---
        DOM.scanBarcodeBtn.addEventListener('click', () => {
            DOM.barcodeScannerContainer.style.display = 'block';
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
                
                // تلميح: هذا هو المنطق الذكي الذي يتعامل مع كلا النوعين من الباركود
                if (parts.length >= 5) { // إذا كان QR Code معقد
                    codeToSearch = parts[4].trim(); 
                } else { // إذا كان باركود شريطي بسيط
                    let barcode = decodedText.trim(); 
                    codeToSearch = barcode.length > 12 ? barcode.slice(-12) : barcode; 
                }
                
                const foundItem = appState.items.find(item => item.sku === codeToSearch);
                
                if (foundItem) {
                    // تلميح: تم التعديل ليتم إضافة الصنف للفاتورة مباشرة بكمية 1 عند المسح
                    const itemToAdd = { id: foundItem.sku, name: foundItem.name, price: foundItem.price };
                    SalesController.addToInvoice(appState, itemToAdd, 1);
                } else { 
                    Helpers.showNotification(`صنف غير موجود`); 
                }
            };
            
            appState.html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: {width: 200, height: 200} }, onScanSuccess, () => {})
            .catch(() => Helpers.showNotification("خطأ في تشغيل الكاميرا"));
        });
        
        DOM.closeScannerBtn.addEventListener('click', () => { 
            if (appState.html5QrCode?.isScanning) { 
                appState.html5QrCode.stop(); 
            } 
            DOM.barcodeScannerContainer.style.display = 'none'; 
        });

        // --- زر "إضافة للفاتورة" الرئيسي ---
        DOM.addToInvoiceBtn.addEventListener("click", () => {
            const quantity = parseInt(DOM.quantitySelect.value);
            // تلميح: نستدعي الدالة المحسّنة ونمرر لها الصنف المختار والكمية
            SalesController.addToInvoice(appState, appState.selectedItem, quantity);
        });

        // --- حذف صنف من الفاتورة ---
        // تلميح: استخدام "event delegation" للاستماع للنقرات على الجدول بأكمله بدلاً من كل زر على حدة
        DOM.invoiceTable.addEventListener("click", e => {
            if (e.target.closest(".remove-from-invoice-btn")) {
                const index = e.target.closest(".remove-from-invoice-btn").dataset.index;
                appState.currentInvoice.splice(index, 1);
                SalesController.renderInvoice(appState);
            }
        });

        // --- ربط زر الحفظ والدفع ---
        DOM.saveInvoiceBtn.addEventListener("click", () => SalesController.saveInvoice(appState));
        DOM.amountPaidInput.addEventListener("input", Helpers.calculateChange);
    }
};
