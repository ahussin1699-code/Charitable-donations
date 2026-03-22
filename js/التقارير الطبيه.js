const sb = createSupabaseClient();
const ADMIN_EMAIL = 'ahussin9125@gmail.com';
let currentUserRole = 'doctor'; 
let currentUserId = null;

async function loadReportsUserProfile() {
    if (!sb) return;
    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
        window.location.href = "تسجيل الدخول .html";
        return;
    }

    currentUserId = user.id;
    const meta = user.user_metadata || {};
    const emailIsAdmin = user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    let tableSupervisor = false;
    try {
        const { data: supRow } = await sb
            .from('supervisors')
            .select('id')
            .eq('email', user.email)
            .maybeSingle();
        tableSupervisor = !!supRow;
    } catch (_) {}
    const metaIsAdmin = meta.is_admin === true || meta.role === 'admin' || meta.user_type === 'مشرف' || meta.user_type === 'supervisor';
    currentUserRole = (tableSupervisor || metaIsAdmin || emailIsAdmin) ? 'supervisor' : 'doctor';

    const { data: userData } = await sb
        .from('users')
        .select('name, profile_image')
        .eq('email', user.email)
        .maybeSingle();

    const fullName = userData?.name || user.user_metadata?.full_name || user.email || "";
    const nameEl = document.getElementById('adminName');
    if (nameEl) nameEl.textContent = fullName + (currentUserRole === 'supervisor' ? ' (المشرف)' : ' (الطبيب)');

    const savedImage = userData?.profile_image || localStorage.getItem(`profileImage_${user.id}`);
    const imgEl = document.getElementById('adminProfileImg');
    if (imgEl && savedImage) imgEl.src = savedImage;
    if (imgEl) {
        imgEl.style.cursor = 'pointer';
        imgEl.addEventListener('click', function () {
            window.location.href = "الصفحه الشخصية.html";
        });
    }

    // التحقق من نوع المستخدم لإخفاء الشريط الجانبي إذا كان طبيباً
    if (currentUserRole === 'doctor') {
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

    // تعيين كلاس على البودي حسب الدور
    if (document && document.body) {
        document.body.classList.remove('is-supervisor', 'is-doctor');
        if (currentUserRole === 'supervisor') {
            document.body.classList.add('is-supervisor');
        } else {
            document.body.classList.add('is-doctor');
        }
    }

    // تحميل الرسائل القديمة
    await fetchMessages();
    // تفعيل الاستماع للرسائل الجديدة (Realtime)
    subscribeToMessages();
}

async function fetchMessages() {
    console.log('Fetching messages...');
    const { data, error } = await sb
        .from('medical_messages')
        .select('*')
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching messages:', error);
        return;
    }

    console.log('Messages fetched:', data);
    const container = document.getElementById('chatMessages');
    if (container) {
        container.innerHTML = '';
        if (data && data.length > 0) {
            data.forEach(msg => {
                appendChatMessage(msg.text, msg.sender_role, msg.attachment_url, msg.attachment_name, msg.created_at);
            });
        } else {
            container.innerHTML = '<div style="text-align:center; color:#999; margin-top:20px;">لا توجد رسائل سابقة</div>';
        }
    }
}

function subscribeToMessages() {
    sb.channel('medical_chat')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'medical_messages' }, payload => {
            const msg = payload.new;
            appendChatMessage(msg.text, msg.sender_role, msg.attachment_url, msg.attachment_name, msg.created_at);
        })
        .subscribe();
}

