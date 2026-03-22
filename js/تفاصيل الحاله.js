const sb = createSupabaseClient();
const ADMIN_EMAIL = 'ahussin9125@gmail.com';

function getFallbackImage() {
  return "../صور المشروع/تبرع.jpg";
}

function chooseImageSrc(value) {
  const v = typeof value === "string" ? value.trim() : "";
  if (!v) return getFallbackImage();
  if (v.startsWith("data:image/")) return v;
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  if (v.startsWith("../") || v.startsWith("./") || v.startsWith("/")) return v;
  return getFallbackImage();
}

const menuBtnD = document.getElementById('menuBtn');
const mainNavD = document.querySelector('nav.main-nav');
if (menuBtnD && mainNavD) {
    menuBtnD.addEventListener('click', () => {
        mainNavD.classList.toggle('active');
    });
}

async function checkUserAndImage() {
    if (!sb) return;
    const { data } = await sb.auth.getUser();
    const user = data && data.user;

    const profileNavItem = document.getElementById("profileNavItem");
    const logoutBtn = document.getElementById("logoutBtn");
    const deleteCaseBtn = document.getElementById("deleteCaseBtn");

    if (!user) {
        if (profileNavItem) {
            profileNavItem.style.display = "none";
        }
        if (logoutBtn) {
            logoutBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i><span>تسجيل الدخول</span>';
            logoutBtn.href = "تسجيل الدخول .html";
            logoutBtn.onclick = null;
        }
        if (deleteCaseBtn) {
            deleteCaseBtn.style.display = "none";
        }
        return;
    }

    if (profileNavItem) {
        profileNavItem.style.display = "flex";
    }

    if (logoutBtn) {
        logoutBtn.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i><span>خروج</span>';
        logoutBtn.href = "#";
        logoutBtn.onclick = async function(e) {
            e.preventDefault();
            if (sb) await sb.auth.signOut();
            window.location.href = "تسجيل الدخول .html";
        };
    }

    const { data: userData } = await sb
        .from('users')
        .select('profile_image')
        .eq('email', user.email)
        .maybeSingle();

    const profileImgSrc = userData?.profile_image || localStorage.getItem(`profileImage_${user.id}`);
    if (profileImgSrc) {
        const navProfileImg = document.getElementById("navProfileImg");
        if (navProfileImg) navProfileImg.src = profileImgSrc;
    }

    const metaIsAdmin = user.user_metadata && (user.user_metadata.is_admin === true || user.user_metadata.role === 'admin');
    const emailIsAdmin = user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    const isAdmin = !!(metaIsAdmin || emailIsAdmin);

    const adminContactBox = document.getElementById("adminContactBox");
    const donateNowBtn = document.getElementById("donateNowBtn");
    const contactBtn = document.getElementById("contactBtn");

    if (isAdmin) {
        // إذا كان المستخدم مسؤولاً
        if (adminContactBox) adminContactBox.style.display = "block";
        if (contactBtn) contactBtn.style.display = "inline-block";
        if (donateNowBtn) donateNowBtn.style.display = "none";
    } else {
        // إذا كان المستخدم عادياً (متبرع أو مستفيد)
        if (adminContactBox) adminContactBox.style.display = "none";
        if (contactBtn) contactBtn.style.display = "none";
        
        // إظهار زر التبرع لأي مستخدم مسجل دخوله وليس مسؤولاً
        if (donateNowBtn) donateNowBtn.style.display = "inline-block";
    }

    if (deleteCaseBtn) {
        deleteCaseBtn.style.display = isAdmin ? "inline-block" : "none";
    }
}

window.addEventListener('load', () => {
    checkUserAndImage();
    loadCaseDetails();
});

