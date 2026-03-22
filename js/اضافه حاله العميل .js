const sb = createSupabaseClient();

async function checkUser() {
    if (!sb) return;
    const { data } = await sb.auth.getUser();
    const user = data.user;
    if (!user) {
        window.location.href = "تسجيل الدخول .html";
    } else {
        const loginBtn = document.getElementById("loginNavItem");
        if (loginBtn) loginBtn.style.display = "none";
    }
}

async function checkUserAndImage() {
    if (!sb) return;
    const { data: { user } } = await sb.auth.getUser();
    if (user) {
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
    }
}

async function logout() {
    if (!sb) return;
    await sb.auth.signOut();
    window.location.href = "صفحه العرض.html";
}

document.getElementById("logoutBtn").addEventListener("click", async (e) => {
    e.preventDefault();
    await logout();
});

window.addEventListener('load', () => {
    checkUserAndImage();
    checkUser();
});

async function submitCase() {
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;
    const type = document.getElementById("caseType").value;
    const desc = document.getElementById("description").value;

    if (!name || !email || !phone || !type || !desc) {
        alert("من فضلك املأ جميع البيانات");
        return;
    }

    try {
        const { error } = await sb.from('cases').insert([{
            name,
            email,
            phone,
            type,
            description: desc,
            status: 'قيد المراجعة',
            required_amount: 0,
            remaining_amount: 1
        }]);

        if (error) throw error;

        document.getElementById("result").innerText = "تم إرسال الطلب بنجاح ✅ سيتم مراجعته من المشرف.";
        // Reset form
        document.getElementById("name").value = "";
        document.getElementById("email").value = "";
        document.getElementById("phone").value = "";
        document.getElementById("description").value = "";
    } catch (error) {
        console.error('Error submitting case:', error);
        alert("حدث خطأ أثناء إرسال الطلب، حاول مرة أخرى.");
    }
}

function sendMessage() {
    const input = document.getElementById("chatInput");
    const message = input.value.trim();

    if (message === "") return;

    const chatBox = document.getElementById("chatBox");

    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message", "user-msg");
    msgDiv.innerText = message;

    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    input.value = "";

    // رد تلقائي من المشرف (تجريبي)
    setTimeout(() => {
        const adminReply = document.createElement("div");
        adminReply.classList.add("message", "admin-msg");
        adminReply.innerText = "تم استلام رسالتك، سيتم الرد بعد مراجعة الحالة.";
        chatBox.appendChild(adminReply);
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 1000);
}