function appendChatMessage(text, senderRole, attachmentUrl, attachmentName, timestamp) {
    const container = document.getElementById('chatMessages');
    if (!container) return;

    const wrapper = document.createElement('div');
    wrapper.classList.add('chat-message');
    
    // تحديد شكل الرسالة بناءً على دور المستخدم الحالي والراسل
    if (senderRole === currentUserRole) {
        wrapper.classList.add('chat-message-doctor'); // رسائلي
    } else {
        wrapper.classList.add('chat-message-supervisor'); // رسائل الطرف الآخر
    }

    if (text) {
        const textEl = document.createElement('div');
        textEl.textContent = text;
        wrapper.appendChild(textEl);
    }

    if (attachmentUrl) {
        const attachEl = document.createElement('div');
        attachEl.classList.add('chat-attachment');
        
        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(attachmentUrl) || (attachmentName && /\.(jpg|jpeg|png|gif|webp)$/i.test(attachmentName));
        
        if (isImage) {
            const img = document.createElement('img');
            img.src = attachmentUrl;
            img.alt = attachmentName || 'صورة';
            img.style.cursor = 'pointer';
            img.onclick = () => window.open(attachmentUrl, '_blank');
            attachEl.appendChild(img);
        } else {
            const link = document.createElement('a');
            link.href = attachmentUrl;
            link.target = "_blank";
            link.innerHTML = `<i class="fas fa-file-download"></i> ${attachmentName || 'تحميل الملف'}`;
            attachEl.appendChild(link);
        }
        wrapper.appendChild(attachEl);
    }

    const meta = document.createElement('div');
    meta.classList.add('chat-meta');
    const date = timestamp ? new Date(timestamp) : new Date();
    const timeString = date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    const senderName = (senderRole === 'doctor' ? 'الطبيب' : 'المشرف');
    meta.textContent = `${senderName} • ${timeString}`;
    wrapper.appendChild(meta);

    container.appendChild(wrapper);
    container.scrollTop = container.scrollHeight;
}

const reportAvatarInput = document.getElementById('reportAvatarInput');
const reportAvatarPreview = document.getElementById('reportAvatarPreview');
if (reportAvatarInput && reportAvatarPreview) {
    reportAvatarInput.addEventListener('change', function () {
        const file = this.files && this.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (e) {
            reportAvatarPreview.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

async function logout() {
    if (sb) await sb.auth.signOut();
    window.location.href = "تسجيل الدخول .html";
}

const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const fileInput = document.getElementById('fileInput');
const sendBtn = document.getElementById('sendBtn');
const filePreview = document.getElementById('filePreview');

const logoutBtnSidebar = document.getElementById("sidebarLogoutBtn");
if (logoutBtnSidebar) {
    logoutBtnSidebar.addEventListener("click", async (e) => {
        e.preventDefault();
        await logout();
    });
}

if (fileInput && filePreview) {
    fileInput.addEventListener('change', function() {
        const file = this.files && this.files[0];
        filePreview.textContent = file ? "سيتم إرفاق: " + file.name : "";
    });
}

if (chatForm) {
    chatForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const text = chatInput.value.trim();
        const file = fileInput.files[0];

        if (!text && !file) return;

        sendBtn.disabled = true;
        let attachmentUrl = null;
        let attachmentName = null;

        try {
            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}.${fileExt}`;
                const filePath = `medical_reports/${fileName}`;

                const { error: uploadError } = await sb.storage
                    .from('cases') // نستخدم نفس الباكت المتاح أو نتأكد من وجود باكت مناسب
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: urlData } = sb.storage.from('cases').getPublicUrl(filePath);
                attachmentUrl = urlData.publicUrl;
                attachmentName = file.name;
            }

            const { error } = await sb.from('medical_messages').insert([{
                text: text,
                sender_id: currentUserId,
                sender_role: currentUserRole,
                attachment_url: attachmentUrl,
                attachment_name: attachmentName
            }]);

            if (error) throw error;

            chatInput.value = '';
            fileInput.value = '';
            filePreview.textContent = '';
        } catch (err) {
            console.error('Error sending message:', err);
            alert('حدث خطأ أثناء إرسال الرسالة');
        } finally {
            sendBtn.disabled = false;
        }
    });
}

window.addEventListener('load', loadReportsUserProfile);
