// ================= GLOBAL VARIABLES =================
let productName = "";
let productUnitPrice = 0; // Number for calculation
let offerActive = false; // Offer OFF by default
let productID = 0; // To store fetched product ID for order payload
let productInventory = 0; // total available stock

// ================= UTILITY =================
function toBanglaNumber(number) {
    const eng = "0123456789";
    const bang = "০১২৩৪৫৬৭৮৯";
    return number.toString().split("").map(d => bang[eng.indexOf(d)] || d).join("");
}

function toEnglishNumber(number) {
    const bang = "০১২৩৪৫৬৭৮৯";
    const eng = "0123456789";
    return number.toString().split("").map(d => eng[bang.indexOf(d)] || d).join("");
}

// ================= PHONE VALIDATION =================
function isValidBDPhone(phone) {
    phone = phone.replace(/\s+/g, "");

    if (phone.startsWith("+8801") && phone.length === 14) return true;
    if (phone.startsWith("8801") && phone.length === 13) return true;
    if (phone.startsWith("01") && phone.length === 11) return true;

    return false;
}

// ================= PRODUCT FETCH =================
async function loadProduct() {
    try {
        const url = `${ENV.API_BASE_URL}/site/api/landing-page/${ENV.PRODUCT_LANDING_PAGE_ID}/`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json = await response.json();

        // Check structure
        if (
            !json.status ||
            !json.data ||
            !json.data.product ||
            json.data.product.length === 0
        ) {
            throw new Error("No product found for this landing page.");
        }

        const product = json.data.product[0];

        // Safe image handling
        // const mainImage = product.images && product.images.length > 0 ? product.images[0].image : "/static/default-product.png";
        // document.getElementById("hero-product-img").src = mainImage;

        const price = product.discount_price || product.price || 0;
        document.querySelectorAll(".product-new-price").forEach(el => {
            el.textContent = toBanglaNumber(Math.floor(price));
        });

        // Globals
        productName = product.name;
        productUnitPrice = Number(price);
        productID = product.id;
        productInventory = product.inventory_quantity || 0; // API must provide stock
        calculateOrder();
        GAViewItemEvent({ id: productID, name: productName, discount_price: productUnitPrice });

        document.getElementById("pageLoader").style.display = "none";
        document.getElementById("mainContent").style.display = "block";

    } catch (err) {
        console.error("Product fetch error:", err);
        document.querySelector("#pageLoader p").innerText = "লোড ব্যর্থ হয়েছে। রিফ্রেশ করুন। বিস্তারিত: " + err.message;
    }
}

// ================= DISTRICT LOAD =================
function loadDistricts() {
    const districtSelect = document.getElementById("deliverydistrict");
    fetch('https://bdapi.vercel.app/api/v.1/district')
        .then(response => response.json())
        .then(data => {
            if (data.status === 200 && data.success) {
                data.data.forEach(district => {
                    const option = document.createElement('option');
                    option.value = district.name.toLowerCase();
                    option.setAttribute('district_id', district.id);
                    option.textContent = district.bn_name;
                    districtSelect.appendChild(option);
                });
            }
        })
        .catch(error => console.log('Error fetching district:', error));
}

// ================= DELIVERY CHARGE =================
function calculateDeliveryCharge(districtValue) {
    switch (districtValue) {
        case "dhaka":
            return 60;
        case "chattogram":
            return 120;
        default:
            return 150;
    }
}

// ================= CALCULATION =================
function calculateOrder() {
    const qtyInput = document.getElementById("modalQuantity");
    const districtSelect = document.getElementById("deliverydistrict");

    const summarySubBar = document.getElementById("summarySubBar");
    const subEl = document.getElementById("summarySub");
    const discountEl = document.getElementById("summaryDiscount");
    const deliveryEl = document.getElementById("summaryDelivery");
    const totalEl = document.getElementById("summaryTotal");

    let qty = parseInt(qtyInput.value) || 1;
    let subtotal = productUnitPrice * qty;

    let discount = 0;
    let delivery = 0;

    if (districtSelect.value) {
        delivery = calculateDeliveryCharge(districtSelect.value);
    }

    // Offer logic
    if (offerActive) {
        let discountRate = 0;
        if (qty === 2) discountRate = 0.10;
        else if (qty === 3) discountRate = 0.20;
        else if (qty >= 4) discountRate = 0.30;

        discount = Math.round(subtotal * discountRate);

        if (qty >= 4) delivery = 0; // free delivery
    }

    let total = subtotal - discount + delivery;

    // Update UI in Bangla
    summarySubBar.innerText = subtotal;
    subEl.innerText = subtotal;
    discountEl.innerText = discount;
    deliveryEl.innerText = delivery;
    totalEl.innerText = total;

    // Offer section show/hide
    const offerSection = document.getElementById("offerSection");
    if (offerSection) {
        offerSection.style.display = offerActive ? "block" : "none";
    }

    // Discount row show/hide
    const discountRow = document.querySelector('.discount-row');
    if (discountRow) {
        discountRow.style.display = offerActive ? "flex" : "none";
    }

    // Scroll hook show/hide
    const scrollHook = document.querySelector('.scroll-hook');
    if (scrollHook) {
        scrollHook.style.display = offerActive ? "block" : "none";
    }

}

