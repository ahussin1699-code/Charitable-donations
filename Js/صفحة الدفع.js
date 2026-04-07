document.addEventListener('DOMContentLoaded', () => {
    const visaMethod = document.getElementById('visa-method');
    const walletMethod = document.getElementById('wallet-method');
    const visaForm = document.getElementById('visa-form');
    const walletForm = document.getElementById('wallet-form');
    const paymentStatus = document.getElementById('payment-status');

    // Donor info fields (Unified)
    const donorNameInput = document.getElementById('donor-name');
    const donorPhoneInput = document.getElementById('donor-phone');
    const donationAmountInput = document.getElementById('donation-amount');

    const sb = createSupabaseClient();

    // Get case ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const caseId = urlParams.get('id');

    // --- Switch between payment methods ---
    visaMethod.addEventListener('click', () => {
        visaMethod.classList.add('active');
        walletMethod.classList.remove('active');
        visaForm.classList.remove('hidden');
        walletForm.classList.add('hidden');
        paymentStatus.classList.add('hidden');
    });

    walletMethod.addEventListener('click', () => {
        walletMethod.classList.add('active');
        visaMethod.classList.remove('active');
        walletForm.classList.remove('hidden');
        visaForm.classList.add('hidden');
        paymentStatus.classList.add('hidden');
    });

    // --- Helper function to complete donation in database ---
    async function completeDonation(method, walletData = null) {
        const name = donorNameInput.value.trim();
        const phone = donorPhoneInput.value.trim();
        const amount = parseFloat(donationAmountInput.value);

        if (!name || !phone || isNaN(amount) || amount <= 0) {
            alert('يرجى ملء كافة بيانات التبرع أولاً (الاسم، الهاتف، المبلغ)');
            return false;
        }

        if (!caseId) {
            alert('خطأ: لم يتم تحديد الحالة');
            return false;
        }

        try {
            // 1. Fetch current case data
            const { data: caseData, error: fetchError } = await sb
                .from('cases')
                .select('remaining_amount, name')
                .eq('id', caseId)
                .single();

            if (fetchError) throw fetchError;

            // 2. Update remaining amount in cases table
            const newRemaining = caseData.remaining_amount - amount;
            const { error: updateError } = await sb
                .from('cases')
                .update({ remaining_amount: newRemaining })
                .eq('id', caseId);

            if (updateError) throw updateError;

            const donationStatus = method === 'wallet' ? 'قيد المراجعة' : (newRemaining <= 0 ? 'مكتمل' : 'مقبول');

            // 3. Upload receipt if it's a wallet payment
            let receiptUrl = null;
            if (method === 'wallet' && walletData && walletData.receiptFile) {
                const file = walletData.receiptFile;
                const fileExt = file.name.split('.').pop();
                const fileName = `receipt_${Date.now()}.${fileExt}`;
                const filePath = `receipts/${fileName}`;

                try {
                    const { error: uploadError } = await sb.storage
                        .from('donations')
                        .upload(filePath, file);

                    if (uploadError) {
                        // الـ bucket غير موجود أو خطأ في الرفع — نكمل بدون صورة
                        console.warn('تعذّر رفع الإيصال:', uploadError.message);
                    } else {
                        const { data: urlData } = sb.storage.from('donations').getPublicUrl(filePath);
                        receiptUrl = urlData.publicUrl;
                    }
                } catch (uploadErr) {
                    console.warn('تعذّر رفع الإيصال:', uploadErr.message);
                }
            }

            // 4. Record the donation
            await sb.from('donations').insert({
                donor_name: name,
                phone: phone,
                amount: amount,
                case_id: caseId,
                case_name: caseData.name,
                payment_method: method,
                status: donationStatus,
                attachment_url: receiptUrl,
                created_at: new Date().toISOString()
            });

            // 5. Send notification to admin
            await sb.from('notifications').insert({
                title: 'تبرع جديد (' + (method === 'visa' ? 'فيزا' : 'محفظة') + ')',
                message: `تبرع ${name} بمبلغ ${amount} جنيه لحالة ${caseData.name}. ${method === 'wallet' ? 'يرجى مراجعة الإيصال.' : ''}`,
                type: 'donation',
                image_url: receiptUrl,
                is_read: false
            });

            return true;
        } catch (error) {
            console.error('Error completing donation:', error);
            alert('حدث خطأ أثناء الاتصال بقاعدة البيانات: ' + error.message);
            return false;
        }
    }

    // --- Visa Form Submission ---
    visaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = visaForm.querySelector('.pay-btn');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'جاري المعالجة...';

        const success = await completeDonation('visa');
        
        if (success) {
            paymentStatus.textContent = 'تمت عملية الدفع بنجاح! شكراً لتبرعك.';
            paymentStatus.className = 'status-message status-success';
            paymentStatus.classList.remove('hidden');
            
            visaForm.reset();
            setTimeout(() => { window.location.href = 'تم اجراء التغير بنجاح.html'; }, 2000);
        } else {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });

    // --- Wallet Form Submission ---
    walletForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const receiptInput = document.getElementById('transfer-receipt');
        if (!receiptInput.files || receiptInput.files.length === 0) {
            alert('يرجى إرفاق صورة إيصال التحويل');
            return;
        }

        const submitBtn = walletForm.querySelector('.pay-btn');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'جاري الإرسال...';

        const success = await completeDonation('wallet', {
            receiptFile: receiptInput.files[0]
        });

        if (success) {
            paymentStatus.textContent = 'تم إرسال بيانات التحويل بنجاح. سيتم المراجعة قريباً.';
            paymentStatus.className = 'status-message status-success';
            paymentStatus.classList.remove('hidden');
            
            walletForm.reset();
            setTimeout(() => { window.location.href = 'تم اجراء التغير بنجاح.html'; }, 2000);
        } else {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });

    // --- Input Formatting for Visa ---
    const cardNumber = document.getElementById('card-number');
    if (cardNumber) {
        cardNumber.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            value = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = value;
        });
    }

    const expiryDate = document.getElementById('expiry-date');
    if (expiryDate) {
        expiryDate.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
        });
    }

    const cvv = document.getElementById('cvv');
    if (cvv) {
        cvv.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    }
});
