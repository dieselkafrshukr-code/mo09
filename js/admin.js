// DOM Elements
const loginOverlay = document.getElementById('login-overlay');
const adminPanel = document.getElementById('admin-panel');
const loginForm = document.getElementById('login-form');

// State
let allProducts = [];
let allCategories = [];

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

// Stats Calculation
function updateStats() {
    document.getElementById('stats-total-products').innerText = allProducts.length;
    document.getElementById('stats-main-courses').innerText = allProducts.filter(p => p.category === 'وجبات رئيسية').length;
    document.getElementById('stats-drinks').innerText = allProducts.filter(p => p.category === 'مشروبات').length;
    document.getElementById('stats-desserts').innerText = allProducts.filter(p => p.category === 'حلويات').length;
}

// Categories Management
async function loadAdminCategories() {
    db.collection('categories').onSnapshot(snapshot => {
        allCategories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
                <td>
                    <button class="icon-btn delete" onclick="deleteCategory('${cat.id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
}

function updateCategorySelect() {
    const select = document.getElementById('p-category');
    select.innerHTML = '<option value="">اختر القسم</option>';
    const defaultCats = ['وجبات رئيسية', 'مقبلات', 'مشروبات', 'حلويات'];
    defaultCats.forEach(catName => {
        select.innerHTML += `<option value="${catName}">${catName}</option>`;
    });
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
        updateStats();
    });
}

function renderAdminProducts() {
    const list = document.getElementById('admin-products-list');
    list.innerHTML = '';
    allProducts.forEach(p => {
        list.innerHTML += `
            <tr>
                <td><img src="${p.image}" class="product-img-th"></td>
                <td>${p.name}</td>
                <td>${p.price} ج.م</td>
                <td>${p.category}</td>
                <td><span class="status-badge ${p.available ? 'status-delivered' : 'status-new'}">${p.available ? 'متوفر' : 'غير متوفر'}</span></td>
                <td>
                    <div class="action-btns">
                        <button class="icon-btn edit" onclick="openProductModal('${p.id}')"><i class="fas fa-edit"></i></button>
                        <button class="icon-btn delete" onclick="deleteProduct('${p.id}')"><i class="fas fa-trash"></i></button>
                    </div>
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
                        <select onchange="updateOrderStatus('${doc.id}', this.value)" style="background:#000; color:#fff; border:1px solid #333; padding:5px; border-radius:5px;">
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
    } else {
        form.reset();
        document.getElementById('p-id').value = '';
    }
    document.getElementById('p-image-file').value = "";
    document.getElementById('upload-status').innerText = "";
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
            statusText.innerText = "تم الرفع بنجاح!";
        }

        if (!imageUrl && !id) {
            alert("الرجاء اختيار صورة");
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
        closeModal('product-modal');
    } catch (error) {
        statusText.innerText = "خطأ: " + error.message;
    }
});

window.deleteProduct = async (id) => {
    if (confirm('هل أنت متأكد من حذف المنتج؟')) {
        await db.collection('products').doc(id).delete();
    }
};

window.deleteAllProducts = async () => {
    if (confirm('⚠️ خطر: هل أنت متأكد من حذف جميع المنتجات؟')) {
        const batch = db.batch();
        allProducts.forEach(p => {
            const ref = db.collection('products').doc(p.id);
            batch.delete(ref);
        });
        await batch.commit();
        alert('تم حذف جميع المنتجات بنجاح');
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
        closeModal('category-modal');
        document.getElementById('category-form').reset();
    } catch (error) {
        alert("خطأ: " + error.message);
    }
});

window.deleteCategory = async (id) => {
    if (confirm('هل أنت متأكد من حذف القسم؟')) {
        await db.collection('categories').doc(id).delete();
    }
};

window.updateOrderStatus = async (id, status) => {
    await db.collection('orders').doc(id).update({ status });
};
