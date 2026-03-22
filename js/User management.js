let sb = null;

async function init() {
    if (typeof createSupabaseClient === 'function') {
        sb = createSupabaseClient();
    }
    if (!sb) {
        console.error("Supabase client is not initialized");
        return;
    }
    await loadAdminHeaderInfo();
    await fetchUsers();
}

async function loadAdminHeaderInfo() {
    if (!sb) return;
    try {
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return;

        const { data: userData } = await sb
            .from('users')
            .select('name, profile_image')
            .eq('email', user.email)
            .maybeSingle();

        const adminName = userData?.name || user.user_metadata?.full_name || "المسؤول";
        const adminImg = userData?.profile_image || localStorage.getItem(`profileImage_${user.id}`) || "../images/default-avatar.png";

        const nameEl = document.getElementById('adminHeaderName');
        const imgEl = document.getElementById('adminHeaderImg');

        if (nameEl) nameEl.textContent = adminName;
        if (imgEl) imgEl.src = adminImg;
        if (imgEl) {
            imgEl.style.cursor = 'pointer';
            imgEl.addEventListener('click', function () {
                window.location.href = "الصفحه الشخصية.html";
            });
        }

        // التحقق من نوع المستخدم لإخفاء الشريط الجانبي إذا كان طبيباً
        if (userData?.user_type === 'طبيب') {
            const sidebar = document.getElementById('sidebar');
            const mainContent = document.querySelector('.main-content');
            const menuToggle = document.getElementById('menuToggle');
            
            if (sidebar) sidebar.style.display = 'none';
            if (menuToggle) menuToggle.style.display = 'none';
            if (mainContent) {
                mainContent.style.marginRight = '0';
                mainContent.style.width = '100%';
            }
        }
    } catch (error) {
        console.error("Error loading admin header info:", error);
    }
}

async function fetchUsers() {
    if (!sb) return;
    
    try {
        const { data: users, error } = await sb
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        renderUsers(users);
    } catch (error) {
        console.error("Error fetching users:", error);
    }
}

function renderUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">لا يوجد مستخدمين مسجلين حالياً</td></tr>';
        return;
    }

    tbody.innerHTML = users.map(user => `
        <tr data-id="${user.id}">
            <td>${user.name || 'بدون اسم'}</td>
            <td><span class="user-type ${getUserTypeClass(user.user_type)}">${user.user_type || 'غير محدد'}</span></td>
            <td>${user.email || 'بدون بريد'}</td>
            <td>${formatDate(user.created_at)}</td>
            <td><span class="status ${getStatusClass(user.status)}">${user.status || 'انتظار'}</span></td>
            <td class="actions">
                <a href="الصفحه الشخصية.html?userId=${user.id}" style="text-decoration: none;">
                    <button class="view-btn"><i class="fas fa-eye"></i> عرض</button>
                </a>
                <div class="edit-dropdown">
                    <button class="edit-btn" onclick="toggleDropdown(this)"><i class="fas fa-edit"></i> تعديل</button>
                    <div class="dropdown-content">
                        <button class="status-active-opt" onclick="updateStatus(this, 'نشط')"><i class="fas fa-check-circle"></i> تنشيط</button>
                        <button class="status-banned-opt" onclick="updateStatus(this, 'محظور')"><i class="fas fa-ban"></i> حظر</button>
                        <button class="status-pending-opt" onclick="updateStatus(this, 'انتظار')"><i class="fas fa-clock"></i> انتظار</button>
                        <button class="type-doctor-opt" onclick="updateUserType(this, 'طبيب')"><i class="fas fa-user-doctor"></i> تعيين طبيب</button>
                        <button class="type-admin-opt" onclick="updateUserType(this, 'مسؤول')"><i class="fas fa-user-shield"></i> تعيين مسؤول</button>
                    </div>
                </div>
            </td>
        </tr>
    `).join('');
}

function getUserTypeClass(type) {
    switch (type) {
        case 'متبرع': return 'user-type-donor';
        case 'مستفيد': return 'user-type-beneficiary';
        case 'طبيب': return 'user-type-doctor';
        case 'admin':
        case 'مسؤول': return 'user-type-admin';
        default: return '';
    }
}

