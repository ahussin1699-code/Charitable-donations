const sb = createSupabaseClient();

async function sendReset() {
  const emailValue = document.getElementById('email')?.value.trim() || '';
  const errorMsg = document.getElementById('errorMsg');
  const successMsg = document.getElementById('successMsg');
  const sendButton = document.getElementById('sendButton');

  if (errorMsg) errorMsg.style.display = 'none';
  if (successMsg) successMsg.style.display = 'none';

  if (!emailValue) {
    if (errorMsg) {
      errorMsg.textContent = "يرجى إدخال البريد الإلكتروني أو رقم الهاتف";
      errorMsg.style.display = 'block';
    }
    return;
  }

  let finalEmail = emailValue;

  if (!emailValue.includes('@')) {
    const phoneRegex = /^[\d+]+$/;
    if (phoneRegex.test(emailValue)) {
      finalEmail = emailValue + "@charity.com";
    } else {
      if (errorMsg) {
        errorMsg.textContent = "يرجى إدخال بريد إلكتروني صحيح أو رقم هاتف صحيح";
        errorMsg.style.display = 'block';
      }
      return;
    }
  }

  if (sendButton) {
    sendButton.innerHTML = 'جاري الإرسال...';
    sendButton.disabled = true;
  }

  try {
    const { error } = await sb.auth.resetPasswordForEmail(finalEmail, {
      redirectTo: window.location.origin + '/html/تحديث كلمة المرور.html',
    });

    if (error) throw error;

    if (successMsg) {
      successMsg.textContent = "إذا كان الحساب موجوداً، فقد تم إرسال رابط إعادة تعيين كلمة المرور. يرجى التحقق من بريدك الإلكتروني.";
      successMsg.style.display = 'block';
    }
    const emailInput = document.getElementById('email');
    if (emailInput) emailInput.value = '';
  } catch (error) {
    console.error("Error resetting password:", error);
    if (errorMsg) {
      errorMsg.textContent = "حدث خطأ: " + (error.message || "لا يمكن إرسال الطلب حالياً");
      errorMsg.style.display = 'block';
    }
  } finally {
    if (sendButton) {
      sendButton.innerHTML = 'إرسال رابط إعادة التعيين';
      sendButton.disabled = false;
    }
  }
}

function login() {
  window.location.href = "تسجيل الدخول .html";
}

function goBack() {
  history.back();
}

const emailInputEl = document.getElementById('email');
if (emailInputEl) {
  emailInputEl.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      sendReset();
    }
  });
}
