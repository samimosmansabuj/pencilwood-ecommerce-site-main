/* ── STARS ── */
function mkStars(id, score, sz) {
    const el = document.getElementById(id); 
    if (!el) return;

    el.style.cssText = 'display:flex;gap:2px';

    for (let i = 1; i <= 5; i++) {
        const s = document.createElement('div');
        s.className = 'star ' + (
            i <= Math.floor(score) ? 'f' : 
            (i - score < 1 && score % 1 >= .5 ? 'h' : '')
        );

        if (sz) {
            s.style.width = sz + 'px';
            s.style.height = sz + 'px';
        }

        el.appendChild(s);
    }
}

mkStars('prodStars', 4.8);
mkStars('bigStars', 4.8, 15);
mkStars('rv1s', 5);
mkStars('rv2s', 5);
mkStars('rv3s', 4);

/* ── GALLERY ── */
function setThumb(el, emoji) {
    document.querySelectorAll('.thumb').forEach(t => t.classList.remove('on'));
    el.classList.add('on');

    const galEmoji = document.getElementById('galEmoji');
    if (galEmoji) galEmoji.textContent = emoji;

    const galMain = document.getElementById('galMain');
    if (galMain) galMain.classList.remove('zoomed');
}

function zoomToggle() {
    const g = document.getElementById('galMain');
    if (g) g.classList.toggle('zoomed');
}

/* ── WISHLIST ── */
// const exist = getWishlist().some(i => i.id === product.id);

function wishToggle() {
    let wished;
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

    const qVal = document.getElementById('qVal');
    if (qVal) qVal.value = qty;

    const minus = document.getElementById('qMinus');
    const plus = document.getElementById('qPlus');

    if (minus) minus.disabled = qty <= 1;
    if (plus) plus.disabled = qty >= maxQ;
}

/* ── COLOR ── */
function pickColor(name, emoji) {
    const sel = document.getElementById('selColor');
    if (sel) sel.textContent = name;

    const galEmoji = document.getElementById('galEmoji');
    if (galEmoji) galEmoji.textContent = emoji;

    const firstThumb = document.querySelectorAll('.thumb')[0];
    if (firstThumb) firstThumb.textContent = emoji;

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
    if (btn) {
        btn.classList.add('added');
        btn.textContent = '✔ Added!';
    }

    toast('✔ ' + qty + ' item(s) added to cart!');

    setTimeout(() => {
        if (btn) {
            btn.classList.remove('added');
            btn.textContent = '+ Add to Cart';
        }
    }, 2000);
}

/* ── CART COUNT ── */
function updateCartCount() {
    const dot = document.getElementById('cartDot');
    if (!dot) return;

    if (window.location.pathname.includes("checkout.html")) {
        dot.textContent = 0;
        return;
    }

    const cart = getCart();

    let total = cart.reduce((sum, item) => {
        return sum + (item.qty ? Number(item.qty) : 1);
    }, 0);

    dot.textContent = total;
}

