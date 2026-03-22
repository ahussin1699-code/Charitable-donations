document.getElementById('donateForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const name = document.getElementById('donorName').value;
    const amount = parseFloat(document.getElementById('donationAmount').value);
    const phone = document.getElementById('donorNumber').value;
    
    const urlParams = new URLSearchParams(window.location.search);
    const caseId = urlParams.get('id');

    if (!caseId) {
        alert('خطأ: لم يتم تحديد الحالة المراد التبرع لها');
        return;
    }

    if (name && amount && phone) {
        // التحقق من أن المبلغ المطلوب متوفر
        try {
            const { data: caseData, error: fetchError } = await sb
                .from('cases')
                .select('remaining_amount, name')
                .eq('id', caseId)
                .single();

            if (fetchError) throw fetchError;

            if (amount > caseData.remaining_amount) {
                alert('عذراً، مبلغ التبرع أكبر من المبلغ المتبقي للحالة (' + caseData.remaining_amount + ' جنيه)');
                return;
            }

            // تخزين بيانات التبرع في sessionStorage للانتقال لصفحة الدفع
            const donationData = {
                name: name,
                amount: amount,
                phone: phone,
                caseId: caseId,
                caseName: caseData.name
            };
            sessionStorage.setItem('pendingDonation', JSON.stringify(donationData));

            // الانتقال لصفحة الدفع
            window.location.href = "صفحة الدفع.html";

        } catch (error) {
            console.error('خطأ في التحقق من الحالة:', error);
            alert('حدث خطأ أثناء معالجة الطلب، يرجى المحاولة لاحقاً');
        }
    } else {
        alert('الرجاء تعبئة جميع الحقول المطلوبة');
    }
});

// وظيفة جلب بيانات الحالة عند تحميل الصفحة
async function loadCaseDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const caseId = urlParams.get('id');

    if (!caseId) {
        document.getElementById('caseNameDisplay').textContent = 'خطأ: لم يتم اختيار حالة';
        return;
    }

    try {
        if (!sb) {
            console.error('Supabase client not initialized');
            return;
        }

        const { data, error } = await sb
            .from('cases')
            .select('*')
            .eq('id', caseId)
            .single();

        if (error) throw error;

        if (data) {
            document.getElementById('caseNameDisplay').textContent = 'تبرع لحالة: ' + data.name;
            document.getElementById('requiredAmountDisplay').textContent = data.required_amount + ' جنيه';
            document.getElementById('remainingAmountDisplay').textContent = data.remaining_amount + ' جنيه';
            
            // تحديث عنوان الصفحة
            document.title = 'تبرع لحالة ' + data.name + ' - تبرعات خيرية';
        }
    } catch (error) {
        console.error('Error loading case details:', error);
        document.getElementById('caseNameDisplay').textContent = 'خطأ في تحميل بيانات الحالة';
    }
}

// تشغيل جلب البيانات عند التحميل
document.addEventListener('DOMContentLoaded', loadCaseDetails);
