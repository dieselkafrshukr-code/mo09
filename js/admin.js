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
if (loginForm) {
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
}

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

// Modal Logic
window.openProductModal = (id = null) => {
    const modal = document.getElementById('product-modal');
    const form = document.getElementById('product-form');
    const title = document.getElementById('modal-title');
    form.reset();
    document.getElementById('p-id').value = '';
    document.getElementById('upload-status').innerText = '';

    if (id) {
        title.innerText = 'تعديل المنتج';
        const p = allProducts.find(p => p.id === id);
        document.getElementById('p-id').value = p.id;
        document.getElementById('p-name').value = p.name;
        document.getElementById('p-category').value = p.category;
        document.getElementById('p-price').value = p.price;
        document.getElementById('p-desc').value = p.description || '';
        document.getElementById('p-available').checked = p.available !== false;
    } else {
        title.innerText = 'إضافة منتج جديد';
    }
    modal.style.display = 'flex';
    updateCategorySelect(); // Ensure select is fresh
};

window.openCategoryModal = () => {
    document.getElementById('category-modal').style.display = 'flex';
};

window.closeModal = (modalId) => {
    document.getElementById(modalId).style.display = 'none';
};

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
    if (!list) return;
    list.innerHTML = '';
    allCategories.forEach(cat => {
        list.innerHTML += `
            <tr>
                <td>${cat.name}</td>
                <td class="action-btns">
                    <button class="icon-btn delete" onclick="deleteCategory('${cat.id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
}

function updateCategorySelect() {
    const select = document.getElementById('p-category');
    if (!select) return;
    const currentVal = select.value;
    select.innerHTML = '<option value="">اختر القسم</option>';

    // Default categories that should always be there
    const defaultCats = ['وجبات رئيسية', 'مقبلات', 'مشروبات', 'حلويات'];
    defaultCats.forEach(name => {
        select.innerHTML += `<option value="${name}">${name}</option>`;
    });

    // Custom categories from DB
    allCategories.forEach(cat => {
        if (!defaultCats.includes(cat.name)) {
            select.innerHTML += `<option value="${cat.name}">${cat.name}</option>`;
        }
    });

    if (currentVal) select.value = currentVal;
}

document.getElementById('category-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('cat-name').value;
    try {
        await db.collection('categories').add({ name });
        closeModal('category-modal');
        e.target.reset();
    } catch (error) {
        alert("خطأ في إضافة القسم: " + error.message);
    }
});

window.deleteCategory = async (id) => {
    if (confirm('هل أنت متأكد من حذف هذا القسم؟')) {
        await db.collection('categories').doc(id).delete();
    }
};

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
    if (!list) return;
    list.innerHTML = '';
    allProducts.forEach(p => {
        list.innerHTML += `
            <tr>
                <td><img src="${p.image}" class="product-img-th"></td>
                <td>${p.name}</td>
                <td>${p.price} ج.م</td>
                <td>${p.category}</td>
                <td><span class="status-badge ${p.available !== false ? 'status-delivered' : 'status-preparing'}">${p.available !== false ? 'متوفر' : 'غير متوفر'}</span></td>
                <td class="action-btns">
                    <button class="icon-btn edit" onclick="openProductModal('${p.id}')"><i class="fas fa-edit"></i></button>
                    <button class="icon-btn delete" onclick="deleteProduct('${p.id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
}

// Helper to Compress Image and return Base64
async function compressImageToBase64(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 600; // Smaller width for Base64 storage
                let width = img.width;
                let height = img.height;

                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.6)); // 60% quality Base64
            };
        };
    });
}

document.getElementById('product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('p-id').value;
    const name = document.getElementById('p-name').value;
    const category = document.getElementById('p-category').value;
    const price = document.getElementById('p-price').value;
    const desc = document.getElementById('p-desc').value;
    const available = document.getElementById('p-available').checked;
    const fileInput = document.getElementById('p-image-file');
    const manualUrl = document.getElementById('p-image-url').value;
    const statusText = document.getElementById('upload-status');

    let imageUrl = manualUrl; // استخدم الرابط اليدوي كخيار أول أو ثانوي

    if (id && !fileInput.files[0] && !manualUrl) {
        const existing = allProducts.find(p => p.id === id);
        imageUrl = existing.image;
    }

    try {
        if (fileInput.files[0]) {
            statusText.innerText = "جاري معالجة الصورة...";
            const file = fileInput.files[0];

            // تحويل الصورة لنص (Base64) بجودة ممتازة وحجم صغير
            imageUrl = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = (e) => {
                    const img = new Image();
                    img.src = e.target.result;
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const MAX_WIDTH = 600; // حجم مثالي للموبايل والويب
                        let width = img.width;
                        let height = img.height;
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);
                        resolve(canvas.toDataURL('image/jpeg', 0.6)); // ضغط 60% لسرعة التحميل
                    };
                };
            });
            statusText.innerText = "تمت المعالجة!";
        }

        if (!imageUrl && !id) {
            alert("يرجى اختيار صورة للمنتج الجديد");
            return;
        }

        const productData = {
            name,
            category,
            price: parseFloat(price),
            description: desc,
            available: available,
            image: imageUrl,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (id) {
            await db.collection('products').doc(id).update(productData);
        } else {
            productData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('products').add(productData);
        }

        closeModal('product-modal');
    } catch (error) {
        alert("خطأ في حفظ المنتج: " + error.message);
    }
});

window.deleteProduct = async (id) => {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
        await db.collection('products').doc(id).delete();
    }
};

window.deleteAllProducts = async () => {
    if (confirm('⚠️ خطر: هل أنت متأكد من حذف جميع المنتجات نهائياً؟')) {
        const batch = db.batch();
        allProducts.forEach(p => {
            batch.delete(db.collection('products').doc(p.id));
        });
        await batch.commit();
        alert('تم حذف جميع المنتجات بنجاح');
    }
};

// Orders Management
async function loadAdminOrders() {
    db.collection('orders').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
        const list = document.getElementById('admin-orders-list');
        if (!list) return;
        list.innerHTML = '';
        snapshot.docs.forEach(doc => {
            const order = doc.data();
            list.innerHTML += `
                <tr>
                    <td>#${doc.id.slice(-5)}</td>
                    <td>${order.customerName}</td>
                    <td>${order.total} ج.م</td>
                    <td>${new Date(order.createdAt?.toDate()).toLocaleString('ar-EG')}</td>
                    <td><span class="status-badge status-${order.status}">${order.status === 'delivered' ? 'تم التوصيل' : order.status === 'preparing' ? 'جاري التحضير' : 'طلب جديد'}</span></td>
                    <td>
                        <select onchange="updateOrderStatus('${doc.id}', this.value)" class="icon-btn" style="background:#111; color:#fff; border:1px solid #333; padding:5px; border-radius:5px;">
                            <option value="new" ${order.status === 'new' ? 'selected' : ''}>جديد</option>
                            <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>تحضير</option>
                            <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>توصيل</option>
                        </select>
                    </td>
                </tr>
            `;
        });
    });
}

window.updateOrderStatus = async (id, status) => {
    await db.collection('orders').doc(id).update({ status });
};

// Stats
function updateStats() {
    document.getElementById('stats-total-products').innerText = allProducts.length;
    document.getElementById('stats-main-courses').innerText = allProducts.filter(p => p.category === 'وجبات رئيسية').length;
    document.getElementById('stats-drinks').innerText = allProducts.filter(p => p.category === 'مشروبات').length;
    document.getElementById('stats-desserts').innerText = allProducts.filter(p => p.category === 'حلويات').length;
}
