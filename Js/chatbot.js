// ===== Smart Chatbot Widget =====
(function () {

    const STORAGE_KEY = "cb_history";

    // ---- روابط الصفحات ----
    const PAGES = {
        cases:       "عرض الحالات.html",
        login:       "تسجيل الدخول .html",
        register:    "تسجيل حساب جديد.html",
        contact:     "اتصال بنا.html",
        about:       "من نحن.html",
        profile:     "الصفحه الشخصية.html",
        home:        "الصفحه الرئسيه.html",
        faq:         "الاسئلة الشائعة.html",
        forgotPass:  "نسيت كلمة المرور.html",
        changePass:  "تحديث كلمة المرور.html",
        resetPass:   "اعادة تعين كلمه المرور.html",
        notifications: "الاشعارات.html",
    };

    function getPath(page) {
        const inHtml = /[/\\]html[/\\]/i.test(window.location.pathname);
        return inHtml ? page : "html/" + page;
    }

    function navigate(page) { window.location.href = getPath(page); }

    function actionBtn(label, icon, page) {
        return { label, icon, page };
    }

    // ---- قاعدة الردود ----
    const responses = [
        // كيف اتبرع
        {
            keywords: ["كيف اتبرع", "طريقة التبرع", "ابي اتبرع", "عايز اتبرع", "اريد التبرع", "ازاي اتبرع"],
            reply: "التبرع سهل في 3 خطوات 💚",
            steps: ["1️⃣ سجّل دخولك أو أنشئ حساباً", "2️⃣ اختر الحالة التي تريد دعمها", "3️⃣ اضغط «تبرع الآن» وأكمل الدفع"],
            actions: [
                actionBtn("تصفح الحالات", "fa-heart", PAGES.cases),
                actionBtn("تسجيل الدخول", "fa-right-to-bracket", PAGES.login),
            ],
            quick: ["طرق الدفع", "هل التبرع آمن؟", "إنشاء حساب"]
        },
        // تبرع عام
        {
            keywords: ["تبرع", "تبرعت"],
            reply: "رائع أنك تفكر في التبرع 🤲\nتصفح الحالات المتاحة واختر ما يلمس قلبك.",
            actions: [actionBtn("تصفح الحالات", "fa-list-ul", PAGES.cases)],
            quick: ["كيف اتبرع", "طرق الدفع", "هل التبرع آمن؟"]
        },
        // دفع
        {
            keywords: ["دفع", "طرق الدفع", "فيزا", "بطاقة", "كريدت", "مدفوعات"],
            reply: "نقبل الدفع عبر 🔒\n• بطاقات Visa / Mastercard\n• الدفع الإلكتروني الآمن\nجميع المعاملات مشفرة.",
            actions: [actionBtn("ابدأ التبرع", "fa-credit-card", PAGES.cases)],
            quick: ["هل التبرع آمن؟", "كيف اتبرع"]
        },
        // أمان
        {
            keywords: ["آمن", "امان", "موثوق", "ضمان", "مضمون"],
            reply: "نعم، منصتنا موثوقة تماماً ✅\nكل الحالات يتم التحقق منها يدوياً قبل النشر، والمدفوعات مشفرة.",
            actions: [
                actionBtn("اعرف أكثر عنا", "fa-circle-info", PAGES.about),
                actionBtn("تواصل معنا", "fa-envelope", PAGES.contact),
            ],
            quick: ["كيف اتبرع", "من أنتم"]
        },
        // حالات
        {
            keywords: ["حالة", "حالات", "مريض", "محتاج", "مساعدة", "عمليه", "علاج", "جهاز"],
            reply: "لدينا حالات إنسانية متعددة تحتاج دعمك 🤲\nيمكنك تصفحها وفلترتها حسب النوع.",
            actions: [actionBtn("عرض جميع الحالات", "fa-list-ul", PAGES.cases)],
            quick: ["كيف اتبرع", "طرق الدفع", "إنشاء حساب"]
        },
        // تسجيل دخول
        {
            keywords: ["تسجيل دخول", "دخول", "لوجين", "login", "سجل دخول"],
            reply: "سجّل دخولك للوصول لحسابك ومتابعة تبرعاتك.",
            actions: [
                actionBtn("تسجيل الدخول", "fa-right-to-bracket", PAGES.login),
                actionBtn("إنشاء حساب جديد", "fa-user-plus", PAGES.register),
            ],
            quick: ["نسيت كلمة المرور", "تغيير كلمة المرور"]
        },
        // إنشاء حساب
        {
            keywords: ["تسجيل", "حساب", "اشتراك", "انضمام", "إنشاء حساب", "حساب جديد", "سجل"],
            reply: "إنشاء حساب مجاني تماماً 😊\nبعد التسجيل ستتمكن من متابعة تبرعاتك وإدارة حسابك.",
            actions: [
                actionBtn("إنشاء حساب الآن", "fa-user-plus", PAGES.register),
                actionBtn("تسجيل الدخول", "fa-right-to-bracket", PAGES.login),
            ],
            quick: ["كيف اتبرع", "تصفح الحالات"]
        },
        // نسيت كلمة المرور
        {
            keywords: ["نسيت كلمة المرور", "نسيت الباسورد", "نسيت", "فقدت كلمة المرور", "reset password"],
            reply: "لا تقلق 😊 خطوات استعادة كلمة المرور:",
            steps: [
                "1️⃣ اضغط على «نسيت كلمة المرور» في صفحة الدخول",
                "2️⃣ أدخل بريدك الإلكتروني المسجل",
                "3️⃣ ستصلك رسالة على بريدك تحتوي رابط الاستعادة",
                "4️⃣ اضغط الرابط وأدخل كلمة المرور الجديدة"
            ],
            actions: [
                actionBtn("استعادة كلمة المرور", "fa-key", PAGES.forgotPass),
                actionBtn("تسجيل الدخول", "fa-right-to-bracket", PAGES.login),
            ],
            quick: ["تغيير كلمة المرور", "إنشاء حساب"]
        },
        // تغيير كلمة المرور
        {
            keywords: ["تغيير كلمة المرور", "تعديل كلمة المرور", "تحديث كلمة المرور", "تغيير الباسورد", "change password"],
            reply: "لتغيير كلمة المرور من داخل حسابك 🔐",
            steps: [
                "1️⃣ سجّل دخولك أولاً",
                "2️⃣ اذهب إلى «الملف الشخصي»",
                "3️⃣ اضغط على «تحديث كلمة المرور»",
                "4️⃣ أدخل كلمة المرور الحالية ثم الجديدة",
                "5️⃣ اضغط «حفظ» وتم ✅"
            ],
            actions: [
                actionBtn("تحديث كلمة المرور", "fa-lock", PAGES.changePass),
                actionBtn("ملفي الشخصي", "fa-user", PAGES.profile),
            ],
            quick: ["نسيت كلمة المرور", "تسجيل الدخول"]
        },
        // إعادة تعيين كلمة المرور
        {
            keywords: ["اعادة تعيين", "إعادة تعيين", "reset", "استعادة"],
            reply: "لإعادة تعيين كلمة المرور 🔑",
            steps: [
                "1️⃣ اضغط «نسيت كلمة المرور» في صفحة الدخول",
                "2️⃣ أدخل بريدك الإلكتروني",
                "3️⃣ افتح الرسالة الواردة واضغط الرابط",
                "4️⃣ أدخل كلمة المرور الجديدة وأكدها",
                "5️⃣ سجّل دخولك بكلمة المرور الجديدة ✅"
            ],
            actions: [
                actionBtn("إعادة تعيين كلمة المرور", "fa-rotate-right", PAGES.resetPass),
            ],
            quick: ["تسجيل الدخول", "تغيير كلمة المرور"]
        },
        // الملف الشخصي
        {
            keywords: ["ملف شخصي", "بروفايل", "حسابي", "تبرعاتي", "بياناتي", "معلوماتي"],
            reply: "من ملفك الشخصي يمكنك 👤\n• عرض ومتابعة تبرعاتك\n• تعديل بياناتك الشخصية\n• تغيير كلمة المرور\n• عرض الإشعارات",
            actions: [
                actionBtn("ملفي الشخصي", "fa-user", PAGES.profile),
                actionBtn("تغيير كلمة المرور", "fa-lock", PAGES.changePass),
            ],
            quick: ["تغيير كلمة المرور", "الإشعارات", "تسجيل الدخول"]
        },
        // تعديل البيانات
        {
            keywords: ["تعديل البيانات", "تعديل الحساب", "تغيير الاسم", "تغيير الايميل", "تحديث البيانات"],
            reply: "لتعديل بياناتك الشخصية ✏️",
            steps: [
                "1️⃣ سجّل دخولك",
                "2️⃣ اذهب إلى «الملف الشخصي»",
                "3️⃣ اضغط على «تعديل» بجانب البيانات التي تريد تغييرها",
                "4️⃣ احفظ التغييرات"
            ],
            actions: [
                actionBtn("ملفي الشخصي", "fa-user-pen", PAGES.profile),
            ],
            quick: ["تغيير كلمة المرور", "تسجيل الدخول"]
        },
        // الإشعارات
        {
            keywords: ["اشعارات", "إشعارات", "notifications", "تنبيهات"],
            reply: "يمكنك متابعة جميع إشعاراتك وتحديثات تبرعاتك من صفحة الإشعارات 🔔",
            actions: [
                actionBtn("صفحة الإشعارات", "fa-bell", PAGES.notifications),
            ],
            quick: ["ملفي الشخصي", "تسجيل الدخول"]
        },
        // من نحن
        {
            keywords: ["من انتم", "من أنتم", "عن الموقع", "عن المنصة", "من نحن"],
            reply: "نحن منصة تبرعات خيرية 💚\nهدفنا ربط المتبرعين بالمستفيدين بطريقة آمنة وشفافة.",
            actions: [
                actionBtn("صفحة من نحن", "fa-circle-info", PAGES.about),
                actionBtn("تواصل معنا", "fa-envelope", PAGES.contact),
            ],
            quick: ["كيف اتبرع", "تصفح الحالات"]
        },
        // تواصل
        {
            keywords: ["تواصل", "اتصال", "هاتف", "ايميل", "بريد", "اتصل"],
            reply: "يسعدنا تواصلك معنا 📬\n📧 ahussin9125@gmail.com\n📞 01020152710",
            actions: [actionBtn("صفحة التواصل", "fa-envelope", PAGES.contact)],
            quick: ["من أنتم", "كيف اتبرع"]
        },
        // أسئلة شائعة
        {
            keywords: ["اسئلة", "أسئلة شائعة", "faq", "استفسار", "سؤال"],
            reply: "يمكنك الاطلاع على الأسئلة الشائعة للحصول على إجابات سريعة.",
            actions: [actionBtn("الأسئلة الشائعة", "fa-circle-question", PAGES.faq)],
            quick: ["تواصل معنا", "كيف اتبرع"]
        },
        // شكر
        {
            keywords: ["شكرا", "شكراً", "ممتاز", "رائع", "جميل", "مشكور", "تسلم"],
            reply: "شكراً لك على كلماتك الطيبة 🌟\nهل تحتاج مساعدة في شيء آخر؟",
            actions: [],
            quick: ["كيف اتبرع", "تصفح الحالات", "تواصل معنا"]
        },
        // تحية
        {
            keywords: ["مرحبا", "هلا", "السلام", "اهلا", "أهلاً", "هاي", "hi", "hello", "صباح", "مساء"],
            reply: "أهلاً وسهلاً بك! 👋\nأنا مساعدك الذكي في منصة تبرعات خيرية.\nكيف يمكنني مساعدتك؟",
            actions: [],
            quick: ["كيف اتبرع", "تصفح الحالات", "من أنتم", "تواصل معنا"]
        }
    ];

    const defaultReply = {
        reply: "لم أفهم سؤالك تماماً 😅\nجرب أحد الخيارات أدناه أو تواصل مع فريقنا.",
        actions: [actionBtn("تواصل معنا", "fa-envelope", PAGES.contact)],
        quick: ["كيف اتبرع", "تصفح الحالات", "نسيت كلمة المرور", "تواصل معنا"]
    };

    function getResponse(text) {
        const lower = text.toLowerCase().trim();
        for (const r of responses) {
            if (r.keywords.some(k => lower.includes(k))) return r;
        }
        return defaultReply;
    }

    // ---- sessionStorage: يحفظ المحادثة طول الجلسة ويمسحها عند إغلاق المتصفح ----
    function saveHistory(history) {
        try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history)); } catch (_) {}
    }

    function loadHistory() {
        try {
            const raw = sessionStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (_) { return []; }
    }

    function clearHistory() {
        sessionStorage.removeItem(STORAGE_KEY);
    }

    // ---- بناء الـ HTML ----
    function buildWidget() {
        const t = document.createElement("button");
        t.id = "chatbot-toggle";
        t.setAttribute("aria-label", "فتح المحادثة");
        t.innerHTML = `<i class="fa-solid fa-comments"></i><span class="badge" id="cb-badge">1</span>`;

        const w = document.createElement("div");
        w.id = "chatbot-window";
        w.setAttribute("role", "dialog");
        w.setAttribute("aria-label", "نافذة المحادثة");
        w.innerHTML = `
            <div class="cb-header">
                <div class="cb-avatar"><i class="fa-solid fa-robot"></i></div>
                <div class="cb-header-info">
                    <h4>مساعد تبرعات خيرية</h4>
                    <span>🟢 متاح الآن</span>
                </div>
                <div style="display:flex;gap:6px;align-items:center;">
                    <button class="cb-close" id="cb-clear-btn" title="مسح المحادثة" aria-label="مسح المحادثة" style="font-size:0.85rem;">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                    <button class="cb-close" id="cb-close-btn" aria-label="إغلاق">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </div>
            <div class="cb-messages" id="cb-messages"></div>
            <div class="cb-quick-replies" id="cb-quick-replies"></div>
            <div class="cb-input-area">
                <button class="cb-send" id="cb-send-btn" aria-label="إرسال"><i class="fa-solid fa-paper-plane"></i></button>
                <input type="text" id="cb-input" placeholder="اكتب رسالتك..." autocomplete="off" />
            </div>`;

        document.body.appendChild(t);
        document.body.appendChild(w);
    }

    function init() {
        buildWidget();

        const toggle    = document.getElementById("chatbot-toggle");
        const win       = document.getElementById("chatbot-window");
        const closeBtn  = document.getElementById("cb-close-btn");
        const clearBtn  = document.getElementById("cb-clear-btn");
        const messages  = document.getElementById("cb-messages");
        const input     = document.getElementById("cb-input");
        const sendBtn   = document.getElementById("cb-send-btn");
        const badge     = document.getElementById("cb-badge");
        const quickArea = document.getElementById("cb-quick-replies");

        let opened  = false;
        let history = loadHistory(); // [ {role:"bot"|"user", text, steps, actions, quick} ]

        // badge بعد ثانيتين إذا ما في محادثة سابقة
        if (history.length === 0) {
            setTimeout(() => { badge.style.display = "flex"; }, 2000);
        }

        // ---- رسم رسالة في الـ DOM بدون حفظ (للاستعادة) ----
        function renderMsg(entry, animate) {
            if (entry.role === "user") {
                const msg = document.createElement("div");
                msg.className = "cb-msg user";
                msg.textContent = entry.text;
                messages.appendChild(msg);
            } else {
                const msg = document.createElement("div");
                msg.className = "cb-msg bot";
                msg.style.whiteSpace = "pre-line";
                if (animate) msg.style.animation = "msgIn 0.25s ease";
                msg.textContent = entry.text;
                messages.appendChild(msg);

                if (entry.steps && entry.steps.length) {
                    const stepsEl = document.createElement("div");
                    stepsEl.className = "cb-msg bot cb-steps";
                    stepsEl.innerHTML = entry.steps.map(s => `<div class="cb-step">${s}</div>`).join("");
                    messages.appendChild(stepsEl);
                }

                if (entry.actions && entry.actions.length) {
                    const actEl = document.createElement("div");
                    actEl.className = "cb-actions";
                    entry.actions.forEach(a => {
                        const btn = document.createElement("button");
                        btn.className = "cb-action-btn";
                        btn.innerHTML = `<i class="fa-solid ${a.icon}"></i> ${a.label}`;
                        btn.addEventListener("click", () => navigate(a.page));
                        actEl.appendChild(btn);
                    });
                    messages.appendChild(actEl);
                }

                if (entry.quick && entry.quick.length) {
                    renderQuick(entry.quick);
                }
            }
        }

        // ---- استعادة المحادثة من sessionStorage ----
        function restoreHistory() {
            messages.innerHTML = "";
            quickArea.innerHTML = "";
            history.forEach((entry, i) => {
                renderMsg(entry, false);
            });
            scrollBottom();
        }

        // ---- إضافة رسالة بوت جديدة مع typing ----
        function addBotMsg(text, actions = [], quick = [], steps = []) {
            const typing = document.createElement("div");
            typing.className = "cb-typing";
            typing.innerHTML = "<span></span><span></span><span></span>";
            messages.appendChild(typing);
            scrollBottom();

            setTimeout(() => {
                typing.remove();
                const entry = { role: "bot", text, steps, actions, quick };
                history.push(entry);
                saveHistory(history);
                renderMsg(entry, true);
                scrollBottom();
            }, 800);
        }

        function addUserMsg(text) {
            quickArea.innerHTML = "";
            const entry = { role: "user", text };
            history.push(entry);
            saveHistory(history);
            renderMsg(entry, false);
            scrollBottom();
        }

        function renderQuick(items) {
            quickArea.innerHTML = "";
            items.forEach(label => {
                const btn = document.createElement("button");
                btn.className = "cb-quick-btn";
                btn.textContent = label;
                btn.addEventListener("click", () => handleSend(label));
                quickArea.appendChild(btn);
            });
        }

        function scrollBottom() {
            messages.scrollTop = messages.scrollHeight;
        }

        function handleSend(text) {
            text = text.trim();
            if (!text) return;
            addUserMsg(text);
            input.value = "";
            const res = getResponse(text);
            addBotMsg(res.reply, res.actions || [], res.quick || [], res.steps || []);
        }

        function openChat() {
            opened = true;
            win.classList.add("open");
            badge.style.display = "none";

            if (history.length === 0) {
                // محادثة جديدة
                addBotMsg(
                    "أهلاً وسهلاً! 👋 أنا مساعدك الذكي.\nاختر ما يناسبك أو اكتب سؤالك:",
                    [],
                    ["كيف اتبرع", "تصفح الحالات", "من أنتم", "تواصل معنا", "إنشاء حساب"]
                );
            } else {
                // استعادة المحادثة
                restoreHistory();
            }
            setTimeout(() => input.focus(), 300);
        }

        function closeChat() {
            opened = false;
            win.classList.remove("open");
        }

        // مسح المحادثة
        clearBtn.addEventListener("click", () => {
            clearHistory();
            history = [];
            messages.innerHTML = "";
            quickArea.innerHTML = "";
            addBotMsg(
                "تم مسح المحادثة 🗑️\nكيف يمكنني مساعدتك؟",
                [],
                ["كيف اتبرع", "تصفح الحالات", "من أنتم", "تواصل معنا"]
            );
        });

        toggle.addEventListener("click", () => opened ? closeChat() : openChat());
        closeBtn.addEventListener("click", closeChat);
        sendBtn.addEventListener("click", () => handleSend(input.value));
        input.addEventListener("keydown", e => {
            if (e.key === "Enter") handleSend(input.value);
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

})();
