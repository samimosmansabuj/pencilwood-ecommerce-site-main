/* ── STARS ── */
function mkStars(id, score, sz) {
    const el = document.getElementById(id); if (!el) return;
    el.style.cssText = 'display:flex;gap:2px';
    for (let i = 1; i <= 5; i++) {
        const s = document.createElement('div');
        s.className = 'star ' + (i <= Math.floor(score) ? 'f' : (i - score < 1 && score % 1 >= .5 ? 'h' : ''));
        if (sz) { s.style.width = sz + 'px'; s.style.height = sz + 'px' }
        el.appendChild(s);
    }
}
mkStars('prodStars', 4.8); mkStars('bigStars', 4.8, 15);
mkStars('rv1s', 5); mkStars('rv2s', 5); mkStars('rv3s', 4);

/* ── GALLERY ── */
function setThumb(el, emoji) {
    document.querySelectorAll('.thumb').forEach(t => t.classList.remove('on'));
    el.classList.add('on');
    document.getElementById('galEmoji').textContent = emoji;
    document.getElementById('galMain').classList.remove('zoomed');
}
function zoomToggle() {
    const g = document.getElementById('galMain');
    g.classList.toggle('zoomed');
}

/* ── WISHLIST ── */
let wished = false;
function wishToggle() {
    const product = {
        id: "lth-w-001",
        name: "Premium Leather Wallet",
        price: 2500
    };

    let wishlist = getWishlist();
    const exist = wishlist.find(i => i.id === product.id);

    if (exist) {
        wishlist = wishlist.filter(i => i.id !== product.id);
        wished = false;
    } else {
        wishlist.push(product);
        wished = true;
    }

    setWishlist(wishlist);
    updateWishlistCount();

    const i = document.getElementById('wishIco'),
          b = document.getElementById('wishBtn');

    if (i) i.textContent = wished ? '❤️' : '♡';
    if (b) b.innerHTML = (wished ? '❤️' : '♡') + ' Wishlist';

    toast(wished ? 'Added to Wishlist ❤️' : 'Removed from Wishlist');
}

/* ── QTY ── */
let qty = 1, maxQ = 18;
function chgQ(d) {
    qty = Math.max(1, Math.min(maxQ, qty + d));
    document.getElementById('qVal').value = qty;
    document.getElementById('qMinus').disabled = qty <= 1;
    document.getElementById('qPlus').disabled = qty >= maxQ;
}

/* ── COLOR ── */
function pickColor(name, emoji) {
    document.getElementById('selColor').textContent = name;
    document.getElementById('galEmoji').textContent = emoji;
    document.querySelectorAll('.thumb')[0].textContent = emoji;
    toast('Color: ' + name);
}

/* ── CART ── */
function addCart() {
    const product = {
        id: "lth-w-001",
        name: "Premium Leather Wallet",
        price: 2500,
        qty: qty
    };

    let cart = getCart();
    const exist = cart.find(i => i.id === product.id);

    if (exist) exist.qty += qty;
    else cart.push(product);

    setCart(cart);
    updateCartCount();

    const btn = document.getElementById('cartBtn');
    btn.classList.add('added');
    btn.textContent = '✔ Added!';

    toast('✔ ' + qty + ' item(s) added to cart!');

    setTimeout(() => {
        btn.classList.remove('added');
        btn.textContent = '+ Add to Cart';
    }, 2000);
}

function updateCartCount() {
    const dot = document.getElementById('cartDot');
    if (!dot) return;

    const cart = getCart();
    let total = 0;
    cart.forEach(i => total += i.qty || 1);

    dot.textContent = total;
}

function loadCartItems() {
    const container = document.getElementById('cartItemsContainer');
    if (!container) return;

    const cart = getCart();
    container.innerHTML = '';

    cart.forEach(item => {
        container.innerHTML += `
        <div class="cart-item">
          <input type="checkbox" class="cart-check" data-id="${item.id}" checked>

          <div class="item-img">${item.img || '👜'}</div>

          <div class="item-info">
            <div class="item-name">${item.name}</div>
            <div class="item-price">৳ ${item.price}</div>
          </div>

          <div class="item-qty">
            <button onclick="chgCartQty('${item.id}', -1)">−</button>
            <input value="${item.qty}" readonly>
            <button onclick="chgCartQty('${item.id}', 1)">+</button>
          </div>

          <button onclick="removeCartItem('${item.id}')">✕</button>
        </div>`;
    });

    updateCartSummary();
}

