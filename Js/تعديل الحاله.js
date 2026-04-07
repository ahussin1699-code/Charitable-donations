const sb = createSupabaseClient();

function getQueryParam(key) {
  const search = new URLSearchParams(window.location.search);
  return search.get(key);
}

async function loadCaseData() {
  if (!sb) return;

  const id = getQueryParam('id');
  if (!id) {
    alert('لا يوجد معرف للحالة في الرابط');
    window.location.href = 'عرض الحالات.html';
    return;
  }

  const nameInput = document.getElementById('caseName');
  const descInput = document.getElementById('caseDescription');
  const phoneInput = document.getElementById('phone');
  const statusInput = document.getElementById('caseStatus');

  try {
    const { data, error } = await sb
      .from('cases')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) {
      alert('لم يتم العثور على الحالة المطلوبة');
      window.location.href = 'عرض الحالات.html';
      return;
    }

    if (nameInput) nameInput.value = data.name || '';
    if (descInput) descInput.value = data.description || '';
    if (phoneInput) phoneInput.value = data.phone || '';
    if (statusInput) statusInput.value = data.status || 'قيد المراجعة';
  } catch (e) {
    console.error('خطأ في تحميل بيانات الحالة:', e);
    alert('تعذر تحميل بيانات الحالة، حاول مرة أخرى لاحقاً');
    window.location.href = 'عرض الحالات.html';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadCaseData();

  const form = document.getElementById('editForm');
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();

      const id = getQueryParam('id');
      if (!id) {
        alert('لا يوجد معرف للحالة في الرابط');
        return;
      }

      const formData = {
        name: document.getElementById('caseName')?.value,
        description: document.getElementById('caseDescription')?.value,
        phone: document.getElementById('phone')?.value,
        status: document.getElementById('caseStatus')?.value
      };

      const submitBtn = document.getElementById('submitBtn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'جاري الحفظ...';
      }

      try {
        const { error } = await sb
          .from('cases')
          .update(formData)
          .eq('id', id);

        if (error) throw error;

        alert('تم حفظ التعديلات بنجاح');
        window.location.href = 'تفاصيل الحاله.html?id=' + encodeURIComponent(id);
      } catch (err) {
        console.error('خطأ أثناء حفظ التعديلات:', err);
        alert('حدث خطأ أثناء حفظ التعديلات، حاول مرة أخرى');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'حفظ التعديلات';
        }
      }
    });
  }
});
