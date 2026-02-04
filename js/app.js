// DOM Elements
const productsContainer = document.getElementById('products-container');
const categoryFilters = document.getElementById('category-filters');
const cartBtn = document.getElementById('cart-btn');
const cartModal = document.getElementById('cart-modal');
const closeCart = document.getElementById('close-cart');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartTotalAmount = document.getElementById('cart-total-amount');
const cartCount = document.querySelector('.cart-count');
const checkoutBtn = document.getElementById('checkout-whatsapp');
const userBtn = document.getElementById('user-btn');

// State
let products = [];
let categories = [];
let cart = [];

// Safe Cart Loading
try {
    const savedCart = localStorage.getItem('restaurant_cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        if (!Array.isArray(cart)) cart = [];
    }
} catch (error) {
    console.error("Error parsing cart:", error);
    cart = [];
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (typeof loadCategories === 'function') loadCategories();
    if (typeof loadProducts === 'function') loadProducts();
    if (typeof updateCartUI === 'function') updateCartUI();
});

// Event Listeners - Safe Pattern
if (cartBtn && cartModal) {
    cartBtn.addEventListener('click', () => cartModal.style.display = 'flex');
}
if (closeCart && cartModal) {
    closeCart.addEventListener('click', () => cartModal.style.display = 'none');
}
window.addEventListener('click', (e) => {
    if (cartModal && e.target === cartModal) cartModal.style.display = 'none';
});

if (userBtn) {
    userBtn.addEventListener('click', () => {
        window.location.href = 'admin.html';
    });
}

// Load Categories
async function loadCategories() {
    try {
        const snapshot = await db.collection('categories').get();
        categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderCategories();
    } catch (error) {
        console.error("Error loading categories:", error);
        categories = [];
        renderCategories();
    }
}

function renderCategories() {
    categoryFilters.innerHTML = `<button class="category-btn active" data-filter="all">الكل</button>`;
    categories.forEach(cat => {
        categoryFilters.innerHTML += `<button class="category-btn" data-filter="${cat.name}">${cat.name}</button>`;
    });

    // Add filter logic
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.getAttribute('data-filter');
            filterProducts(filter);
        });
    });
}

// Load Products
async function loadProducts() {
    try {
        const snapshot = await db.collection('products').where('available', '==', true).get();
        products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderProducts(products);
    } catch (error) {
        console.error("Error loading products:", error);
        products = [];
        renderProducts(products);
    }
}

let currentProductInModal = null;
let selectedSize = 'صغير';

// Logic for Product Details
window.openProductDetail = (productId) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    currentProductInModal = product;
    selectedSize = 'صغير'; // Reset to default

    document.getElementById('modal-p-name').innerText = product.name;
    document.getElementById('modal-p-desc').innerText = product.desc || 'وصف لذيذ لهذا المنتج الرائع من مطعمنا.';
    document.getElementById('modal-p-price').innerText = `${product.price} ج.م`;
    document.getElementById('modal-p-image').src = product.image;

    // Dynamic Sizes Handling
    const sizeContainer = document.getElementById('size-selection');
    const sizeOptions = sizeContainer.querySelector('.size-options');

    if (product.sizes && product.sizes.length > 0) {
        sizeContainer.style.display = 'block';
        selectedSize = product.sizes[0];
        sizeOptions.innerHTML = '';
        product.sizes.forEach((size, index) => {
            const btn = document.createElement('button');
            btn.className = `size-btn ${index === 0 ? 'active' : ''}`;
            btn.innerText = size;
            btn.onclick = (e) => selectSize(size, e.target);
            sizeOptions.appendChild(btn);
        });
    } else {
        sizeContainer.style.display = 'none';
        selectedSize = ''; // No specific size
    }

    document.getElementById('product-modal').style.display = 'flex';
};

window.closeProductModal = () => {
    document.getElementById('product-modal').style.display = 'none';
};

window.selectSize = (size, btn) => {
    selectedSize = size;
    document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
};

