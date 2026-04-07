const sb = createSupabaseClient();

let notificationModalBackdrop;

document.addEventListener('DOMContentLoaded', async function() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }

    await loadAdminHeaderInfo();
});

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

function showNotificationModal(title, message, timeText) {
    if (!notificationModalBackdrop) {
        notificationModalBackdrop = document.createElement('div');
        notificationModalBackdrop.className = 'notification-modal-backdrop';
        notificationModalBackdrop.innerHTML = `
            <div class="notification-modal">
                <div class="notification-modal-header">
                    <h3 class="notification-modal-title"></h3>
                    <button class="notification-modal-close">&times;</button>
                </div>
                <div class="notification-modal-body"></div>
                <div class="notification-modal-time"></div>
            </div>
        `;
        document.body.appendChild(notificationModalBackdrop);

        notificationModalBackdrop.addEventListener('click', function(e) {
            if (e.target === notificationModalBackdrop || e.target.classList.contains('notification-modal-close')) {
                notificationModalBackdrop.classList.remove('show');
            }
        });
    }

    const titleEl = notificationModalBackdrop.querySelector('.notification-modal-title');
    const bodyEl = notificationModalBackdrop.querySelector('.notification-modal-body');
    const timeEl = notificationModalBackdrop.querySelector('.notification-modal-time');

    if (titleEl) titleEl.textContent = title || 'تفاصيل الإشعار';
    if (bodyEl) bodyEl.textContent = message || '';
    if (timeEl) timeEl.textContent = timeText || '';

    notificationModalBackdrop.classList.add('show');
}