function chgCartQty(id, delta) {
    let cart = getCart();
    cart = cart.map(item => {
        if (item.id === id) item.qty = Math.max(1, item.qty + delta);
        return item;
    });

    setCart(cart);
    loadCartItems();
    updateCartCount();
}

function removeCartItem(id) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== id);

    setCart(cart);
    loadCartItems();
    updateCartCount();

    toast("Item removed ❌");
}

function updateCartSummary() {
    const cart = getCart();

    let subtotal = 0;
    cart.forEach(item => subtotal += item.price * item.qty);

    document.getElementById('cartSubtotal').textContent = `৳ ${subtotal}`;
}

/* ── WISHLIST ── */
function loadWishlist() {
    const container = document.getElementById('wishlistContainer');
    if (!container) return;

    const wishlist = getWishlist();
    container.innerHTML = '';

    if (wishlist.length === 0) {
        container.innerHTML = `<p style="text-align:center">Your wishlist is empty 😢</p>`;
        return;
    }

    wishlist.forEach(item => {
        container.innerHTML += `
        <div class="wish-card">
            <div class="wish-img">👜</div>
            <div class="wish-info">
                <div class="wish-name">${item.name}</div>
                <div class="wish-price">৳ ${item.price}</div>
            </div>
            <div class="wish-actions">
                <button onclick="moveToCart('${item.id}')">🛒 Add to Cart</button>
                <button onclick="removeWish('${item.id}')">❌ Remove</button>
            </div>
        </div>`;
    });
}

function removeWish(id) {
    let wishlist = getWishlist();
    wishlist = wishlist.filter(item => item.id !== id);

    setWishlist(wishlist);
    loadWishlist();
    updateWishlistCount();

    toast("Removed ❌");
}

function moveToCart(id) {
    let wishlist = getWishlist();
    let cart = getCart();

    const item = wishlist.find(i => i.id === id);
    if (!item) return;

    const exist = cart.find(i => i.id === id);
    if (exist) exist.qty += 1;
    else cart.push({ ...item, qty: 1 });

    wishlist = wishlist.filter(i => i.id !== id);

    setCart(cart);
    setWishlist(wishlist);

    loadWishlist();
    updateCartCount();
    updateWishlistCount();

    toast("Moved to cart 🛒");
}

function updateWishlistCount() {
    const el = document.getElementById('wishCount');
    if (!el) return;

    const wishlist = getWishlist();
    el.textContent = wishlist.length;
}

/* ── STORAGE ── */
function getCart() { return JSON.parse(localStorage.getItem('cart')) || []; }
function setCart(cart) { localStorage.setItem('cart', JSON.stringify(cart)); }
function getWishlist() { return JSON.parse(localStorage.getItem('wishlist')) || []; }
function setWishlist(wishlist) { localStorage.setItem('wishlist', JSON.stringify(wishlist)); }
function getAddress() { return JSON.parse(localStorage.getItem('addressList')) || []; }
function setAddress(data) { localStorage.setItem('addressList', JSON.stringify(data)); }

/* ── ADDRESS FUNCTIONS ── */
function loadAddress() {
    const container = document.getElementById('addressList');
    if (!container) return;

    const list = getAddress();
    container.innerHTML = '';

    if (list.length === 0) {
        container.innerHTML = `<p style="text-align:center">No address added yet 😢</p>`;
        return;
    }

    list.forEach(addr => {
        container.innerHTML += `
        <div class="address-card">
            <div class="addr-name">${addr.name}</div>
            <div class="addr-phone">${addr.phone}</div>
            <div class="addr-text">${addr.text}, ${addr.district}</div>

            <div class="addr-actions">
                <button onclick="editAddress(${addr.id})">Edit</button>
                <button onclick="deleteAddress(${addr.id})">Delete</button>
            </div>
        </div>`;
    });
}

function addAddress() {
    const name = document.getElementById('addrName').value.trim();
    const phone = document.getElementById('addrPhone').value.trim();
    const district = document.getElementById('deliverydistrict').value;
    const text = document.getElementById('addrText').value.trim();

    if (!name || !phone || !district || !text) {
        toast("Fill all fields ⚠️");
        return;
    }

    let list = getAddress();
    list.push({ id: Date.now(), name, phone, district, text });
    setAddress(list);
    loadAddress();
    toast("Address added ✅");

    document.getElementById('addrName').value = '';
    document.getElementById('addrPhone').value = '';
    document.getElementById('deliverydistrict').value = '';
    document.getElementById('addrText').value = '';
}

