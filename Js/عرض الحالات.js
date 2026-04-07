const sb = createSupabaseClient();
const casesContainer = document.getElementById("cases");
const ADMIN_EMAIL = 'ahussin9125@gmail.com';
let currentUserIsAdmin = false;
let currentTypeFilter = 'جميع الحالات';

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

function createCaseCard(item) {
    const card = document.createElement("div");
    card.className = "case-card";
    card.setAttribute("data-title", (item.name || "").toLowerCase());
    card.setAttribute("data-type", (item.type || "").toLowerCase());

    const img = document.createElement("img");
    img.loading = "lazy";
    img.src = chooseImageSrc(item.image_url);
    img.onerror = () => { img.src = getFallbackImage(); };
    img.alt = item.name;

    const content = document.createElement("div");
    content.className = "case-content";

    const headerRow = document.createElement("div");
    headerRow.className = "case-header";

    const title = document.createElement("div");
    title.className = "case-title";
    title.textContent = item.name || "حالة";

    headerRow.appendChild(title);

    if (currentUserIsAdmin) {
        const adminLink = document.createElement("a");
        adminLink.className = "admin-edit-link";
        adminLink.href = "تعديل الحاله.html?id=" + encodeURIComponent(item.id);
        adminLink.textContent = "تعديل الحالة";
        headerRow.appendChild(adminLink);
    }

    const desc = document.createElement("div");
    desc.className = "case-desc";
    desc.textContent = item.description || "وصف الحالة غير متوفر";

    const details = document.createElement("div");
    details.className = "case-details";
    details.innerHTML = `
        <div style="color: var(--primary); font-weight: bold;">نوع الحالة: ${item.type || 'إنسانية'}</div>
    `;

    content.appendChild(headerRow);
    content.appendChild(desc);
    content.appendChild(details);

    const actions = document.createElement("div");
    actions.className = "case-actions";

    const detailsBtn = document.createElement("button");
    detailsBtn.className = "btn btn-details";
    detailsBtn.textContent = "عرض التفاصيل والمساعدة";
    detailsBtn.style.width = "100%";
    detailsBtn.onclick = function() {
        window.location.href = "تفاصيل الحاله.html?id=" + encodeURIComponent(item.id);
    };

    actions.appendChild(detailsBtn);

    card.appendChild(img);
    card.appendChild(content);
    card.appendChild(actions);

    return card;
}

async function loadCases() {
    if (!sb) {
        console.error("Supabase client not initialized");
        displayFallbackCases();
        return;
    }
    let data = null;
    let error = null;
    try {
        const res = await sb
            .from("cases")
            .select("*")
            .eq('status', 'مقبول')
            .order("created_at", { ascending: false });
        data = res.data;
        error = res.error;
    } catch (e) {
        error = e;
    }
    if (error) {
        console.warn("Falling back to unfiltered cases due to error:", error);
        const res2 = await sb
            .from("cases")
            .select("*")
            .order("created_at", { ascending: false });
        if (res2.error) {
            console.error("Error loading cases from Supabase:", res2.error);
            displayFallbackCases();
            return;
        }
        data = (res2.data || []).filter(item => {
            const s = item.status;
            if (typeof s === 'string') {
                return s === 'مقبول' || s === 'approved';
            }
            return (typeof item.remaining_amount === 'number') ? item.remaining_amount > 0 : true;
        });
    }

    if (!data || data.length === 0) {
        console.warn("No cases found in Supabase");
        displayFallbackCases();
        return;
    }

    if (!casesContainer) return;
    casesContainer.innerHTML = "";
    data.forEach(item => {
        casesContainer.appendChild(createCaseCard(item));
    });
}