function renderProducts(productsToRender) {
    productsContainer.innerHTML = '';
    productsToRender.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-img" onclick="openProductDetail('${product.id}')">
                <img src="${product.image}" alt="${product.name}" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop'">
                <div class="product-overlay">
                    <span>عرض التفاصيل <i class="fas fa-search-plus"></i></span>
                </div>
            </div>
            <div class="product-info">
                <div class="product-category">${product.category}</div>
                <h3>${product.name}</h3>
                <p>${product.price} <span>ج.م</span></p>
                <button class="add-btn" onclick="openProductDetail('${product.id}')">
                    اطلب الآن <i class="fas fa-shopping-basket"></i>
                </button>
            </div>
        `;
        productsContainer.appendChild(card);
    });
}

function filterProducts(category) {
    if (category === 'all') {
        renderProducts(products);
    } else {
        const filtered = products.filter(p => p.category === category);
        renderProducts(filtered);
    }
}

window.addToCartFromModal = (event) => {
    if (currentProductInModal) {
        addToCart(currentProductInModal.id, selectedSize, event);
        setTimeout(() => {
            closeProductModal();
            alert('تم إضافة المنتج للسلة بنجاح! يمكنك متابعة طلبك من أعلى الصفحة.');
        }, 500);
    }
};

// Fixed Cart Logic to handle Size and Feedback
window.addToCart = (productId, size = 'صغير', event = null) => {
    const product = products.find(p => p.id === productId);
    const cartItem = cart.find(item => item.id === productId && item.size === size);

    if (cartItem) {
        cartItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1, size: size });
    }

    saveCart();
    updateCartUI();

    // Simple feedback helper
    if (event && event.target) {
        const btn = event.target.closest('button');
        if (btn) {
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i> تمت الإضافة';
            btn.style.background = '#27ae60';
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.background = '';
            }, 2000);
        }
    }
};

function saveCart() {
    localStorage.setItem('restaurant_cart', JSON.stringify(cart));
}

function updateCartUI() {
    if (cartCount) cartCount.innerText = cart.reduce((total, item) => total + item.quantity, 0);
    if (!cartItemsContainer) return;

    cartItemsContainer.innerHTML = '';

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="text-align: center; margin-top: 2rem;">السلة فارغة</p>';
        if (cartTotalAmount) cartTotalAmount.innerText = '0 ج.م';
        return;
    }

    let total = 0;
    cart.forEach(item => {
        total += item.price * item.quantity;
        cartItemsContainer.innerHTML += `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>${item.price} ج.م × ${item.quantity} (${item.size})</p>
                </div>
                <div class="cart-item-actions" style="display:flex; align-items:center; gap:0.5rem">
                    <button class="icon-btn" style="color:black" onclick="changeQuantity('${item.id}', '${item.size}', -1)"><i class="fas fa-minus-circle"></i></button>
                    <span>${item.quantity}</span>
                    <button class="icon-btn" style="color:black" onclick="changeQuantity('${item.id}', '${item.size}', 1)"><i class="fas fa-plus-circle"></i></button>
                    <button class="icon-btn" style="color:#e63946" onclick="removeFromCart('${item.id}', '${item.size}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    });

    if (cartTotalAmount) cartTotalAmount.innerText = `${total} ج.م`;
}

window.changeQuantity = (productId, size, delta) => {
    const item = cart.find(i => i.id === productId && i.size === size);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            removeFromCart(productId, size);
        } else {
            saveCart();
            updateCartUI();
        }
    }
};

window.removeFromCart = (productId, size) => {
    cart = cart.filter(i => !(i.id === productId && i.size === size));
    saveCart();
    updateCartUI();
};

// WhatsApp Order
if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) return alert('السلة فارغة!');

        let message = "مرحباً، أود طلب الآتي:\n\n";
        let total = 0;

        cart.forEach(item => {
            message += `• ${item.name} [${item.size}] (${item.quantity} × ${item.price} ج.م) = ${item.quantity * item.price} ج.م\n`;
            total += item.quantity * item.price;
        });

        message += `\n*الإجمالي: ${total} ج.م*`;
        message += `\n\nشكراً لكم!`;

        const phoneNumber = "201012345678"; // REPLACE WITH ACTUAL PHONE
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

        // Track order in DB (Optional/Extra)
        saveOrderToDB(total);

        window.open(whatsappUrl, '_blank');
    });
}

async function saveOrderToDB(total) {
    try {
        await db.collection('orders').add({
            customer_name: "عميل واتساب",
            items: cart,
            total_price: total,
            status: "جديد",
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        // Clear cart after order
        cart = [];
        saveCart();
        updateCartUI();
    } catch (error) {
        console.error("Error saving order:", error);
    }
}