function deleteAddress(id) {
    let list = getAddress();
    list = list.filter(a => a.id !== id);
    setAddress(list);
    loadAddress();
    toast("Deleted ❌");
}

function editAddress(id) {
    const list = getAddress();
    const addr = list.find(a => a.id === id);
    if (!addr) return;

    document.getElementById('addrName').value = addr.name;
    document.getElementById('addrPhone').value = addr.phone;
    document.getElementById('deliverydistrict').value = addr.district;
    document.getElementById('addrText').value = addr.text;

    deleteAddress(id);
    toast("Edit and save again ✏️");
}

/* ── INIT ── */
window.addEventListener('DOMContentLoaded', () => {

    updateCartCount();
    updateWishlistCount();

    if (document.getElementById("profileFullName")) loadProfile();

    if (document.getElementById("addressList")) {
        loadDistricts();
        loadAddress();
    }

    if (document.getElementById("checkoutProducts")) {
        loadCheckoutProducts();
        loadCheckoutProfile();
        loadCheckoutAddress();
        loadDistricts();
    }

    document.getElementById("ckDistrict")?.addEventListener("change", () => {
        const subtotal = parseInt(document.getElementById("ckSubtotal").textContent) || 0;
        updateShipping(subtotal);
    });

});

/* ── DISTRICTS ── */
function loadDistricts() {
    const districtSelect = document.getElementById("ckDistrict");
    if (!districtSelect) return;

    // reset first
    districtSelect.innerHTML = `<option value="">District</option>`;

    fetch('https://bdapi.vercel.app/api/v.1/district')
        .then(res => res.json())
        .then(data => {
            if (data.status === 200) {
                data.data.forEach(d => {
                    const option = document.createElement('option');
                    option.value = d.name.toLowerCase(); // for logic (dhaka)
                    option.textContent = d.bn_name; // UI
                    districtSelect.appendChild(option);
                });
            }
        })
        .catch(() => {
            console.log("District API failed ❌");
        });
}

/* ── PROFILE ── */
function getProfile() {
    return JSON.parse(localStorage.getItem('profile')) || {
        fullName: "", phone: "", whatsapp: "", email: ""
    };
}

function setProfile(profile) {
    localStorage.setItem('profile', JSON.stringify(profile));
}

function loadProfile() {
    const profile = getProfile();
    document.querySelector('#profileFullName').value = profile.fullName;
    document.querySelector('#profilePhone').value = profile.phone;
    document.querySelector('#profileWhatsapp').value = profile.whatsapp;
    document.querySelector('#profileEmail').value = profile.email;
}

function saveProfile() {
    const profile = {
        fullName: document.querySelector('#profileFullName').value.trim(),
        phone: document.querySelector('#profilePhone').value.trim(),
        whatsapp: document.querySelector('#profileWhatsapp').value.trim(),
        email: document.querySelector('#profileEmail').value.trim()
    };

    if (!profile.fullName || !profile.phone || !profile.email) {
        toast("Fill required fields ⚠️"); return;
    }

    setProfile(profile);
    toast("Profile saved ✅");
}

/* ── TOAST ── */
function toast(msg, type = "success") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.textContent = msg;

    container.appendChild(el);
    setTimeout(() => el.classList.add("show"), 50);

    setTimeout(() => {
        el.classList.remove("show");
        setTimeout(() => el.remove(), 300);
    }, 3000);
}

/* ── CHECKOUT ── */

function loadCheckoutProducts() {
    const container = document.getElementById("checkoutProducts");
    const summary = document.getElementById("checkoutSummaryItems");

    if (!container) return;

    let items = JSON.parse(localStorage.getItem("checkoutItems")) || [];

    if (items.length === 0) {
        container.innerHTML = `<p>No product selected 😢</p>`;
        summary.innerHTML = "";
        return;
    }

    let subtotal = 0;
    container.innerHTML = '';
    summary.innerHTML = '';

    items.forEach(item => {
        subtotal += item.price * item.qty;

        container.innerHTML += `
        <div class="ck-product-row">
            <div class="ck-img">${item.img || '👜'}</div>
            <div class="ck-info">
                <div>${item.name}</div>
                <div>৳ ${item.price} × ${item.qty}</div>
            </div>
        </div>`;

        summary.innerHTML += `
        <div class="sum-item">
            <div>${item.name}</div>
            <div>৳ ${item.price} × ${item.qty}</div>
        </div>`;
    });

    document.getElementById("ckSubtotal").textContent = subtotal;
    updateShipping(subtotal);
}

