let supabaseClient = null;
let selectedType = "";
let selectedGender = "";

window.addEventListener('DOMContentLoaded', () => {
    try {
        supabaseClient = createSupabaseClient();
        if (!supabaseClient) {
            console.error('فشل إنشاء اتصال Supabase');
        } else {
            console.log('✅ تم الاتصال بـ Supabase بنجاح');
        }
    } catch (error) {
        console.error('خطأ في تحميل Supabase:', error);
    }
});

document.querySelectorAll(".user-type-box").forEach(box => {
    box.addEventListener("click", () => {
        document.querySelectorAll(".user-type-box").forEach(b => b.classList.remove("selected"));
        box.classList.add("selected");
        selectedType = box.getAttribute("data-type");

        if (selectedType === "beneficiary") {
            document.getElementById("address").style.display = "block";
            document.getElementById("genderBoxes").style.display = "flex";
        } else {
            document.getElementById("address").style.display = "none";
            document.getElementById("genderBoxes").style.display = "none";
            selectedGender = "";
            document.querySelectorAll(".gender-box").forEach(g => g.classList.remove("selected"));
        }
    });
});

document.querySelectorAll(".gender-box").forEach(box => {
    box.addEventListener("click", () => {
        document.querySelectorAll(".gender-box").forEach(g => g.classList.remove("selected"));
        box.classList.add("selected");
        selectedGender = box.getAttribute("data-gender");
    });
});

async function register() {
    console.log('🔄 بدء عملية التسجيل...');

    try {
        const firstName = document.getElementById("firstName").value.trim();
        const lastName = document.getElementById("lastName").value.trim();
        const contact = document.getElementById("contact").value.trim();
        const address = document.getElementById("address").value.trim();
        const password = document.getElementById("password").value.trim();
        const confirmPassword = document.getElementById("confirmPassword").value.trim();
        const birthDate = document.getElementById("birthDate").value;

        if (!selectedType) {
            alert("⚠️ اختر نوع الحساب (متبرع أو مستفيد)");
            return;
        }

        if (!firstName || !lastName || !contact || !password || !confirmPassword || !birthDate) {
            alert("⚠️ من فضلك املأ جميع الحقول المطلوبة");
            return;
        }

        if (selectedType === "beneficiary" && (!address || !selectedGender)) {
            alert("⚠️ من فضلك املأ العنوان واختر الجنس");
            return;
        }

        if (password !== confirmPassword) {
            alert("❌ كلمة المرور وتأكيدها غير متطابقين");
            return;
        }

        if (password.length < 6) {
            alert("❌ كلمة المرور يجب أن تكون 6 أحرف على الأقل");
            return;
        }

        const isEmail = contact.includes("@");
        const isPhone = /^\d+$/.test(contact.replace(/[+\-() ]/g, '')) && contact.length >= 10;

        if (!isEmail && !isPhone) {
            alert("❌ من فضلك أدخل بريد إلكتروني صحيح أو رقم هاتف صالح");
            return;
        }

        let authParams = {};
        let finalEmailForAuth = "";

        if (isEmail) {
            finalEmailForAuth = contact;
            authParams = { email: contact, password: password };
        } else {
            let formattedPhone = contact.replace(/[+\-() ]/g, '');
            if (formattedPhone.startsWith('01') && formattedPhone.length === 11) {
                formattedPhone = '+2' + formattedPhone;
            } else if (!formattedPhone.startsWith('+')) {
                formattedPhone = '+' + formattedPhone;
            }
            
            finalEmailForAuth = formattedPhone.replace('+', '') + "@charity.internal";
            authParams = { email: finalEmailForAuth, password: password };
        }

        if (!supabaseClient) {
            alert("❌ خطأ في الاتصال بالخادم. يرجى تحديث الصفحة والمحاولة مرة أخرى");
            console.error('Supabase client is null');
            return;
        }

        const registerButton = document.querySelector('button[onclick="register()"]');
        let originalText = "";
        if (registerButton) {
            originalText = registerButton.innerHTML;
            registerButton.innerHTML = "جاري التسجيل...";
            registerButton.disabled = true;
        }

        console.log('📧 بدء إنشاء الحساب...');

        const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp({
            ...authParams,
            options: {
                data: {
                    full_name: `${firstName} ${lastName}`,
                    user_type: selectedType,
                    display_phone: !isEmail ? contact : ""
                }
            }
        });

        if (signUpError) {
            console.error('❌ خطأ في التسجيل:', signUpError);
            if (registerButton) {
                registerButton.innerHTML = originalText;
                registerButton.disabled = false;
            }

            let errorMessage = "فشل إنشاء الحساب: ";
            if (signUpError.message.includes("already registered")) {
                errorMessage += "هذا الحساب مسجل بالفعل";
            } else {
                errorMessage += signUpError.message;
            }
            alert(errorMessage);
            return;
        }

        console.log('✅ تم إنشاء الحساب في Auth');

        let userTypeAr = selectedType === "beneficiary" ? "مستفيد" : "متبرع";

        const genderAr = selectedGender === "male" ? "ذكر" : (selectedGender === "female" ? "أنثى" : "");

        try {
            const userDataToInsert = {
                id: signUpData.user.id,
                name: `${firstName} ${lastName}`,
                user_type: userTypeAr,
                created_at: new Date().toISOString(),
                status: "نشط",
                address: selectedType === "beneficiary" ? address : "",
                gender: selectedType === "beneficiary" ? genderAr : "",
                birth_date: birthDate,
                email: isEmail ? contact : finalEmailForAuth,
                phone: !isEmail ? contact : ""
            };

            const { data: userData, error: userError } = await supabaseClient.from("users").insert(userDataToInsert);

            if (userError) {
                console.warn('⚠️ تحذير في حفظ بيانات المستخدم:', userError);
            } else {
                console.log('✅ تم حفظ بيانات المستخدم');
            }
        } catch (dbError) {
            console.warn('⚠️ خطأ في قاعدة البيانات:', dbError);
        }

        console.log('🔐 تسجيل الدخول...');
        const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
            ...authParams
        });

        if (registerButton) {
            registerButton.innerHTML = originalText;
            registerButton.disabled = false;
        }

        if (signInError) {
            console.warn('⚠️ تحذير في تسجيل الدخول:', signInError);
            alert("✅ تم إنشاء الحساب بنجاح!\n\nقد تحتاج إلى تأكيد البريد الإلكتروني.\nسيتم تحويلك لصفحة تسجيل الدخول.");
            setTimeout(() => {
                window.location.href = "تسجيل الدخول .html";
            }, 1500);
            return;
        }

        console.log('✅✅✅ تم التسجيل بنجاح!');
        alert("🎉 مرحباً بك! تم إنشاء حسابك بنجاح");

        setTimeout(() => {
            window.location.href = "الصفحه الرئسيه.html";
        }, 1000);

    } catch (error) {
        console.error('❌ خطأ غير متوقع:', error);
        alert("❌ حدث خطأ: " + error.message + "\n\nيرجى المحاولة مرة أخرى أو التواصل مع الدعم الفني.");

        const registerButton = document.querySelector('button[onclick="register()"]');
        if (registerButton) {
            registerButton.innerHTML = "تسجيل";
            registerButton.disabled = false;
        }
    }
}