/* ── CART LOAD ── */
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

        <div class="item-content">
            <div class="item-name">${item.name}</div>
            <div class="item-price">৳ ${item.price}</div>

            <div class="item-qty">
                <button onclick="chgCartQty('${item.id}', -1)">−</button>
                <input value="${item.qty}" readonly>
                <button onclick="chgCartQty('${item.id}', 1)">+</button>
            </div>
        </div>

        <button class="remove-btn" onclick="removeCartItem('${item.id}')">✕</button>

        </div>`;
    });

    updateCartSummary();
}

/* ── CART QTY ── */
function chgCartQty(id, delta) {
    let cart = getCart();

    cart = cart.map(item => {
        if (item.id === id) {
            item.qty = Math.max(1, Number(item.qty || 1) + delta);
        }
        return item;
    });

    setCart(cart);
    loadCartItems();
    updateCartCount();
}

/* ── REMOVE ITEM ── */
function removeCartItem(id) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== id);

    setCart(cart);
    loadCartItems();
    updateCartCount();

    toast("Item removed ❌");
}

/* ── SUMMARY ── */
function updateCartSummary() {
    const cart = getCart();

    let subtotal = 0;
    cart.forEach(item => {
        subtotal += item.price * item.qty;
    });

    const subtotalEl = document.getElementById('cartSubtotal');
    const stickyEl = document.getElementById('cartTotalSticky');

    if (subtotalEl) subtotalEl.textContent = `৳ ${subtotal}`;
    if (stickyEl) stickyEl.textContent = subtotal;
}

/* ── WISHLIST LOAD ── */
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

/* ── REMOVE WISH ── */
function removeWish(id) {
    let wishlist = getWishlist();
    wishlist = wishlist.filter(item => item.id !== id);

    setWishlist(wishlist);
    loadWishlist();
    updateWishlistCount();

    toast("Removed ❌");
}

/* ── MOVE TO CART ── */
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

/* ── WISH COUNT ── */
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

/* ── ADDRESS ── */

function addAddress() {
    const profile = getProfile();

    let name = document.getElementById('addrName')?.value.trim();
    let phone = document.getElementById('addrPhone')?.value.trim();
    let district = document.getElementById('deliverydistrict')?.value;
    let text = document.getElementById('addrText')?.value.trim();

    if (!district || !text) {
        toast("Fill address + district ⚠️");
        return;
    }

    name = name || profile.fullName;
    phone = phone || profile.phone;

    if (!name || !phone) {
        toast("Name/Phone missing ⚠️");
        return;
    }

    const addrList = getAddress();

    const newAddress = {
        id: Date.now(),
        name,
        phone,
        text,
        district
    };

    addrList.push(newAddress);
    setAddress(addrList);

    loadAddress();
    toast("Address saved ✅");

    document.getElementById('addrText').value = '';
    document.getElementById('deliverydistrict').value = '';
}

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

/* ── INIT ── */
window.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    updateWishlistCount();

    if (document.getElementById("addrName")) {
        loadAddressPageDefaults();
    }

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

        validateCheckout();

        document.getElementById("ckName")?.addEventListener("input", validateCheckout);
        document.getElementById("ckPhone")?.addEventListener("input", validateCheckout);
    }

    document.getElementById("ckDistrict")?.addEventListener("change", () => {
        const subtotal = parseInt(document.getElementById("ckSubtotal")?.textContent) || 0;
        updateShipping(subtotal);
    });

    const btn = document.getElementById('addAddressBtn');
    if (btn) btn.addEventListener('click', addAddress);
});

function loadAddressPageDefaults() {
    const profile = getProfile();

    const nameInput = document.getElementById('addrName');
    const phoneInput = document.getElementById('addrPhone');

    if (profile.fullName && nameInput) {
        nameInput.value = profile.fullName;
    }

    if (profile.phone && phoneInput) {
        phoneInput.value = profile.phone;
    }
}

/* ── DISTRICTS ── */
function loadDistricts() {
    const selects = [
        document.getElementById("ckDistrict"),
        document.getElementById("deliverydistrict")
    ].filter(Boolean);

    if (selects.length === 0) return;

    fetch('https://bdapi.vercel.app/api/v.1/district')
        .then(res => res.json())
        .then(data => {
            if (data.status === 200) {
                selects.forEach(select => {
                    select.innerHTML = `<option value="">Select District</option>`;
                    data.data.forEach(d => {
                        const option = document.createElement('option');
                        option.textContent = d.bn_name;
                        option.value = d.bn_name.toLowerCase();
                        select.appendChild(option);
                    });
                });
            }
        })
        .catch(() => console.log("District API failed ❌"));
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
    const p = getProfile();
    const n = document.querySelector('#profileFullName');
    const ph = document.querySelector('#profilePhone');
    const w = document.querySelector('#profileWhatsapp');
    const e = document.querySelector('#profileEmail');

    if (n) n.value = p.fullName;
    if (ph) ph.value = p.phone;
    if (w) w.value = p.whatsapp;
    if (e) e.value = p.email;
}

function saveProfile() {
    const profile = {
        fullName: document.querySelector('#profileFullName')?.value.trim(),
        phone: document.querySelector('#profilePhone')?.value.trim(),
        whatsapp: document.querySelector('#profileWhatsapp')?.value.trim(),
        email: document.querySelector('#profileEmail')?.value.trim()
    };

    if (!profile.fullName || !profile.phone || !profile.email) {
        toast("Fill required fields ⚠️");
        return;
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

function goToCheckout() {
    const cart = getCart();

    const selectedItems = cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        qty: item.qty,
        img: item.img || ''
    }));

    localStorage.setItem("checkoutItems", JSON.stringify(selectedItems));

    window.location.href = "checkout.html";
}

function loadCheckoutProfile() {
    const profile = getProfile();

    const name = document.getElementById("ckName");
    const phone = document.getElementById("ckPhone");

    if (profile.fullName && name) name.value = profile.fullName;
    if (profile.phone && phone) phone.value = profile.phone;
}

function loadCheckoutAddress() {
    const select = document.getElementById("ckAddressSelect");
    if (!select) return;

    const list = getAddress();

    select.innerHTML = `<option value="">Select saved address</option>`;

    list.forEach(addr => {
        const opt = document.createElement("option");
        opt.value = addr.id;
        opt.textContent = `${addr.text}, ${addr.district}`;
        select.appendChild(opt);
    });
}

function loadCheckoutProducts() {
    const container = document.getElementById("checkoutProducts");
    const summary = document.getElementById("checkoutSummaryItems");

    if (!container) return;

    let items = JSON.parse(localStorage.getItem("checkoutItems"));

    if (!items || items.length === 0) {
        const cart = getCart();
        if (cart.length > 0) {
            items = cart;
            localStorage.setItem("checkoutItems", JSON.stringify([...cart]));
        } else {
            container.innerHTML = `<p>No product selected 😢</p>`;
            if (summary) summary.innerHTML = "";
            return;
        }
    }

    let subtotal = 0;
    container.innerHTML = '';
    if (summary) summary.innerHTML = '';

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

        if (summary) {
            summary.innerHTML += `
            <div class="sum-item">
                <div>${item.name}</div>
                <div>৳ ${item.price} × ${item.qty}</div>
            </div>`;
        }
    });

    const sub = document.getElementById("ckSubtotal");
    if (sub) sub.textContent = subtotal;

    updateShipping(subtotal);
}

function validateCheckout() {
    const btn = document.querySelector('.btn-place, .sticky-btn');
    if (!btn) return;

    const name = document.getElementById("ckName")?.value.trim();
    const phone = document.getElementById("ckPhone")?.value.trim();

    btn.disabled = !(name && phone);
}

/* ── SHIPPING ── */
function updateShipping(subtotal) {
    const districtEl = document.getElementById("ckDistrict");
    const shipEl = document.getElementById("ckShipping");
    const totalEl = document.getElementById("ckTotal");

    let shipping = 120;

    if (districtEl && districtEl.value.toLowerCase().includes("dhaka")) {
        shipping = 60;
    }

    if (shipEl) shipEl.textContent = shipping;
    if (totalEl) totalEl.textContent = subtotal + shipping;
}

/* ── PLACE ORDER ── */

function placeOrder() {
    const name = document.getElementById("ckName")?.value.trim();
    const phone = document.getElementById("ckPhone")?.value.trim();
    const addressText = document.getElementById("ckAddress")?.value.trim();
    const selectedId = document.getElementById("ckAddressSelect")?.value;
    const district = document.getElementById("ckDistrict")?.value;

    let addrList = getAddress();
    let selectedAddress = null;

    if (selectedId) {
        selectedAddress = addrList.find(a => a.id == selectedId);
    }

    let finalDistrict = district;

    if (selectedAddress) {
        finalDistrict = selectedAddress.district;
    }

    if (!name || !phone) {
        toast("Enter name & phone ⚠️");
        return;
    }

    if (!selectedId && (!addressText || !district)) {
        toast("Enter address & district ⚠️");
        return;
    }

    const profile = getProfile();
    profile.fullName = name;
    profile.phone = phone;
    setProfile(profile);

    let finalAddress;

    if (selectedAddress) {
        finalAddress = selectedAddress;
    } else {
        finalAddress = {
            id: Date.now(),
            name,
            phone,
            text: addressText,
            district: finalDistrict
        };

        addrList.push(finalAddress);
        setAddress(addrList);
    }

    let cartItems = JSON.parse(localStorage.getItem("checkoutItems")) || [];
    if (cartItems.length === 0) {
        toast("Cart empty ❌");
        return;
    }

    const subtotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
    const shipping = parseInt(document.getElementById("ckShipping")?.textContent) || 0;
    const total = subtotal + shipping;

    let orders = JSON.parse(localStorage.getItem("orders")) || [];

    const order = {
        id: `BX${Date.now()}`,
        date: new Date().toLocaleString(),
        status: "pending",
        items: cartItems,
        subtotal,
        shipping,
        total,
        address: finalAddress,
    };

    orders.push(order);
    localStorage.setItem("orders", JSON.stringify(orders));

    let cart = getCart();
    let checkoutItems = JSON.parse(localStorage.getItem("checkoutItems")) || [];

    cart = cart.filter(cartItem => {
        return !checkoutItems.find(ci => ci.id === cartItem.id);
    });

    setCart(cart);
    updateCartCount();

    localStorage.removeItem("checkoutItems");

    toast("Order placed ✅");

    setTimeout(() => window.location.href = "my-orders.html", 1200);
}