function loadCheckoutProfile() {
    const profile = getProfile();
    document.getElementById("ckName").value = profile.fullName;
    document.getElementById("ckPhone").value = profile.phone;
}

function loadCheckoutAddress() {
    const list = getAddress();
    const select = document.getElementById("ckAddressSelect");

    if (!select) return;

    select.innerHTML = `<option value="">Select saved address</option>`;

    if (list.length === 0) {
        document.getElementById("ckAddress").value = "";
        document.getElementById("ckDistrict").value = "";
        return;
    }

    list.forEach(addr => {
        const option = document.createElement("option");
        option.value = addr.id;
        option.textContent = `${addr.text}, ${addr.district}`;
        select.appendChild(option);
    });

    const lastAddr = list[list.length - 1];
    select.value = lastAddr.id;

    document.getElementById("ckAddress").value = lastAddr.text;
    document.getElementById("ckDistrict").value = lastAddr.district;

    select.addEventListener("change", function () {
        const selected = list.find(a => a.id == this.value);

        if (selected) {
            document.getElementById("ckAddress").value = selected.text;
            document.getElementById("ckDistrict").value = selected.district;
        } else {
            document.getElementById("ckAddress").value = "";
            document.getElementById("ckDistrict").value = "";
        }
    });
}

function updateShipping(subtotal) {
    let shipping = 120;
    const district = document.getElementById("ckDistrict").value;
    if (district === "dhaka") shipping = 60;

    document.getElementById("ckShipping").textContent = shipping;
    document.getElementById("ckTotal").textContent = subtotal + shipping;
}

function placeOrder() {
    const name = document.getElementById("ckName").value.trim();
    const phone = document.getElementById("ckPhone").value.trim();
    const addressText = document.getElementById("ckAddress").value.trim();
    const selectedId = document.getElementById("ckAddressSelect").value;
    const district = document.getElementById("ckDistrict").value;

    if (!name || !phone || !addressText || !district) {
        toast("Enter all delivery info ⚠️");
        return;
    }

    // Save profile
    const profile = getProfile();
    profile.fullName = name;
    profile.phone = phone;
    setProfile(profile);

    // Load address book
    let addrList = getAddress();
    let addressId;

    if (selectedId) {
        const selected = addrList.find(a => a.id == selectedId);
        if (selected) addressId = selected.id;
    } else {
        // New address: save to address book
        addressId = Date.now();
        const newAddress = { id: addressId, name, phone, text: addressText, district };
        addrList.push(newAddress);
        setAddress(addrList);
        toast("New address saved to address book ✅");

        // Update ckAddressSelect immediately
        const select = document.getElementById("ckAddressSelect");
        if (select) {
            const option = document.createElement("option");
            option.value = addressId;
            option.textContent = `${addressText}, ${district}`;
            select.appendChild(option);
            select.value = addressId;
        }
    }

    // Place order
    let cartItems = JSON.parse(localStorage.getItem("checkoutItems")) || [];
    if (cartItems.length === 0) {
        toast("Cart empty ❌"); return;
    }

    const subtotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
    const shipping = parseInt(document.getElementById("ckShipping").textContent) || 0;
    const total = subtotal + shipping;

    let orders = JSON.parse(localStorage.getItem("orders")) || [];

    const order = {
        id: `BX${Date.now()}`,
        date: new Date().toLocaleDateString(),
        status: "pending",
        items: cartItems,
        subtotal, shipping, total,
        address: { id: addressId, name, phone, text: addressText, district }
    };

    orders.push(order);
    localStorage.setItem("orders", JSON.stringify(orders));

    localStorage.removeItem("checkoutItems");

    toast("Order placed ✅");

    setTimeout(() => window.location.href = "my-orders.html", 1200);
}



// ── CART ──
function getCart() {
    return JSON.parse(localStorage.getItem('cart')) || [];
}
function setCart(items) {
    localStorage.setItem('cart', JSON.stringify(items));
    updateCartCount();
}
function updateCartCount() {
    const c = getCart().length;
    document.querySelectorAll('#cartBtnCount, .cart-count').forEach(el => el.textContent = c);
}

// ── WISHLIST ──
function getWish() {
    return JSON.parse(localStorage.getItem('wishlist')) || [];
}
function setWish(items) {
    localStorage.setItem('wishlist', JSON.stringify(items));
    updateWishCount();
}
function updateWishCount() {
    const w = getWish().length;
    document.querySelectorAll('#wishBtnCount, .wish-count').forEach(el => el.textContent = w);
}

// ── INIT ON PAGE LOAD ──
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    updateWishCount();
});

