// ===== Smart Chatbot Widget =====
(function () {

    const STORAGE_KEY = "cb_history";

    // ---- حالة المستخدم ----
    let currentUser = null;

    async function checkUser() {
        try {
            if (typeof createSupabaseClient === "function") {
                const sb = createSupabaseClient();
                if (sb) {
                    const { data } = await sb.auth.getUser();
                    currentUser = data?.user || null;
                }
            }
        } catch (_) { currentUser = null; }
    }

    // ---- روابط الصفحات ----
    const PAGES = {
        cases:         "عرض الحالات.html",
        login:         "تسجيل الدخول .html",
        register:      "تسجيل حساب جديد.html",
        contact:       "اتصال بنا.html",
        about:         "من نحن.html",
        profile:       "الصفحه الشخصية.html",
        home:          "الصفحه الرئسيه.html",
        faq:           "الاسئلة الشائعة.html",
        forgotPass:    "نسيت كلمة المرور.html",
        changePass:    "تحديث كلمة المرور.html",
        resetPass:     "اعادة تعين كلمه المرور.html",
        notifications: "الاشعارات.html",
    };

    function getPath(page) {
        const inHtml = /[/\\]html[/\\]/i.test(window.location.pathname);
        return inHtml ? page : "html/" + page;
    }

    function navigate(page) { window.location.href = getPath(page); }
    function actionBtn(label, icon, page) { return { label, icon, page }; }

    // ---- أزرار وردود ذكية حسب حالة تسجيل الدخول ----
    function authActions() {
        if (currentUser) {
            return [
                actionBtn("ملفي الشخصي", "fa-user", PAGES.profile),
                actionBtn("تصفح الحالات", "fa-heart", PAGES.cases),
            ];
        }
        return [
            actionBtn("تسجيل الدخول", "fa-right-to-bracket", PAGES.login),
            actionBtn("إنشاء حساب", "fa-user-plus", PAGES.register),
        ];
    }

    function donateActions() {
        if (currentUser) {
            return [actionBtn("تصفح الحالات", "fa-heart", PAGES.cases)];
        }
        return [
            actionBtn("تصفح الحالات", "fa-heart", PAGES.cases),
            actionBtn("سجل دخول أولاً", "fa-right-to-bracket", PAGES.login),
        ];
    }

    function welcomeQuick() {
        return currentUser
            ? ["كيف اتبرع", "تصفح الحالات", "ملفي الشخصي", "تواصل معنا"]
            : ["كيف اتبرع", "تصفح الحالات", "إنشاء حساب", "تواصل معنا"];
    }

    function welcomeMsg() {
        if (currentUser) {
            const name = (currentUser.email || "").split("@")[0];
            return `أهلاً ${name}! 👋\nكيف يمكنني مساعدتك اليوم؟`;
        }
        return "أهلاً وسهلاً! 👋 أنا مساعدك الذكي.\nاختر ما يناسبك أو اكتب سؤالك:";
    }

    // ---- قاعدة الردود الديناميكية ----
    function getResponses() {
        const li = !!currentUser; // loggedIn
        return [
            {
                keywords: ["كيف اتبرع", "طريقة التبرع", "ابي اتبرع", "عايز اتبرع", "اريد التبرع", "ازاي اتبرع"],
                reply: "التبرع سهل في 3 خطوات 💚",
                steps: li
                    ? ["1️⃣ اختر الحالة التي تريد دعمها", "2️⃣ اضغط «تبرع الآن»", "3️⃣ أكمل الدفع ✅"]
                    : ["1️⃣ سجّل دخولك أو أنشئ حساباً", "2️⃣ اختر الحالة التي تريد دعمها", "3️⃣ اضغط «تبرع الآن» وأكمل الدفع"],
                actions: donateActions(),
                quick: li ? ["طرق الدفع", "هل التبرع آمن؟"] : ["طرق الدفع", "هل التبرع آمن؟", "إنشاء حساب"]
            },
            {
                keywords: ["تبرع", "تبرعت"],
                reply: "رائع أنك تفكر في التبرع 🤲\nتصفح الحالات المتاحة واختر ما يلمس قلبك.",
                actions: donateActions(),
                quick: ["كيف اتبرع", "طرق الدفع", "هل التبرع آمن؟"]
            },
            {
                keywords: ["دفع", "طرق الدفع", "فيزا", "بطاقة", "كريدت", "مدفوعات"],
                reply: "نقبل الدفع عبر 🔒\n• بطاقات Visa / Mastercard\n• الدفع الإلكتروني الآمن\nجميع المعاملات مشفرة.",
                actions: [actionBtn("ابدأ التبرع", "fa-credit-card", PAGES.cases)],
                quick: ["هل التبرع آمن؟", "كيف اتبرع"]
            },
            {
                keywords: ["آمن", "امان", "موثوق", "ضمان", "مضمون"],
                reply: "نعم، منصتنا موثوقة تماماً ✅\nكل الحالات يتم التحقق منها يدوياً قبل النشر، والمدفوعات مشفرة.",
                actions: [
                    actionBtn("اعرف أكثر عنا", "fa-circle-info", PAGES.about),
                    actionBtn("تواصل معنا", "fa-envelope", PAGES.contact),
                ],
                quick: ["كيف اتبرع", "من أنتم"]
            },
            {
                keywords: ["حالة", "حالات", "مريض", "محتاج", "مساعدة", "عمليه", "علاج", "جهاز"],
                reply: "لدينا حالات إنسانية متعددة تحتاج دعمك 🤲",
                actions: [actionBtn("عرض جميع الحالات", "fa-list-ul", PAGES.cases)],
                quick: li ? ["كيف اتبرع", "طرق الدفع"] : ["كيف اتبرع", "طرق الدفع", "إنشاء حساب"]
            },
            {
                keywords: ["تسجيل دخول", "دخول", "لوجين", "login", "سجل دخول"],
                reply: li
                    ? "أنت مسجل دخولك بالفعل ✅\nيمكنك الوصول لحسابك مباشرة."
                    : "سجّل دخولك للوصول لحسابك ومتابعة تبرعاتك.",
                actions: li
                    ? [actionBtn("ملفي الشخصي", "fa-user", PAGES.profile)]
                    : [
                        actionBtn("تسجيل الدخول", "fa-right-to-bracket", PAGES.login),
                        actionBtn("إنشاء حساب جديد", "fa-user-plus", PAGES.register),
                      ],
                quick: li ? ["ملفي الشخصي", "تصفح الحالات"] : ["نسيت كلمة المرور", "إنشاء حساب"]
            },
            {
                keywords: ["تسجيل", "حساب", "اشتراك", "انضمام", "إنشاء حساب", "حساب جديد", "سجل"],
                reply: li
                    ? "أنت لديك حساب بالفعل ✅\nيمكنك إدارة حسابك من الملف الشخصي."
                    : "إنشاء حساب مجاني تماماً 😊\nبعد التسجيل ستتمكن من متابعة تبرعاتك.",
                actions: li
                    ? [actionBtn("ملفي الشخصي", "fa-user", PAGES.profile)]
                    : [
                        actionBtn("إنشاء حساب الآن", "fa-user-plus", PAGES.register),
                        actionBtn("تسجيل الدخول", "fa-right-to-bracket", PAGES.login),
                      ],
                quick: li ? ["تصفح الحالات", "كيف اتبرع"] : ["كيف اتبرع", "تصفح الحالات"]
            },
            {
                keywords: ["نسيت كلمة المرور", "نسيت الباسورد", "نسيت", "فقدت كلمة المرور"],
                reply: "لا تقلق 😊 خطوات استعادة كلمة المرور:",
                steps: [
                    "1️⃣ اضغط على «نسيت كلمة المرور»",
                    "2️⃣ أدخل بريدك الإلكتروني أو رقم هاتفك",
                    "3️⃣ ستصلك رسالة برمز التحقق",
                    "4️⃣ أدخل الرمز وعيّن كلمة مرور جديدة"
                ],
                actions: [actionBtn("استعادة كلمة المرور", "fa-key", PAGES.forgotPass)],
                quick: li ? ["تغيير كلمة المرور", "ملفي الشخصي"] : ["تغيير كلمة المرور", "إنشاء حساب"]
            },
            {
                keywords: ["تغيير كلمة المرور", "تعديل كلمة المرور", "تحديث كلمة المرور", "تغيير الباسورد"],
                reply: "لتغيير كلمة المرور 🔐",
                steps: [
                    "1️⃣ اذهب إلى «الملف الشخصي»",
                    "2️⃣ اضغط على «تحديث كلمة المرور»",
                    "3️⃣ أدخل كلمة المرور الجديدة",
                    "4️⃣ اضغط «حفظ» ✅"
                ],
                actions: [
                    actionBtn("تحديث كلمة المرور", "fa-lock", PAGES.changePass),
                    ...(li ? [actionBtn("ملفي الشخصي", "fa-user", PAGES.profile)] : []),
                ],
                quick: li ? ["نسيت كلمة المرور", "ملفي الشخصي"] : ["نسيت كلمة المرور", "تسجيل الدخول"]
            },
            {
                keywords: ["ملف شخصي", "بروفايل", "حسابي", "تبرعاتي", "بياناتي", "معلوماتي"],
                reply: li
                    ? "من ملفك الشخصي يمكنك 👤\n• عرض ومتابعة تبرعاتك\n• تعديل بياناتك\n• تغيير كلمة المرور\n• عرض الإشعارات"
                    : "لعرض ملفك الشخصي تحتاج لتسجيل الدخول أولاً.",
                actions: li
                    ? [
                        actionBtn("ملفي الشخصي", "fa-user", PAGES.profile),
                        actionBtn("تغيير كلمة المرور", "fa-lock", PAGES.changePass),
                      ]
                    : [
                        actionBtn("تسجيل الدخول", "fa-right-to-bracket", PAGES.login),
                        actionBtn("إنشاء حساب", "fa-user-plus", PAGES.register),
                      ],
                quick: li ? ["تغيير كلمة المرور", "الإشعارات"] : ["تسجيل الدخول", "إنشاء حساب"]
            },
            {
                keywords: ["اشعارات", "إشعارات", "تنبيهات"],
                reply: li
                    ? "يمكنك متابعة جميع إشعاراتك من هنا 🔔"
                    : "لعرض الإشعارات تحتاج لتسجيل الدخول أولاً.",
                actions: li
                    ? [actionBtn("صفحة الإشعارات", "fa-bell", PAGES.notifications)]
                    : [actionBtn("تسجيل الدخول", "fa-right-to-bracket", PAGES.login)],
                quick: li ? ["ملفي الشخصي"] : ["إنشاء حساب"]
            },
            {
                keywords: ["من انتم", "من أنتم", "عن الموقع", "عن المنصة", "من نحن"],
                reply: "نحن منصة تبرعات خيرية 💚\nهدفنا ربط المتبرعين بالمستفيدين بطريقة آمنة وشفافة.",
                actions: [
                    actionBtn("صفحة من نحن", "fa-circle-info", PAGES.about),
                    actionBtn("تواصل معنا", "fa-envelope", PAGES.contact),
                ],
                quick: ["كيف اتبرع", "تصفح الحالات"]
            },
            {
                keywords: ["تواصل", "اتصال", "هاتف", "ايميل", "بريد", "اتصل"],
                reply: "يسعدنا تواصلك معنا 📬\n📧 ahussin9125@gmail.com\n📞 01020152710",
                actions: [actionBtn("صفحة التواصل", "fa-envelope", PAGES.contact)],
                quick: ["من أنتم", "كيف اتبرع"]
            },
            {
                keywords: ["اسئلة", "أسئلة شائعة", "faq", "استفسار", "سؤال"],
                reply: "يمكنك الاطلاع على الأسئلة الشائعة للحصول على إجابات سريعة.",
                actions: [actionBtn("الأسئلة الشائعة", "fa-circle-question", PAGES.faq)],
                quick: ["تواصل معنا", "كيف اتبرع"]
            },
            {
                keywords: ["شكرا", "شكراً", "ممتاز", "رائع", "جميل", "مشكور", "تسلم"],
                reply: "شكراً لك على كلماتك الطيبة 🌟\nهل تحتاج مساعدة في شيء آخر؟",
                actions: [],
                quick: ["كيف اتبرع", "تصفح الحالات", "تواصل معنا"]
            },
            {
                keywords: ["مرحبا", "هلا", "السلام", "اهلا", "أهلاً", "هاي", "hi", "hello", "صباح", "مساء"],
                reply: welcomeMsg(),
                actions: authActions(),
                quick: welcomeQuick()
            }
        ];
    }

    function getResponse(text) {
        const lower = text.toLowerCase().trim();
        for (const r of getResponses()) {
            if (r.keywords.some(k => lower.includes(k))) return r;
        }
        return {
            reply: "لم أفهم سؤالك تماماً 😅\nجرب أحد الخيارات أدناه أو تواصل مع فريقنا.",
            actions: [actionBtn("تواصل معنا", "fa-envelope", PAGES.contact)],
            quick: currentUser
                ? ["كيف اتبرع", "تصفح الحالات", "ملفي الشخصي"]
                : ["كيف اتبرع", "تسجيل الدخول", "إنشاء حساب"]
        };
    }

    // ---- sessionStorage ----
    function saveHistory(history) {
        try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history)); } catch (_) {}
    }
    function loadHistory() {
        try {
            const raw = sessionStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (_) { return []; }
    }
    function clearHistory() { sessionStorage.removeItem(STORAGE_KEY); }

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
                    <span id="cb-status">🟢 متاح الآن</span>
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
        const statusEl  = document.getElementById("cb-status");

        let opened  = false;
        let history = loadHistory();

        if (history.length === 0) {
            setTimeout(() => { badge.style.display = "flex"; }, 2000);
        }

        // تحديث اسم المستخدم في الهيدر بعد تحميل البيانات
        function updateStatus() {
            if (currentUser && statusEl) {
                const name = (currentUser.email || "").split("@")[0];
                statusEl.textContent = `🟢 مرحباً ${name}`;
            }
        }

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

                if (entry.quick && entry.quick.length) renderQuick(entry.quick);
            }
        }

        function restoreHistory() {
            messages.innerHTML = "";
            quickArea.innerHTML = "";
            history.forEach(entry => renderMsg(entry, false));
            scrollBottom();
        }

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

        function scrollBottom() { messages.scrollTop = messages.scrollHeight; }

        function handleSend(text) {
            text = text.trim();
            if (!text) return;
            addUserMsg(text);
            input.value = "";
            const res = getResponse(text);
            addBotMsg(res.reply, res.actions || [], res.quick || [], res.steps || []);
        }

        async function openChat() {
            opened = true;
            win.classList.add("open");
            badge.style.display = "none";

            // تحقق من المستخدم عند فتح الشات
            await checkUser();
            updateStatus();

            if (history.length === 0) {
                addBotMsg(welcomeMsg(), authActions(), welcomeQuick());
            } else {
                restoreHistory();
            }
            setTimeout(() => input.focus(), 300);
        }

        function closeChat() {
            opened = false;
            win.classList.remove("open");
        }

        clearBtn.addEventListener("click", () => {
            clearHistory();
            history = [];
            messages.innerHTML = "";
            quickArea.innerHTML = "";
            addBotMsg(
                "تم مسح المحادثة 🗑️\nكيف يمكنني مساعدتك؟",
                authActions(),
                welcomeQuick()
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