function displayFallbackCases() {
    if (!casesContainer) return;
    const fallbackData = [
        { id: 1, name: "إطعام عائله", description: "عائلة تحتاج الي إطعام لسد جوعهم", required_amount: 10000, remaining_amount: 5000, image_url: "../صور المشروع/تبرع.jpg" },
        { id: 2, name: "إعمار منزل", description: "تنكيس منزل آيل للسقوط عاجل", required_amount: 30000, remaining_amount: 10000, image_url: "../صور المشروع/تبرع.jpg" },
        { id: 3, name: "ريم", description: "طفلة تحتاج الي عمليه جراحيه عاجله", required_amount: 20000, remaining_amount: 7500, image_url: "../صور المشروع/تبرع.jpg" }
    ];
    casesContainer.innerHTML = "";
    fallbackData.forEach(item => {
        casesContainer.appendChild(createCaseCard(item));
    });
}

function applyFilters() {
    const searchInput = document.getElementById("search");
    const input = searchInput ? searchInput.value.toLowerCase() : "";
    const typeFilterLower = (currentTypeFilter || 'جميع الحالات').toLowerCase();
    const cards = document.querySelectorAll(".case-card");
    cards.forEach(card => {
        const title = (card.getAttribute("data-title") || "").toLowerCase();
        const cardType = (card.getAttribute("data-type") || "").toLowerCase();
        const matchesText = title.includes(input);
        const matchesType =
            typeFilterLower === 'جميع الحالات' ||
            typeFilterLower === 'all' ||
            cardType === typeFilterLower;
        card.style.display = matchesText && matchesType ? "flex" : "none";
    });
}

function searchCases() {
    applyFilters();
}

const menuBtnH = document.getElementById('menuBtn');
const mainNavH = document.querySelector('nav.main-nav');
if (menuBtnH && mainNavH) {
    menuBtnH.addEventListener('click', () => {
        mainNavH.classList.toggle('active');
    });
}

async function checkUserAndImage() {
    currentUserIsAdmin = false;
    if (!sb) return;
    const { data } = await sb.auth.getUser();
    const user = data && data.user;

    const profileNavItem = document.getElementById("profileNavItem");
    const logoutBtn = document.getElementById("logoutBtn");

    if (!user) {
        if (profileNavItem) {
            profileNavItem.style.display = "none";
        }
        if (logoutBtn) {
            logoutBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i><span>تسجيل الدخول</span>';
            logoutBtn.href = "تسجيل الدخول .html";
            logoutBtn.onclick = null;
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
    currentUserIsAdmin = !!(metaIsAdmin || emailIsAdmin);

    const isBeneficiary = user.user_metadata && (user.user_metadata.user_type === 'beneficiary' || user.user_metadata.user_type === 'مستفيد');
    const addCaseLink = document.getElementById('addCaseLink');
    if (addCaseLink) {
        if (currentUserIsAdmin || isBeneficiary) {
            addCaseLink.style.display = 'flex';
            addCaseLink.onclick = function(e) {
                e.preventDefault();
                if (currentUserIsAdmin) {
                    window.location.href = "اضافة حاله جديده.html";
                } else {
                    window.location.href = "اضافه حاله العميل .html";
                }
            };
        } else {
            addCaseLink.style.display = 'none';
            addCaseLink.onclick = null;
        }
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    await checkUserAndImage();
    await loadCases();

    const menu = document.querySelector('.case-type-menu');
    const toggle = document.querySelector('.case-type-toggle');
    if (menu && toggle) {
        const label = toggle.querySelector('.case-type-label');

        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('open');
        });

        document.addEventListener('click', (e) => {
            if (!menu.contains(e.target)) {
                menu.classList.remove('open');
            }
        });

        const typeButtons = menu.querySelectorAll('.case-type-list button');
        typeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const dataType = btn.getAttribute('data-type') || 'all';
                if (dataType === 'all') {
                    currentTypeFilter = 'جميع الحالات';
                } else {
                    currentTypeFilter = dataType;
                }
                if (label) {
                    label.textContent = currentTypeFilter;
                }
                menu.classList.remove('open');
                applyFilters();
            });
        });
    }
});