async function loadNotifications() {
    if (!sb) return;
    const list = document.querySelector('.notifications-list');
    const emptyState = document.getElementById('emptyState');
    if (!list || !emptyState) return;

    const { data, error } = await sb
        .from('notifications')
        .select('id, title, message, type, is_read, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('خطأ في جلب الإشعارات:', error);
        list.innerHTML = `
            <div class="notification-item">
                <div class="notification-content">
                    <div class="notification-title">خطأ في تحميل الإشعارات</div>
                    <div class="notification-message">${error.message || ''}</div>
                </div>
            </div>
        `;
        emptyState.style.display = 'none';
        return;
    }

    if (!data || data.length === 0) {
        list.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    const formatDateTime = (iso) => {
        try {
            const d = new Date(iso);
            return d.toLocaleString('ar-EG');
        } catch {
            return '';
        }
    };

    const getTypeInfo = (type) => {
        if (type === 'donation' || type === 'success') {
            return { cls: 'success', icon: 'fa-hand-holding-heart' };
        }
        if (type === 'user' || type === 'info') {
            return { cls: 'info', icon: 'fa-user-plus' };
        }
        if (type === 'warning') {
            return { cls: 'warning', icon: 'fa-exclamation-triangle' };
        }
        if (type === 'system' || type === 'error') {
            return { cls: 'danger', icon: 'fa-times-circle' };
        }
        return { cls: 'info', icon: 'fa-bell' };
    };

    list.innerHTML = data.map(row => {
        const unreadClass = row.is_read ? '' : ' unread';
        const badge = row.is_read ? '' : '<div class="notification-badge"></div>';
        const typeInfo = getTypeInfo(row.type);
        const timeText = row.created_at ? formatDateTime(row.created_at) : '';
        const markReadButton = row.is_read ? '' : `
            <button class="notification-action mark-read">
                <i class="fas fa-check"></i> تعيين كمقروء
            </button>
        `;

        return `
            <div class="notification-item${unreadClass}" data-id="${row.id}">
                ${badge}
                <div class="notification-icon ${typeInfo.cls}">
                    <i class="fas ${typeInfo.icon}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${row.title || ''}</div>
                    <div class="notification-message">
                        ${row.message || ''}
                    </div>
                    <div class="notification-time">
                        <i class="far fa-clock"></i> ${timeText}
                    </div>
                    <div class="notification-actions">
                        ${markReadButton}
                        <button class="notification-action view">
                            <i class="fas fa-eye"></i> عرض التفاصيل
                        </button>
                        <button class="notification-action delete">
                            <i class="fas fa-trash"></i> حذف
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    emptyState.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', async function() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }
    
    await loadNotifications();
    
    const markReadButtons = document.querySelectorAll('.mark-read');
    markReadButtons.forEach(button => {
        button.addEventListener('click', function() {
            const notificationItem = this.closest('.notification-item');
            notificationItem.classList.remove('unread');
            const badge = notificationItem.querySelector('.notification-badge');
            if (badge) {
                badge.remove();
            }
            this.remove();
            updateNotificationCount();
        });
    });
    
    const deleteButtons = document.querySelectorAll('.notification-action.delete');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const notificationItem = this.closest('.notification-item');
            notificationItem.style.opacity = '0';
            setTimeout(() => {
                notificationItem.remove();
                checkEmptyState();
                updateNotificationCount();
            }, 300);
        });
    });
    
    const markAllReadButton = document.getElementById('markAllRead');
    if (markAllReadButton) {
        markAllReadButton.addEventListener('click', function() {
            const unreadNotifications = document.querySelectorAll('.notification-item.unread');
            unreadNotifications.forEach(notification => {
                notification.classList.remove('unread');
                const badge = notification.querySelector('.notification-badge');
                if (badge) {
                    badge.remove();
                }
                const markReadBtn = notification.querySelector('.mark-read');
                if (markReadBtn) {
                    markReadBtn.remove();
                }
            });
            
            updateNotificationCount();
        });
    }
    
    const deleteAllButton = document.getElementById('deleteAll');
    if (deleteAllButton) {
        deleteAllButton.addEventListener('click', function() {
            if (confirm('هل أنت متأكد من أنك تريد حذف جميع الإشعارات؟')) {
                const notifications = document.querySelectorAll('.notification-item');
                notifications.forEach(notification => {
                    notification.style.opacity = '0';
                    setTimeout(() => {
                        notification.remove();
                    }, 300);
                });
                
                setTimeout(() => {
                    checkEmptyState();
                    updateNotificationCount();
                }, 500);
            }
        });
    }
    
    const filterButton = document.getElementById('filterNotifications');
    if (filterButton) {
        filterButton.addEventListener('click', function() {
            alert('سيتم فتح نافذة تصفية الإشعارات');
        });
    }

    const viewButtons = document.querySelectorAll('.notification-action.view');
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const notificationItem = this.closest('.notification-item');
            if (!notificationItem) return;
            const titleEl = notificationItem.querySelector('.notification-title');
            const messageEl = notificationItem.querySelector('.notification-message');
            const timeEl = notificationItem.querySelector('.notification-time');
            const title = titleEl ? titleEl.textContent.trim() : '';
            const message = messageEl ? messageEl.textContent.trim() : '';
            const timeText = timeEl ? timeEl.textContent.trim() : '';
            showNotificationModal(title, message, timeText);
        });
    });
    
    function checkEmptyState() {
        const notificationsList = document.querySelector('.notifications-list');
        const emptyState = document.getElementById('emptyState');
        
        if (notificationsList && emptyState) {
            if (notificationsList.children.length === 0) {
                emptyState.style.display = 'block';
            } else {
                emptyState.style.display = 'none';
            }
        }
    }
    
    function updateNotificationCount() {
        const unreadCount = document.querySelectorAll('.notification-item.unread').length;
        const allCountElement = document.querySelector('.notifications-nav a.active .notification-count');
        
        if (allCountElement) {
            allCountElement.textContent = unreadCount;
        }
        
        const sidebarNotificationCount = document.querySelector('.sidebar-nav a.active .notification-count');
        if (!sidebarNotificationCount) {
            const activeNavItem = document.querySelector('.sidebar-nav a.active');
            if (activeNavItem) {
                const countElement = document.createElement('span');
                countElement.className = 'notification-count';
                countElement.textContent = unreadCount;
                activeNavItem.appendChild(countElement);
            }
        } else {
            sidebarNotificationCount.textContent = unreadCount;
        }
    }
    
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href') !== '#' && this.getAttribute('href') !== '') {
                return;
            }
            e.preventDefault();
        });
    });

    const logoutBtnSidebar = document.getElementById("sidebarLogoutBtn");
    if (logoutBtnSidebar) {
        logoutBtnSidebar.addEventListener("click", async (e) => {
            e.preventDefault();
            if (sb) {
                await sb.auth.signOut();
                window.location.href = "تسجيل الدخول .html";
            }
        });
    }
});
