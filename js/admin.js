// DOM Elements
const loginOverlay = document.getElementById('login-overlay');
const adminPanel = document.getElementById('admin-panel');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');

// State
let allProducts = [];
let allCategories = [];
let currentCategoryFilter = 'all';

// Auth State Observer
auth.onAuthStateChanged(user => {
    if (user) {
        loginOverlay.style.display = 'none';
        adminPanel.style.display = 'flex';
        initDashboard();
    } else {
        loginOverlay.style.display = 'flex';
        adminPanel.style.display = 'none';
    }
});

// Login Handler
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
        alert("خطأ في تسجيل الدخول: " + error.message);
    }
});

// Logout Handler
logoutBtn.addEventListener('click', () => {
    auth.signOut();
});

// Dashboard Init
async function initDashboard() {
    loadAdminCategories();
    loadAdminProducts();
    loadAdminOrders();
}

// Tab Switching
window.showTab = (tabName) => {
    document.querySelectorAll('.main-content section').forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById(`tab-${tabName}`).style.display = 'block';

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
};

// Categories Management
async function loadAdminCategories() {
    db.collection('categories').onSnapshot(snapshot => {
        if (snapshot.empty) {
            allCategories = [{ id: 'default', name: 'عام' }];
        } else {
            allCategories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
        renderAdminCategories();
        updateCategorySelect();
    });
}

function renderAdminCategories() {
    const list = document.getElementById('admin-categories-list');
    list.innerHTML = '';
    allCategories.forEach(cat => {
        list.innerHTML += `
            <tr>
                <td>${cat.name}</td>
                <td>-</td>
                <td>
                    <button class="icon-btn" onclick="deleteCategory('${cat.id}')" style="color:#e63946"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
}

function updateCategorySelect() {
    const select = document.getElementById('p-category');
    select.innerHTML = '<option value="">اختر القسم</option>';

    // الأقسام الأساسية للمطعم - ثابتة دائماً لسهولة الاستخدام
    const defaultCats = ['وجبات رئيسية', 'مقبلات', 'مشروبات', 'حلويات'];

    defaultCats.forEach(catName => {
        select.innerHTML += `<option value="${catName}">${catName}</option>`;
    });

    // إضافة أي أقسام إضافية قام المستخدم بإنشائها
    allCategories.forEach(cat => {
        if (!defaultCats.includes(cat.name)) {
            select.innerHTML += `<option value="${cat.name}">${cat.name}</option>`;
        }
    });
}

// Products Management
async function loadAdminProducts() {
    db.collection('products').onSnapshot(snapshot => {
        allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderAdminProducts();
    });
}

function renderAdminProducts() {
    const list = document.getElementById('admin-products-list');
    list.innerHTML = '';
    allProducts.forEach(p => {
        list.innerHTML += `
            <tr>
                <td><img src="${p.image}" style="width:50px; height:50px; border-radius:5px; object-fit:cover;"></td>
                <td>${p.name}</td>
                <td>${p.category}</td>
                <td>${p.price} ج.م</td>
                <td><span class="status-badge ${p.available ? 'status-delivered' : 'status-new'}">${p.available ? 'متوفر' : 'غير متوفر'}</span></td>
                <td>
                    <button class="icon-btn" onclick="openProductModal('${p.id}')" style="color:#2ecc71"><i class="fas fa-edit"></i></button>
                    <button class="icon-btn" onclick="deleteProduct('${p.id}')" style="color:#e63946"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
}

// Orders Management
async function loadAdminOrders() {
    db.collection('orders').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
        const list = document.getElementById('admin-orders-list');
        list.innerHTML = '';
        snapshot.docs.forEach(doc => {
            const order = doc.data();
            const date = order.createdAt ? order.createdAt.toDate().toLocaleString('ar-EG') : 'قيد الانتظار';
            list.innerHTML += `
                <tr>
                    <td>#${doc.id.substring(0, 6)}</td>
                    <td>${order.customer_name}</td>
                    <td>${order.total_price} ج.م</td>
                    <td>${date}</td>
                    <td><span class="status-badge ${getStatusClass(order.status)}">${order.status}</span></td>
                    <td>
                        <select onchange="updateOrderStatus('${doc.id}', this.value)" style="padding:5px; border-radius:5px;">
                            <option value="جديد" ${order.status === 'جديد' ? 'selected' : ''}>جديد</option>
                            <option value="جاري التحضير" ${order.status === 'جاري التحضير' ? 'selected' : ''}>جاري التحضير</option>
                            <option value="تم التسليم" ${order.status === 'تم التسليم' ? 'selected' : ''}>تم التسليم</option>
                        </select>
                    </td>
                </tr>
            `;
        });
    });
}

function getStatusClass(status) {
    if (status === 'جديد') return 'status-new';
    if (status === 'جاري التحضير') return 'status-preparing';
    return 'status-delivered';
}

// Actions
window.openProductModal = (id = null) => {
    const modal = document.getElementById('product-modal');
    const form = document.getElementById('product-form');
    document.getElementById('modal-title').innerText = id ? 'تعديل منتج' : 'إضافة منتج جديد';

    if (id) {
        const p = allProducts.find(x => x.id === id);
        document.getElementById('p-id').value = p.id;
        document.getElementById('p-name').value = p.name;
        document.getElementById('p-category').value = p.category;
        document.getElementById('p-price').value = p.price;
        document.getElementById('p-desc').value = p.desc;
        document.getElementById('p-available').checked = p.available;
        document.getElementById('upload-status').innerText = "توجد صورة بالفعل (اتركها كما هي للحفاظ عليها)";
    } else {
        form.reset();
        document.getElementById('p-id').value = '';
        document.getElementById('upload-status').innerText = "";
    }
    document.getElementById('p-image-file').value = "";

    modal.style.display = 'flex';
};

window.closeModal = (modalId) => {
    document.getElementById(modalId).style.display = 'none';
};

document.getElementById('product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('p-id').value;
    const fileInput = document.getElementById('p-image-file');
    const statusText = document.getElementById('upload-status');
    let imageUrl = "";

    // If editing, keep old image unless a new one is selected
    if (id) {
        const existingProduct = allProducts.find(p => p.id === id);
        imageUrl = existingProduct.image;
    }

    try {
        if (fileInput.files[0]) {
            statusText.innerText = "جاري رفع الصورة...";
            const file = fileInput.files[0];
            const storageRef = storage.ref(`products/${Date.now()}_${file.name}`);
            const snapshot = await storageRef.put(file);
            imageUrl = await snapshot.ref.getDownloadURL();
            statusText.innerText = "تم رفع الصورة بنجاح!";
        }

        if (!imageUrl && !id) {
            alert("الرجاء اختيار صورة للمنتج");
            return;
        }

        const data = {
            name: document.getElementById('p-name').value,
            category: document.getElementById('p-category').value,
            price: parseFloat(document.getElementById('p-price').value),
            image: imageUrl,
            desc: document.getElementById('p-desc').value,
            available: document.getElementById('p-available').checked,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (id) {
            await db.collection('products').doc(id).update(data);
        } else {
            await db.collection('products').add({ ...data, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
        }

        statusText.innerText = "";
        fileInput.value = "";
        closeModal('product-modal');
    } catch (error) {
        console.error(error);
        alert("خطأ أثناء الحفظ: " + error.message);
        statusText.innerText = "فشل الرفع";
    }
});

window.deleteProduct = async (id) => {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
        await db.collection('products').doc(id).delete();
    }
};

window.openCategoryModal = () => {
    document.getElementById('category-modal').style.display = 'flex';
};

document.getElementById('category-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('cat-name').value;
    try {
        await db.collection('categories').add({ name });
        document.getElementById('category-form').reset();
        closeModal('category-modal');
    } catch (error) {
        alert("خطأ: " + error.message);
    }
});

window.deleteCategory = async (id) => {
    if (confirm('هل أنت متأكد من حذف هذا القسم؟')) {
        await db.collection('categories').doc(id).delete();
    }
};

window.updateOrderStatus = async (id, status) => {
    await db.collection('orders').doc(id).update({ status });
};
