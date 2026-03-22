document.addEventListener('DOMContentLoaded', () => {
    const visaMethod = document.getElementById('visa-method');
    const walletMethod = document.getElementById('wallet-method');
    const visaForm = document.getElementById('visa-form');
    const walletForm = document.getElementById('wallet-form');
    const paymentStatus = document.getElementById('payment-status');

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
    async function completeDonation(method) {
        const donationData = JSON.parse(sessionStorage.getItem('pendingDonation'));
        if (!donationData) {
            console.error('No pending donation found');
            return;
        }

        try {
            // جلب البيانات الحالية للحالة
            const { data: caseData, error: fetchError } = await sb
                .from('cases')
                .select('remaining_amount')
                .eq('id', donationData.caseId)
                .single();

            if (fetchError) throw fetchError;

            // تحديث المبلغ المتبقي
            const newRemaining = caseData.remaining_amount - donationData.amount;
            const { error: updateError } = await sb
                .from('cases')
                .update({ remaining_amount: newRemaining })
                .eq('id', donationData.caseId);

            if (updateError) throw updateError;

            const donationStatus = method === 'wallet' ? 'قيد المراجعة' : (newRemaining <= 0 ? 'مكتمل' : 'مقبول');

            // تسجيل التبرع
            await sb.from('donations').insert({
                donor_name: donationData.name,
                phone: donationData.phone,
                amount: donationData.amount,
                case_id: donationData.caseId,
                case_name: donationData.caseName,
                payment_method: method,
                status: donationStatus,
                created_at: new Date().toISOString()
            });

            // إضافة إشعار
            await sb.from('notifications').insert({
                title: 'تبرع جديد (' + (method === 'visa' ? 'فيزا' : 'محفظة') + ')',
                message: 'تبرع ' + donationData.name + ' بمبلغ ' + donationData.amount + ' جنيه لحالة ' + donationData.caseName,
                type: 'donation',
                is_read: false
            });

            sessionStorage.removeItem('pendingDonation');
            return true;
        } catch (error) {
            console.error('Error completing donation:', error);
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

        // Simulate network delay
        setTimeout(async () => {
            const success = await completeDonation('visa');
            
            if (success) {
                paymentStatus.textContent = 'تمت عملية الدفع بنجاح! شكراً لتبرعك.';
                paymentStatus.className = 'status-message status-success';
                paymentStatus.classList.remove('hidden');
                
                visaForm.reset();

                setTimeout(() => {
                    window.location.href = 'تم اجراء التغير بنجاح.html';
                }, 2000);
            } else {
                paymentStatus.textContent = 'حدث خطأ أثناء إتمام العملية. يرجى المحاولة لاحقاً.';
                paymentStatus.className = 'status-message status-error';
                paymentStatus.classList.remove('hidden');
            }
            
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }, 1500);
    });

    // --- Wallet Form Submission ---
    walletForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = walletForm.querySelector('.pay-btn');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'جاري الإرسال...';

        // Simulate network delay
        setTimeout(async () => {
            const success = await completeDonation('wallet');

            if (success) {
                paymentStatus.textContent = 'تم إرسال بيانات التحويل بنجاح. سيتم المراجعة قريباً.';
                paymentStatus.className = 'status-message status-success';
                paymentStatus.classList.remove('hidden');
                
                walletForm.reset();

                setTimeout(() => {
                    window.location.href = 'تم اجراء التغير بنجاح.html';
                }, 2000);
            } else {
                paymentStatus.textContent = 'حدث خطأ أثناء إرسال البيانات. يرجى المحاولة لاحقاً.';
                paymentStatus.className = 'status-message status-error';
                paymentStatus.classList.remove('hidden');
            }
            
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }, 1500);
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
