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
            // Expanded Dummy products (15 per category) with high-quality stable Unsplash links
            products = [
                // وجبات رئيسية (15)
                { id: 'p1', name: 'برجر دجاج كريسبي', price: 120, category: 'وجبات رئيسية', image: 'images/products/burger.png', desc: 'صدر دجاج مقرمش مع صوص خاص وخس' },
                { id: 'p2', name: 'باستا الفريدو', price: 95, category: 'وجبات رئيسية', image: 'images/products/pasta.png', desc: 'مكرونة بصوص الكريمة والمشروم والدجاج' },
                { id: 'p3', name: 'بيتزا نابولي', price: 130, category: 'وجبات رئيسية', image: 'images/products/pizza.png', desc: 'صلصة طماطم، موزاريلا فريش، ريحان' },
                { id: 'p4', name: 'ستيك لحم بقر رويال', price: 250, category: 'وجبات رئيسية', image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?q=80&w=600&auto=format&fit=crop', desc: 'شريحة لحم مشوية مع خضار سوتيه' },
                { id: 'p5', name: 'ريزوتو فطر إيطالي', price: 110, category: 'وجبات رئيسية', image: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?q=80&w=600&auto=format&fit=crop', desc: 'أرز إيطالي مطهو مع الفطر البري والكريمة' },
                { id: 'p6', name: 'سلمون بصوص الشبت', price: 180, category: 'وجبات رئيسية', image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=600&auto=format&fit=crop', desc: 'فيليه سلمون بصوص الليمون والشبت' },
                { id: 'p7', name: 'لازانيا بولونيز فاخرة', price: 105, category: 'وجبات رئيسية', image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=600&auto=format&fit=crop', desc: 'طبقات المكرونة مع اللحم المفروم والبشاميل' },
                { id: 'p8', name: 'كوردون بلو فرنسي', price: 140, category: 'وجبات رئيسية', image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?q=80&w=600&auto=format&fit=crop', desc: 'دجاج محشو بالجبن واللحم المدخن' },
                { id: 'p9', name: 'كباب مشوي عالفحم', price: 160, category: 'وجبات رئيسية', image: 'https://images.unsplash.com/photo-1514327605112-b887c0e61c0a?q=80&w=600&auto=format&fit=crop', desc: 'لحم ضأن متبل مشوي على الفحم' },
                { id: 'p10', name: 'فليتو مشوي سبايسي', price: 210, category: 'وجبات رئيسية', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop', desc: 'قطع لحم فليتو طرية مع صوص الفلفل الأسود' },
                { id: 'p11', name: 'دجاج تيكا هندي', price: 90, category: 'وجبات رئيسية', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=600&auto=format&fit=crop', desc: 'دجاج مشوي على الطريقة الهندية بالتوابل' },
                { id: 'p12', name: 'مكرونة فواكه بحر', price: 155, category: 'وجبات رئيسية', image: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?q=80&w=600&auto=format&fit=crop', desc: 'مكرونة مع الجمبري والسبيط والكريمة' },
                { id: 'p13', name: 'شيلي كون كارني حار', price: 115, category: 'وجبات رئيسية', image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?q=80&w=600&auto=format&fit=crop', desc: 'لحم مفروم مع الفاصوليا الحمراء والتوابل الحارة' },
                { id: 'p14', name: 'دجاج بانيه مقرمش', price: 135, category: 'وجبات رئيسية', image: 'https://images.unsplash.com/photo-1562436260-8c9216eeb703?q=80&w=600&auto=format&fit=crop', desc: 'قطع دجاج مقلية مقرمشة تكفي شخصين' },
                { id: 'p15', name: 'برياني دجاج حيدر أباد', price: 100, category: 'وجبات رئيسية', image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?q=80&w=600&auto=format&fit=crop', desc: 'أرز بسمتي مع الدجاج المتبل والبهارات' },

                // مقبلات (15)
                { id: 'p16', name: 'بطاطس مقلية ذهبية', price: 45, category: 'مقبلات', image: 'https://images.unsplash.com/photo-1630384066252-19e1ad955494?q=80&w=600&auto=format&fit=crop', desc: 'بطاطس ذهبية ومقرمشة بالسماق' },
                { id: 'p17', name: 'أجنحة دجاج بافالو', price: 70, category: 'مقبلات', image: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?q=80&w=600&auto=format&fit=crop', desc: 'أجنحة دجاج متبلة بصوص البافالو الحار' },
                { id: 'p18', name: 'حلقات بصل كرسبي', price: 35, category: 'مقبلات', image: 'https://images.unsplash.com/photo-1639024471283-2951d0aa883d?q=80&w=600&auto=format&fit=crop', desc: 'حلقات بصل مقرمشة مع صوص الرانش' },
                { id: 'p19', name: 'موزاريلا ستيكس مقلية', price: 60, category: 'مقبلات', image: 'https://images.unsplash.com/photo-1531423438612-7f8e137bc6b2?q=80&w=600&auto=format&fit=crop', desc: 'أصابع جبنة موزاريلا ذائبة مقلية' },
                { id: 'p20', name: 'ورق عنب لبناني', price: 50, category: 'مقبلات', image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?q=80&w=600&auto=format&fit=crop', desc: 'ورق عنب محشو بالأرز والخلطة الشامية' },
                { id: 'p21', name: 'كبة شامي مقلية', price: 65, category: 'مقبلات', image: 'https://images.unsplash.com/photo-1541518763669-279f00ed51aa?q=80&w=600&auto=format&fit=crop', desc: 'كبة برغل محشوة باللحم المفروم والمكسرات' },
                { id: 'p22', name: 'سلطة سيزر دجاج', price: 55, category: 'مقبلات', image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?q=80&w=600&auto=format&fit=crop', desc: 'خس، صوص سيزر، كروتون، جبنة بارميزان' },
                { id: 'p23', name: 'سلطة يونانية فريش', price: 50, category: 'مقبلات', image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=600&auto=format&fit=crop', desc: 'خيار، طماطم، زيتون، جبنة فيتا' },
                { id: 'p24', name: 'خبز بالثوم والبارميزان', price: 40, category: 'مقبلات', image: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?q=80&w=600&auto=format&fit=crop', desc: 'شرائح خبز فرنسي بالثوم والموزاريلا المحمصة' },
                { id: 'p25', name: 'بطاطس بجبنة الشيدر', price: 55, category: 'مقبلات', image: 'https://images.unsplash.com/photo-1581541234445-5d5138f1dc8d?q=80&w=600&auto=format&fit=crop', desc: 'بطاطس مقلية مغطاة بصوص الشيدر الساخن' },
                { id: 'p26', name: 'سبرينج رولز خضار', price: 45, category: 'مقبلات', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop', desc: 'لفائف الخضار المقلية المقرمشة' },
                { id: 'p27', name: 'فطر محشو بالجبنة', price: 75, category: 'مقبلات', image: 'https://images.unsplash.com/photo-1512485600893-b08ec1d59f1f?q=80&w=600&auto=format&fit=crop', desc: 'فطر طازج محشو بالجبنة والأعشاب' },
                { id: 'p28', name: 'حمص شرقي باللحمة', price: 65, category: 'مقبلات', image: 'https://images.unsplash.com/photo-1574484284002-952d92456975?q=80&w=600&auto=format&fit=crop', desc: 'حمص مهروس ناعم مغطى بقطع اللحم المشوية' },
                { id: 'p29', name: 'بابا غنوج مدخن', price: 40, category: 'مقبلات', image: 'https://images.unsplash.com/photo-1596797038530-2c39bb82dfdf?q=80&w=600&auto=format&fit=crop', desc: 'باذنجان مشوي مع الطحينة والليمون' },
                { id: 'p30', name: 'سلطة كول سلو', price: 30, category: 'مقبلات', image: 'https://images.unsplash.com/photo-1546793665-c74683c3f38d?q=80&w=600&auto=format&fit=crop', desc: 'كرنب وجزر مبشور بصوص المايونيز المنعش' },

                // مشروبات (15)
                { id: 'p31', name: 'موهيتو ليمون منعش', price: 40, category: 'مشروبات', image: 'images/products/mojito.png', desc: 'مشروب منعش بالليمون والنعناع الطازج' },
                { id: 'p32', name: 'ميلك شيك شوكولا', price: 55, category: 'مشروبات', image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?q=80&w=600&auto=format&fit=crop', desc: 'شوكولاتة بلجيكية مع آيس كريم فانيليا' },
                { id: 'p33', name: 'برتقال طبيعي فريش', price: 35, category: 'مشروبات', image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?q=80&w=600&auto=format&fit=crop', desc: 'برتقال طبيعي معصور طازج' },
                { id: 'p34', name: 'آيس كوفي كراميل', price: 50, category: 'مشروبات', image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?q=80&w=600&auto=format&fit=crop', desc: 'قهوة باردة مع حليب وسكر بني' },
                { id: 'p35', name: 'ليمونادة بالتوت البري', price: 45, category: 'مشروبات', image: 'https://images.unsplash.com/photo-1523472721958-978152f4d69b?q=80&w=600&auto=format&fit=crop', desc: 'ليمون فريش مع قطع التوت البري' },
                { id: 'p36', name: 'عصير مانجو استوائي', price: 40, category: 'مشروبات', image: 'https://images.unsplash.com/photo-1534353436294-0dbd4bdac845?q=80&w=600&auto=format&fit=crop', desc: 'مانجو طبيعي غني وناعم' },
                { id: 'p37', name: 'مشروب غازي بيبسي', price: 20, category: 'مشروبات', image: 'https://images.unsplash.com/photo-1622483767028-3f66f361456b?q=80&w=600&auto=format&fit=crop', desc: 'مياه غازية منعشة' },
                { id: 'p38', name: 'سموذي فراولة طبيعي', price: 40, category: 'مشروبات', image: 'https://images.unsplash.com/photo-1567529854338-fc697deb6133?q=80&w=600&auto=format&fit=crop', desc: 'فراولة طبيعية طازجة' },
                { id: 'p39', name: 'سموذي كيوي صحي', price: 50, category: 'مشروبات', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=600&auto=format&fit=crop', desc: 'سموذي كيوي منعش ومغذي' },
                { id: 'p40', name: 'سبانيش لاتيه بارد', price: 60, category: 'مشروبات', image: 'https://images.unsplash.com/photo-1551046779-bc4531343b95?q=80&w=600&auto=format&fit=crop', desc: 'إسبريسو مع حليب مكثف محلى' },
                { id: 'p41', name: 'شاي مثلج خوخ فريش', price: 35, category: 'مشروبات', image: 'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?q=80&w=600&auto=format&fit=crop', desc: 'شاي مثلج بنكهة الخوخ الطبيعية' },
                { id: 'p42', name: 'ميلك شيك فانيليا غني', price: 50, category: 'مشروبات', image: 'https://images.unsplash.com/photo-1534706936160-d5ee67737049?q=80&w=600&auto=format&fit=crop', desc: 'آيس كريم فانيليا غني بالحليب' },
                { id: 'p43', name: 'جوافة طبيعية باللبن', price: 40, category: 'مشروبات', image: 'https://images.unsplash.com/photo-1600271886311-ad8d7142c99f?q=80&w=600&auto=format&fit=crop', desc: 'جوافة طبيعية مع الحليب البارد' },
                { id: 'p44', name: 'مياه معدنية طبيعية', price: 10, category: 'مشروبات', image: 'https://images.unsplash.com/photo-1559839914-17aae19cea9e?q=80&w=600&auto=format&fit=crop', desc: 'مياه معدنية طبيعية 500 مل' },
                { id: 'p45', name: 'كابتشينو إيطالي', price: 45, category: 'مشروبات', image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?q=80&w=600&auto=format&fit=crop', desc: 'قهوة مع حليب ورغوة كثيفة' },

                // حلويات (15)
                { id: 'p46', name: 'تشيز كيك زبدة لوتس', price: 75, category: 'حلويات', image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?q=80&w=600&auto=format&fit=crop', desc: 'قاعدة بسكويت مع كريمة الجبن وزبدة اللوتس' },
                { id: 'p47', name: 'مولتن كيك دافئ', price: 80, category: 'حلويات', image: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?q=80&w=600&auto=format&fit=crop', desc: 'كيك الشوكولاتة الذائب مع آيس كريم فانيليا' },
                { id: 'p48', name: 'وافل فواكه مشكلة', price: 65, category: 'حلويات', image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=600&auto=format&fit=crop', desc: 'وافل بلجيكي مغطى بالفواكه الطازجة والعسل' },
                { id: 'p49', name: 'براونيز شوكولا كلاسيك', price: 55, category: 'حلويات', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=600&auto=format&fit=crop', desc: 'قطع البراونيز الغنية بقطع الشوكولاتة' },
                { id: 'p50', name: 'أرز بلبن بالمكسرات', price: 35, category: 'حلويات', image: 'https://images.unsplash.com/photo-1590089053076-0275cc1f1c84?q=80&w=600&auto=format&fit=crop', desc: 'أرز مطهو بالحليب والمستكة والمكسرات' },
                { id: 'p51', name: 'كريم بروليه فرنسي', price: 70, category: 'حلويات', image: 'https://images.unsplash.com/photo-1470124122822-d284e4a29a6a?q=80&w=600&auto=format&fit=crop', desc: 'كسترد ناعم مغطى بطبقة سكر محروق' },
                { id: 'p52', name: 'تورته شوكولا فاخرة', price: 60, category: 'حلويات', image: 'https://images.unsplash.com/photo-1578985543219-406ce22b5182?q=80&w=600&auto=format&fit=crop', desc: 'شريحة تورتة شوكولاتة هشة وطرية' },
                { id: 'p53', name: 'بان كيك بالنوتيلا', price: 65, category: 'حلويات', image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7bb7445?q=80&w=600&auto=format&fit=crop', desc: 'طبقات بان كيك بصوص النوتيلا والبندق' },
                { id: 'p54', name: 'سينابون رول قرفة', price: 50, category: 'حلويات', image: 'https://images.unsplash.com/photo-1509365465985-25d11c17e812?q=80&w=600&auto=format&fit=crop', desc: 'لفائف القرفة مع صوص الجبن الأبيض' },
                { id: 'p55', name: 'أم علي بالمكسرات', price: 55, category: 'حلويات', image: 'https://images.unsplash.com/photo-1610444583731-9733f321d510?q=80&w=600&auto=format&fit=crop', desc: 'رقائق العجين مع الحليب الساخن والمكسرات' },
                { id: 'p56', name: 'كنافة بالكريمة بلدي', price: 45, category: 'حلويات', image: 'https://images.unsplash.com/photo-1512484491122-269e8b958c89?q=80&w=600&auto=format&fit=crop', desc: 'كنافة ذهبية محشوة بالكريمة الغنية' },
                { id: 'p57', name: 'بسبوسة باللوز ناعمة', price: 40, category: 'حلويات', image: 'https://images.unsplash.com/photo-1589114126859-0dbdce076751?q=80&w=600&auto=format&fit=crop', desc: 'بسبوسة ناعمة ومرملة باللوز' },
                { id: 'p58', name: 'آيس كريم بولات منوعة', price: 45, category: 'حلويات', image: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?q=80&w=600&auto=format&fit=crop', desc: '3 بولات آيس كريم من اختيارك' },
                { id: 'p59', name: 'سلطة فواكه طبيعية', price: 50, category: 'حلويات', image: 'https://images.unsplash.com/photo-1512132411229-c30391241dd8?q=80&w=600&auto=format&fit=crop', desc: 'قطع فواكه الموسم مع عصير طبيعي' },
                { id: 'p60', name: 'تيراميسو إيطالي كلاسيك', price: 85, category: 'حلويات', image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?q=80&w=600&auto=format&fit=crop', desc: 'حلوى إيطالية كلاسيكية بنكهة القهوة والكاكاو' }
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

    // Reset size buttons
    document.querySelectorAll('.size-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.size-btn:first-child').classList.add('active');

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

window.addToCartFromModal = () => {
    if (currentProductInModal) {
        addToCart(currentProductInModal.id, selectedSize);
        closeProductModal();
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