async function updateUserType(btn, newType) {
    const row = btn.closest('tr');
    const userId = row.getAttribute('data-id');
    const emailCell = row.children[2];
    const nameCell = row.children[0];
    const email = emailCell ? (emailCell.textContent || '').trim() : '';
    const name = nameCell ? (nameCell.textContent || '').trim() : '';
    if (!sb || !userId) return;
    try {
        const { error } = await sb
            .from('users')
            .update({ user_type: newType })
            .eq('id', userId);
        if (error) throw error;
        if (newType === 'طبيب') {
            await sb.from('doctors').upsert({ email, user_id: userId, name }, { onConflict: 'email' });
        } else if (newType === 'مسؤول' || newType === 'admin') {
            await sb.from('supervisors').upsert({ email, user_id: userId, name }, { onConflict: 'email' });
        }
        const typeSpan = row.querySelector('.user-type');
        if (typeSpan) {
            typeSpan.textContent = newType;
            typeSpan.className = `user-type ${getUserTypeClass(newType)}`;
        }
        btn.closest('.dropdown-content').style.display = 'none';
    } catch (error) {
        console.error("Error updating user type:", error);
        alert("فشل تغيير نوع المستخدم");
    }
}

function getStatusClass(status) {
    switch (status) {
        case 'نشط': return 'status-active';
        case 'محظور': return 'status-banned';
        case 'انتظار': return 'status-pending';
        default: return 'status-pending';
    }
}

function formatDate(dateString) {
    if (!dateString) return '---';
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear().toString().slice(-2)}`;
}

function toggleDropdown(btn) {
    // إغلاق أي قوائم أخرى مفتوحة
    document.querySelectorAll('.dropdown-content').forEach(dropdown => {
        if (dropdown !== btn.nextElementSibling) {
            dropdown.style.display = 'none';
        }
    });
    
    const dropdown = btn.nextElementSibling;
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

async function updateStatus(btn, newStatus) {
    const row = btn.closest('tr');
    const userId = row.getAttribute('data-id');
    
    if (!sb || !userId) return;

    try {
        const { error } = await sb
            .from('users')
            .update({ status: newStatus })
            .eq('id', userId);

        if (error) throw error;
        
        // تحديث الواجهة
        const statusSpan = row.querySelector('.status');
        statusSpan.textContent = newStatus;
        statusSpan.className = `status ${getStatusClass(newStatus)}`;
        
        // إغلاق القائمة
        btn.closest('.dropdown-content').style.display = 'none';
    } catch (error) {
        console.error("Error updating status:", error);
        alert("فشل تحديث الحالة");
    }
}

// إغلاق القوائم عند الضغط في أي مكان آخر
document.addEventListener('click', function (event) {
    if (!event.target.closest('.edit-dropdown')) {
        document.querySelectorAll('.dropdown-content').forEach(dropdown => {
            dropdown.style.display = 'none';
        });
    }
});

document.addEventListener('DOMContentLoaded', function () {
    init();

    const searchInput = document.getElementById('userSearchInput');
    const typeFilter = document.getElementById('userTypeFilter');

    function filterTable() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        const selectedType = typeFilter ? typeFilter.value.toLowerCase() : 'all';
        const rows = document.querySelectorAll('#usersTableBody tr');

        rows.forEach(row => {
            const rowText = row.textContent.toLowerCase();
            const typeCell = row.querySelector('.user-type');
            const rowType = typeCell ? typeCell.textContent.toLowerCase() : '';
            
            // التحقق من البحث النصي
            const matchesSearch = rowText.includes(searchTerm);
            
            // التحقق من نوع المستخدم
            let matchesType = (selectedType === 'all');
            if (selectedType === 'admin') {
                matchesType = rowType.includes('admin') || rowType.includes('مسؤول');
            } else if (!matchesType) {
                matchesType = rowType === selectedType;
            }

            if (matchesSearch && matchesType) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', filterTable);
    }

    if (typeFilter) {
        typeFilter.addEventListener('change', filterTable);
    }
});