async function loadCaseDetails() {
  if (!sb) return;

  const params = new URLSearchParams(window.location.search);
  const caseId = params.get("id");

  const titleEl = document.getElementById("caseTitle");
  const shortEl = document.getElementById("caseShort");
  const descEl = document.getElementById("caseDesc");
  const avatarEl = document.getElementById("caseAvatar");
  const reqEl = document.getElementById("req");
  const colEl = document.getElementById("col");
  const remEl = document.getElementById("rem");
  const contactBtn = document.getElementById("contactBtn");
  const donateNowBtn = document.getElementById("donateNowBtn");

  if (!caseId) {
    if (titleEl) titleEl.textContent = "خطأ: لم يتم تحديد الحالة";
    if (shortEl) shortEl.textContent = "";
    if (descEl) descEl.textContent = "";
    if (contactBtn) contactBtn.disabled = true;
    if (donateNowBtn) donateNowBtn.disabled = true;
    return;
  }

  const deleteCaseBtn = document.getElementById("deleteCaseBtn");
  if (deleteCaseBtn) {
    deleteCaseBtn.addEventListener("click", async function () {
      if (!sb) return;

      const paramsInner = new URLSearchParams(window.location.search);
      const idInner = paramsInner.get("id");
      if (!idInner) {
        alert("❌ لا يوجد معرف للحالة في الرابط");
        return;
      }

      const confirmDelete = confirm("هل أنت متأكد من حذف هذه الحالة؟ هذا الإجراء لا يمكن التراجع عنه.");
      if (!confirmDelete) return;

      let hardDeleteError = null;
      try {
        const { error } = await sb
          .from("cases")
          .delete()
          .eq("id", idInner);
        hardDeleteError = error || null;
      } catch (e) {
        hardDeleteError = e;
      }

      if (hardDeleteError) {
        console.warn("لم يتم حذف الصف فعلياً، سيتم إخفاء الحالة بتصفير المبلغ المتبقي.", hardDeleteError);
      }

      const { error: softError } = await sb
        .from("cases")
        .update({ remaining_amount: 0 })
        .eq("id", idInner);

      if (softError) {
        alert("❌ حدث خطأ أثناء حذف الحالة: " + softError.message);
        console.error(softError);
        return;
      }

      alert("✅ تم حذف الحالة بنجاح");
      window.location.href = "عرض الحالات.html";
    });
  }

  try {
    const { data, error } = await sb
      .from("cases")
      .select("*")
      .eq("id", caseId)
      .single();

    if (error) throw error;

    if (!data) {
      if (titleEl) titleEl.textContent = "لم يتم العثور على الحالة";
      if (contactBtn) contactBtn.disabled = true;
      if (donateNowBtn) donateNowBtn.disabled = true;
      return;
    }

    const name = data.name || "";
    if (titleEl) titleEl.textContent = "تفاصيل حالة " + name;
    if (shortEl) shortEl.textContent = data.category || "";
    if (descEl) descEl.textContent = data.description || "";
    if (avatarEl) avatarEl.src = chooseImageSrc(data.image_url);

    const addressEl = document.getElementById("caseAddress");
    const phoneEl = document.getElementById("casePhone");
    const emailEl = document.getElementById("caseEmail");

    if (addressEl) addressEl.textContent = data.address || "غير متوفر";
    if (phoneEl) phoneEl.textContent = data.phone || "غير متوفر";
    if (emailEl) emailEl.textContent = data.email || "غير متوفر";

    if (contactBtn) {
      contactBtn.disabled = false;
      contactBtn.onclick = function () {
        const phone = data.phone || "";
        if (phone) {
          window.location.href = "tel:" + phone;
        } else {
          alert("معلومات التواصل غير متوفرة حالياً");
        }
      };
    }

    if (donateNowBtn) {
      donateNowBtn.disabled = false;
      donateNowBtn.onclick = function () {
        window.location.href = "صفحه التبرع.html?id=" + data.id;
      };
    }

    document.title = "تفاصيل حالة " + name;
  } catch (e) {
    console.error("Error loading case details:", e);
    if (titleEl) titleEl.textContent = "خطأ في تحميل بيانات الحالة";
    if (contactBtn) contactBtn.disabled = true;
    if (donateNowBtn) donateNowBtn.disabled = true;
  }
}
