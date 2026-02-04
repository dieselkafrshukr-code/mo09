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
let cart = JSON.parse(localStorage.getItem('restaurant_cart')) || [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadProducts();
    updateCartUI();
});

// Event Listeners
cartBtn.addEventListener('click', () => cartModal.style.display = 'flex');
closeCart.addEventListener('click', () => cartModal.style.display = 'none');
window.addEventListener('click', (e) => {
    if (e.target === cartModal) cartModal.style.display = 'none';
});

userBtn.addEventListener('click', () => {
    window.location.href = 'admin.html';
});

// Load Categories
async function loadCategories() {
    try {
        const snapshot = await db.collection('categories').get();
        if (snapshot.empty) {
            // Fallback dummy categories
            categories = [
                { id: '1', name: 'وجبات رئيسية' },
                { id: '2', name: 'مقبلات' },
                { id: '3', name: 'مشروبات' },
                { id: '4', name: 'حلويات' }
            ];
        } else {
            categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
        renderCategories();
    } catch (error) {
        console.error("Error loading categories:", error);
        categories = [{ id: '1', name: 'وجبات رئيسية' }, { id: '2', name: 'مقبلات' }];
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
        if (snapshot.empty) {
            // Dummy products if DB is empty
            products = [
                { id: 'p1', name: 'برجر دجاج كريسبي', price: 120, category: 'وجبات رئيسية', image: 'images/products/burger.png', desc: 'صدر دجاج مقرمش مع صوص خاص وخس' },
                { id: 'p2', name: 'باستا الفريدو', price: 95, category: 'وجبات رئيسية', image: 'images/products/pasta.png', desc: 'مكرونة بصوص الكريمة والمشروم والدجاج' },
                { id: 'p3', name: 'بيتزا نابولي', price: 130, category: 'وجبات رئيسية', image: 'images/products/pizza.png', desc: 'صلصة طماطم، موزاريلا فريش، ريحان' },
                { id: 'p4', name: 'موهيتو ليمون نعناع', price: 40, category: 'مشروبات', image: 'images/products/mojito.png', desc: 'مشروب منعش بالليمون والنعناع الطازج' }
            ];
        } else {
            products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
        renderProducts(products);
    } catch (error) {
        console.error("Error loading products:", error);
        // Fallback dummy products
        products = [
            { id: 'p1', name: 'برجر دجاج كريسبي', price: 120, category: 'وجبات رئيسية', image: 'images/products/burger.png', desc: 'صدر دجاج مقرمش مع صوص خاص وخس' },
            { id: 'p2', name: 'باستا الفريدو', price: 95, category: 'وجبات رئيسية', image: 'images/products/pasta.png', desc: 'مكرونة بصوص الكريمة والمشروم والدجاج' },
            { id: 'p3', name: 'بيتزا نابولي', price: 130, category: 'وجبات رئيسية', image: 'images/products/pizza.png', desc: 'صلصة طماطم، موزاريلا فريش، ريحان' },
            { id: 'p4', name: 'موهيتو ليمون نعناع', price: 40, category: 'مشروبات', image: 'images/products/mojito.png', desc: 'مشروب منعش بالليمون والنعناع الطازج' }
        ];
        renderProducts(products);
    }
}

function renderProducts(productsToRender) {
    productsContainer.innerHTML = '';
    productsToRender.forEach(product => {
        productsContainer.innerHTML += `
            <div class="product-card">
                <div class="product-img">
                    <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300?text=Food'">
                </div>
                <div class="product-info">
                    <div class="product-category">${product.category}</div>
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-desc">${product.desc}</p>
                    <div class="product-footer">
                        <span class="product-price">${product.price} ج.م</span>
                        <button class="add-to-cart" onclick="addToCart('${product.id}', event)">
                            <i class="fas fa-plus"></i> أضف للسلة
                        </button>
                    </div>
                </div>
            </div>
        `;
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

// Cart Logic
window.addToCart = (productId, event) => {
    const product = products.find(p => p.id === productId);
    const cartItem = cart.find(item => item.id === productId);

    if (cartItem) {
        cartItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    saveCart();
    updateCartUI();

    // Simple feedback
    if (event) {
        const btn = event.target.closest('.add-to-cart');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> تمت الإضافة';
        btn.style.background = '#27ae60';
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '';
        }, 2000);
    }
};

function saveCart() {
    localStorage.setItem('restaurant_cart', JSON.stringify(cart));
}

function updateCartUI() {
    cartCount.innerText = cart.reduce((total, item) => total + item.quantity, 0);
    cartItemsContainer.innerHTML = '';

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="text-align: center; margin-top: 2rem;">السلة فارغة</p>';
        cartTotalAmount.innerText = '0 ج.م';
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
                    <p>${item.price} ج.م × ${item.quantity}</p>
                </div>
                <div class="cart-item-actions" style="display:flex; align-items:center; gap:0.5rem">
                    <button class="icon-btn" style="color:black" onclick="changeQuantity('${item.id}', -1)"><i class="fas fa-minus-circle"></i></button>
                    <span>${item.quantity}</span>
                    <button class="icon-btn" style="color:black" onclick="changeQuantity('${item.id}', 1)"><i class="fas fa-plus-circle"></i></button>
                    <button class="icon-btn" style="color:#e63946" onclick="removeFromCart('${item.id}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    });

    cartTotalAmount.innerText = `${total} ج.م`;
}

window.changeQuantity = (productId, delta) => {
    const item = cart.find(i => i.id === productId);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            saveCart();
            updateCartUI();
        }
    }
};

window.removeFromCart = (productId) => {
    cart = cart.filter(i => i.id !== productId);
    saveCart();
    updateCartUI();
};

// WhatsApp Order
checkoutBtn.addEventListener('click', () => {
    if (cart.length === 0) return alert('السلة فارغة!');

    let message = "مرحباً، أود طلب الآتي:\n\n";
    let total = 0;

    cart.forEach(item => {
        message += `• ${item.name} (${item.quantity} × ${item.price} ج.م) = ${item.quantity * item.price} ج.م\n`;
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