// ================= QUANTITY CONTROL =================
function setupQuantityButtons() {
    const qtyInput = document.getElementById("modalQuantity");
    const qtyPlus = document.getElementById("qtyPlus");
    const qtyMinus = document.getElementById("qtyMinus");

    qtyPlus.addEventListener("click", () => {
        qtyInput.value = parseInt(qtyInput.value) + 1;
        calculateOrder();
    });

    qtyMinus.addEventListener("click", () => {
        let current = parseInt(qtyInput.value) || 1;
        if (current > 1) {
            qtyInput.value = current - 1;
            calculateOrder();
        }
    });
}

// ================= DISTRICT CHANGE =================
function setupDistrictChange() {
    const districtSelect = document.getElementById("deliverydistrict");
    districtSelect.addEventListener("change", calculateOrder);
}

// ================= OFFER FUNCTIONS =================
function enableOffer() {
    offerActive = true;
    calculateOrder();
}
function disableOffer() {
    offerActive = false;
    calculateOrder();
}
window.enableOffer = enableOffer;
window.disableOffer = disableOffer;

// ================= MODAL OPEN/CLOSE & ORDER =================
function setupModal() {
    const WHATSAPP_NUMBER = ENV.WHATSAPP_NUMBER;
    const modal = document.getElementById("orderModal");
    const modalOpenBtns = document.querySelectorAll('.btn-order, .btn-order-sm, .btn-order-lg');

    modalOpenBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (!modal) return;
            modal.classList.add('show');
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            GAAddToCartEvent({ id: productID, name: productName, discount_price: productUnitPrice });
        });
    });

    if (modal) {
        // Close modal click outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
                modal.style.display = 'none';
                document.body.style.overflow = '';
            }
        });



        const product_details_for_event_send = function getProductJsonForEventSend(){
            const qtyInput = modal.querySelector('#modalQuantity').value;
            const contents = [];
            contents.push({
                id: productID,
                name: productName,
                quantity: qtyInput,
                price: productUnitPrice,
            });
            return contents;
        };

        // Confirm Order button with backend save
        modal.addEventListener('click', async (e) => {
            if (e.target && e.target.matches('.btn-order-lg')) {
                e.preventDefault();

                if (e.target.disabled) return;   
                e.target.disabled = true;

                const nameInput = modal.querySelector('#orderName');
                const numberInput = modal.querySelector('#orderPhoneNumber');
                const whatsappInput = modal.querySelector('#orderWhatsappNumber');
                const addressInput = modal.querySelector('#orderAddress');
                const districtSelect = modal.querySelector('#deliverydistrict');
                const noteInput = modal.querySelector('#orderNote');
                const qtyInput = modal.querySelector('#modalQuantity');

                // ===== STOCK CHECK =====
                const qty = Number(qtyInput.value || 1);
                if (qty > productInventory) {
                    const modalContent = modal.querySelector('.modal-content');
                    modalContent.innerHTML = `
                        <div style="text-align:center; padding:30px 20px; background:#fff; border-radius:20px;">
                            <h2>দুঃখিত!</h2>
                            <p>স্টক শেষ। পরে আবার চেষ্টা করুন।</p>
                        </div>
                    `;
                    return; // stop further order processing
                }
                
                [nameInput, numberInput, addressInput].forEach(f => f.style.border = '');

                if (!nameInput.value.trim()) { alert("দয়া করে আপনার নাম লিখুন।"); nameInput.style.border = '2px solid red'; nameInput.focus(); return; }
                if (!numberInput.value.trim()) { alert("দয়া করে মোবাইল নাম্বার লিখুন।"); numberInput.style.border = '2px solid red'; numberInput.focus(); return; }
                if (!isValidBDPhone(numberInput.value.trim())) {alert("দয়া করে সঠিক মোবাইল নম্বর লিখুন! (01XXXXXXXXX / 8801XXXXXXXXX / +8801XXXXXXXXX)");numberInput.style.border = '2px solid red';numberInput.focus();return;}
                if (whatsappInput.value.trim() && !isValidBDPhone(whatsappInput.value.trim())) {alert("দয়া করে সঠিক WhatsApp নম্বর লিখুন!");whatsappInput.style.border = '2px solid red';whatsappInput.focus();return; }
                if (!addressInput.value.trim()) { alert("দয়া করে ঠিকানা লিখুন।"); addressInput.style.border = '2px solid red'; addressInput.focus(); return; }
                if (!districtSelect.value) { alert("দয়া করে জেলা নির্বাচন করুন।"); districtSelect.style.border = '2px solid red'; districtSelect.focus(); return; }

                const subtotal = productUnitPrice * Number(qtyInput.value);
                let discount = 0;
                if (offerActive) {
                    if (qtyInput.value == 2) discount = Math.round(subtotal * 0.10);
                    else if (qtyInput.value == 3) discount = Math.round(subtotal * 0.20);
                    else if (qtyInput.value >= 4) discount = Math.round(subtotal * 0.30);
                }

                const delivery = (Number(qtyInput.value) >= 4 && offerActive) ? 0 : calculateDeliveryCharge(districtSelect.value);

                // backend compatible total
                const total = subtotal + delivery;

                // frontend display/event total
                const displayTotal = subtotal - discount + delivery;

                // GAInitiateCheckoutEvent(product_details_for_event_send(), total);
                GAInitiateCheckoutEvent(product_details_for_event_send(), displayTotal);

                function getCustomerJSON() {
                    customer_details = {
                        name: nameInput.value.trim(),
                        phone: numberInput.value.trim(),
                        address: addressInput.value.trim(),
                        district: districtSelect.value,
                        note: noteInput.value.trim()
                    }
                    return customer_details
                }

                const customerData = getCustomerJSON();

                const payload = {

                    customer: {
                        name: customerData.name,
                        phone: customerData.phone,
                        district: customerData.district,
                        address: customerData.address,
                    },

                    products: [
                        {
                            product_type: "MAIN",
                            id: productID,
                            name: productName,
                            price: productUnitPrice,
                            quantity: Number(qtyInput.value),
                            total_amount: subtotal
                        }
                    ],

                    amount: {
                        productTotal: subtotal,
                        deliveryCharge: delivery,
                        totalAmount: total,
                    },

                    note: noteInput.value.trim(),
                    otp_required: false,
                    ...window.getAttributionData(),
                };

                function handleOrderSuccess() {
                    GAInitiatePurchaseEvent(product_details_for_event_send(), displayTotal, null, customerData);

                    // Success UI
                    const modalContent = modal.querySelector('.modal-content');
                    modalContent.innerHTML = `
                        <div style="text-align:center; padding:30px 20px; background:#fff; border-radius:20px;">
                            <h2>ধন্যবাদ!</h2>
                            <p>আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে।</p>
                            <p>হোমপেজে রিডিরেক্ট হবে <span id="countdown">5</span> সেকেন্ডে...</p>
                            <a href="https://wa.me/${WHATSAPP_NUMBER}" target="_blank" class="btn btn-primary" style="margin-top:20px; display:inline-block;">Contact with WhatsApp</a>
                        </div>
                    `;

                    document.body.style.overflow = 'hidden';

                    let countdown = 5;
                    const countdownEl = document.getElementById("countdown");
                    const interval = setInterval(() => {
                        countdown -= 1;
                        countdownEl.textContent = countdown;
                        if (countdown <= 0) {
                            clearInterval(interval);
                            window.location.href = "/";
                        }
                    }, 1000);
                }

                // POST to backend
                try {
                    // const response = await fetch(`${ENV.API_BASE_URL}/site/api/landing/order/`, {
                    const response = await fetch(`${ENV.API_BASE_URL}/site/api/create-order/`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    const result = await response.json();

                    if (result.success) {
                        handleOrderSuccess();
                    } else if (result.otp_required) {
                        e.target.disabled = false;
                        e.target.innerText = "Confirm Order (COD)";
                        showOtpVerifyModal({
                            phone: result.phone || customerData.phone,
                            message: result.message,
                            apiBase: ENV.API_BASE_URL,
                            orderEndpoint: "/site/api/create-order/",
                            orderPayload: payload,
                            onSuccess: function () {
                                handleOrderSuccess();
                            }
                        });
                    } else {
                        throw new Error(result.message || 'Order failed');
                    }

                } catch (err) {
                    alert("Order failed. Please try again.");
                    console.log("Order API error:", err);
                    e.target.disabled = false;
                    e.target.innerText = "Confirm Order (COD)";
                }
            }
        });
    }
}

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
    loadProduct();
    loadDistricts();
    setupQuantityButtons();
    setupDistrictChange();
    setupModal();
    calculateOrder(); // initial
});


