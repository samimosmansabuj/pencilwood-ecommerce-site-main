function isMandatoryOtpEnabled() {
        return !!document.getElementById("sendOtpBtn");
}

window.__CURRENT_LANDING_CODE__ = ENV.PRODUCT_LANDING_PAGE_ID;

(async function () {
    const errorUI = document.getElementById("productError");
    const pageContent = document.getElementById("pageContent");
    if (pageContent) pageContent.style.display = "none";
    if (errorUI) errorUI.classList.add("hidden");

    try {
        const response = await fetch(`${ENV.API_BASE_URL}/site/api/landing-page/${ENV.PRODUCT_LANDING_PAGE_ID}/`);
        const response_data = await response.json()

        if (response_data.status && response_data.data?.product?.length) {
            const data = response_data.data.product[0]

            document.getElementById("header-image").src = data.images[0].image;
            document.querySelectorAll(".product-old-price").forEach(el => {
                el.textContent = toBanglaNumber(Math.floor(data.price));
            });
            document.querySelectorAll(".product-new-price").forEach(el => {
                el.textContent = toBanglaNumber(Math.floor(data.discount_price));
            })

            GAViewItemEvent(data);

            if (errorUI) errorUI.classList.add("hidden");
            if (pageContent) pageContent.style.display = "block";
        }else {
            throw new Error("Invalid product response");
            if (pageContent) pageContent.style.display = "none";
            if (errorUI) errorUI.classList.remove("hidden");
        }
    } catch (e) {
        if (pageContent) pageContent.style.display = "none";
        if (errorUI) errorUI.classList.remove("hidden");
        setTimeout(() => {
            location.reload();
        }, 5000);
    }
})();

let appliedCouponDiscount = 0;
let appliedCouponCode = null;
let rememberedCouponCode = null;
let couponRequestSeq = 0;
let couponCheckedSignature = "";

function getCouponItems() {
    const items = [];
    document.querySelectorAll("#productSummary .summary-row").forEach(function (row) {
        if (row.dataset.productType !== "MAIN") return;
        const id = parseInt(row.dataset.productId, 10);
        const qty = parseInt(row.querySelector(".qty")?.textContent, 10) || 0;
        if (id && qty > 0) items.push({ product_id: id, quantity: qty });
    });
    return items;
}

function couponSignature() {
    const phone = (document.getElementById("phone")?.value || "").trim();
    return JSON.stringify(getCouponItems()) + "|" + phone;
}

function clearAppliedCoupon() {
    appliedCouponDiscount = 0;
    appliedCouponCode = null;
}

async function applyCoupon(code, silent) {
    const messageEl = document.getElementById("couponMessage");
    const phone = (document.getElementById("phone")?.value || "").trim();
    const items = getCouponItems();

    if (!code) {
        if (!silent) {
            rememberedCouponCode = null;
            clearAppliedCoupon();
            couponCheckedSignature = "";
            messageEl.innerHTML = '<span style="color:red;">Enter a coupon code</span>';
            recalculateSummaryWithCoupon();
        }
        return;
    }
    if (!phone || !items.length) {
        clearAppliedCoupon();
        couponCheckedSignature = couponSignature();
        messageEl.innerHTML = '<span style="color:red;">' +
            (!phone ? "Enter your phone number first" : "Select a product first") + '</span>';
        recalculateSummaryWithCoupon();
        return;
    }

    const seq = ++couponRequestSeq;
    const signature = couponSignature();

    try {
        const res = await fetch(`${ENV.API_BASE_URL}/site/api/apply-coupon/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                code: code,
                phone: phone,
                items: items,
                landing_page_code: ENV.PRODUCT_LANDING_PAGE_ID,
            }),
        });
        const data = await res.json();
        if (seq !== couponRequestSeq) return;

        couponCheckedSignature = signature;
        if (data.status) {
            appliedCouponDiscount = Number(data.data.discount_amount) || 0;
            appliedCouponCode = data.data.code;
            rememberedCouponCode = data.data.code;
            messageEl.innerHTML = `<span style="color:green;">✓ Coupon applied: -৳${appliedCouponDiscount}</span>`;
        } else {
            clearAppliedCoupon();
            messageEl.innerHTML = `<span style="color:red;">${data.message}</span>`;
        }
    } catch (err) {
        if (seq !== couponRequestSeq) return;
        clearAppliedCoupon();
        couponCheckedSignature = "";
        messageEl.innerHTML = '<span style="color:red;">Something went wrong. Try again.</span>';
    }
    recalculateSummaryWithCoupon();
}

function refreshCouponIfApplied() {
    if (!rememberedCouponCode) return;
    if (couponSignature() === couponCheckedSignature) return;   // nothing relevant changed
    clearAppliedCoupon();                                       // hide the old discount until re-checked
    recalculateSummaryWithCoupon();
    applyCoupon(rememberedCouponCode, true);
}

document.getElementById("applyCouponBtn")?.addEventListener("click", function () {
    const code = (document.getElementById("couponCodeInput")?.value || "").trim();
    applyCoupon(code, false);
});
document.getElementById("phone")?.addEventListener("change", refreshCouponIfApplied);

function recalculateSummaryWithCoupon() {
    const productTotalEl = document.getElementById("productTotal");
    const deliveryChargeEl = document.getElementById("summaryDelivery");
    const summaryTotalEl = document.getElementById("summaryTotal");

    const productTotal = parseFloat(productTotalEl.textContent || 0);
    const deliveryCharge = parseFloat(deliveryChargeEl.textContent || 0);

    summaryTotalEl.innerText = (productTotal + deliveryCharge - appliedCouponDiscount).toFixed(0);
}

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


const headerImage = document.getElementById('header-image');
const galleryImages = document.querySelectorAll('.gallery-image');
galleryImages.forEach(img => {
    img.addEventListener('click', () => {
        header_image = headerImage.src;
        gallery_image = img.src;
        headerImage.src = img.src;
        img.src = header_image;
    });
});



// *** District List Fetch ***
const districtSelect = document.getElementById("deliverydistrict");
if (districtSelect) {
    fetch('https://bdapi.vercel.app/api/v.1/district').then(response => response.json()).then(data => {
        if (data.status === 200 && data.success) {
            data.data.forEach(district => {
                const option = document.createElement('option')
                option.value = district.name.toLowerCase()
                option.setAttribute('district_id', district.id);
                option.textContent = district.bn_name
                districtSelect.appendChild(option)
            });
        }
    })
        .catch(error => console.log('Error fetching district:', error))
}
// districtSelect.addEventListener("change", function(){
//     const district = this.value;
//     if (!district) return;
//     // fetchDeliveryCharge({ district });
// })




// Order Form Modal Open & Close Script Start=================================
const openBtns = document.querySelectorAll('.openOrderModal');
const modal = document.getElementById('orderModal');
const closeBtn = document.querySelector('.close-btn');

const apiFetch = async (url, { method = 'GET', body, headers = {} } = {}) =>
    await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...headers },
        body: body ? JSON.stringify(body) : undefined
    })
        .then(r => r.ok ? r.json() : Promise.reject(r))
        .catch(err => { console.log('API error:', err); return null; });


let products = [];

openBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
        // Fetch products
        const data = await apiFetch(`${ENV.API_BASE_URL}/site/api/landing-page/${ENV.PRODUCT_LANDING_PAGE_ID}/`);
        if (!data || !data.data || !data.data.product) {
            console.warn("Could not load products for order modal");
            return;
        }
        products = data.data.product

        GAAddToCartEvent(products[0]);

        // Create Grid
        const grid = document.getElementById("productCardGrid");
        if (!grid) return;
        grid.innerHTML = "";

        // Render products dynamically
        products.forEach((product, index) => {
            const card = document.createElement("div");
            card.className = `product-card selectable ${index === 0 ? "active" : ""}`;
            card.dataset.type = product.name;

            card.innerHTML = `
                <div class="card-info">
                    <p hidden class="product-id">${product.id}</p>
                    <h4>${product.name}</h4>
                    <p>৳ <del>${toBanglaNumber(product.price)}</del> <span class="unit-price" style="font-weight: bold;">${toBanglaNumber(product.discount_price)}</span></p>
                </div>
                <div class="qty-control">
                    <button type="button" class="qty-btn minus" data-product-id="${product.id}">−</button>
                    <span class="qty-value" id="${product.id}Qty" name="${product.id}Qty" min="0">${index === 0 ? "1" : "0"}</span>
                    <button type="button" class="qty-btn plus" data-product-id="${product.id}">+</button>
                </div>
            `;
            grid.appendChild(card);
        });

        // Initialize quantities and summary
        setupModalProducts(products);


        // ----- PIXEL ADD TO CART SETUP -----
        const productPrice = document.getElementById("productPrice");
        if (productPrice) {
            const content_ids = [String(productPrice.dataset.productId)];
            const content_name = "Cradle - Baby Product";
            const contentValue = parseFloat(toEnglishNumber(productPrice.textContent || 0));
        }

        // Show modal
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    });
});




function getProductDeliveryCharge(product, district) {
    const dc = product.delivery_charge;
    if (!dc) {
        return district === "dhaka" ? 80 : 120;
    }
    if (dc.area_and_charge?.all !== undefined) {
        return dc.area_and_charge.all;
    }
    if (dc.all !== undefined) {
        return dc.all;
    }

    // Area-set priority order
    const areaSets = ["area-set-1", "area-set-2", "area-set-3"];
    const area_and_charge = dc.area_and_charge || {};
    for (const key of areaSets) {
        if (!area_and_charge[key]) continue;

        const { area, charge } = area_and_charge[key];
        if (
            area.includes("all") ||
            area.includes(district)
        ) {
            return charge;
        }
    }
    return district === "dhaka" ? 80 : 120;
}
function calculateDeliveryChargeFromSummary(district, quantities) {
    let highestCharge = 0;
    products.forEach(product => {
        const qty = quantities[product.id] || 0;
        if (qty > 0) {
            const charge = getProductDeliveryCharge(product, district);
            highestCharge = Math.max(highestCharge, charge);
        }
    });
    return highestCharge;
}

function setupModalProducts() {
    // ---------- Summary Elements ----------
    const productSummary = document.getElementById("productSummary");
    const productTotalEl = document.getElementById("productTotal");
    const summaryTotalEl = document.getElementById("summaryTotal");
    const deliveryChargeEl = document.getElementById("summaryDelivery");
    const districtSelectEl = document.getElementById("deliverydistrict");

    if (!productSummary || !productTotalEl || !summaryTotalEl || !deliveryChargeEl || !districtSelectEl) {
        console.warn("Order summary elements missing; skipping modal setup.");
        return;
    }

    // Initialize quantities
    let quantities = {};
    products.forEach((product, index) => {
        quantities[product.id] = index === 0 ? 1 : 0;
    });


    // DELIVERY CHARGE CALCULATE 
    let deliveryCharge = calculateDeliveryChargeFromSummary(
        districtSelectEl.value, quantities
    );
    deliveryChargeEl.innerText = deliveryCharge;
    districtSelectEl.addEventListener("change", function () {
        deliveryCharge = calculateDeliveryChargeFromSummary(this.value, quantities);
        deliveryChargeEl.innerText = deliveryCharge;
        updateSummary();
    });


    // Setup qty buttons
    products.forEach(product => {
        const card = document.querySelector(`.product-card[data-type='${product.name}']`);
        if (!card) return;
        const minusBtn = card.querySelector(".minus");
        const plusBtn = card.querySelector(".plus");
        const qtyEl = card.querySelector(".qty-value");
        if (!minusBtn || !plusBtn || !qtyEl) return;

        minusBtn.addEventListener("click", () => {
            if (quantities[product.id] > 0) quantities[product.id]--;
            qtyEl.innerText = quantities[product.id];
            if (quantities[product.id] === 0) card.classList.remove("active");
            updateSummary();
        });

        plusBtn.addEventListener("click", () => {
            quantities[product.id]++;
            qtyEl.innerText = quantities[product.id];
            card.classList.add("active");
            updateSummary();
        });
    });

    function updateSummary() {
        productSummary.innerHTML = "";
        let productTotal = 0;

        products.forEach(product => {
            const qty = quantities[product.id];
            if (qty > 0) {
                // --- Main product ---
                if (product.id === undefined || product.id === null) {
                    console.warn("Skipping main product row with invalid id:", product);
                    return;
                }
                const total_amount = qty * product.discount_price;
                productTotal += total_amount;
                productSummary.appendChild(createRow(product.name, product.id, qty, product.discount_price, total_amount, "MAIN"));

                // --- Gift products ---
                const gift_products = product.gift_product || [];
                gift_products.forEach(gift => {
                    const giftProd = gift.gift_product;

                    if (!giftProd || giftProd.id === undefined || giftProd.id === null) {
                        console.warn("Skipping malformed gift product row:", gift);
                        return;
                    }

                    let giftUnitPrice = giftProd.discount_price;

                    // Apply gift_type discount
                    if (gift.gift_type === "FREE") {
                        giftUnitPrice = 0;
                    } else if (gift.gift_type === "FLAT") {
                        giftUnitPrice -= gift.value; // subtract flat discount
                        if (giftUnitPrice < 0) giftUnitPrice = 0;
                    } else if (gift.gift_type === "PERCENTAGE") {
                        giftUnitPrice = giftUnitPrice * (1 - gift.value / 100);
                    }

                    const giftTotal = giftUnitPrice * qty; // multiply by parent product qty
                    productTotal += giftTotal;

                    // Add row to summary
                    let giftTitle = giftProd.name;
                    if (gift.gift_type === "FREE") giftTitle += " (FREE)";
                    else if (gift.gift_type === "FLAT") giftTitle += ` (−৳${gift.value})`;
                    else if (gift.gift_type === "PERCENTAGE") giftTitle += ` (${gift.value}% OFF)`;

                    productSummary.appendChild(
                        createRow(giftTitle, giftProd.id, qty, giftUnitPrice, giftTotal, "FREE", product.id)
                    );
                });
            }
        });

        deliveryCharge = calculateDeliveryChargeFromSummary(
            districtSelectEl.value,
            quantities
        );
        deliveryChargeEl.innerText = deliveryCharge;

        productTotalEl.innerText = productTotal;
        summaryTotalEl.innerText = productTotal + deliveryCharge - appliedCouponDiscount;
        refreshCouponIfApplied();
    }

    function createRow(title, product_id, qty, unit_amount, total_amount, product_type, reference_id = null) {
        const row = document.createElement("div");
        row.className = "summary-row";
        row.dataset.productId = product_id;
        row.dataset.referenceId = reference_id === null || reference_id === undefined ? "" : reference_id;
        row.dataset.productType = product_type;
        row.dataset.productUnitPrice = unit_amount;
        row.innerHTML = `
            <span class="product_name">${title}</span>
            <div class="right-meta">
                <span class="qty-wrap">x <span class="qty">${qty}</span></span>
                <span class="price">৳ <span class="total_amount">${total_amount}</span></span>
            </div>
        `;
        return row;
    }

    updateSummary();
}


if (closeBtn) {
    closeBtn.addEventListener('click', () => {
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}
let lockModal = false;
if (modal) {
    modal.addEventListener('click', (e) => {
        if (lockModal) return;
        if (e.target === modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}


function OrderCompleteCard(bill) {
    const billHtml = (window.OrderBill && OrderBill.html(bill)) || "";

    const thankYouCard = document.createElement("div");
    thankYouCard.style.textAlign = "center";
    thankYouCard.style.padding = "30px 20px";
    thankYouCard.style.background = "#fff";
    thankYouCard.style.borderRadius = "20px";
    thankYouCard.style.boxShadow = "0 10px 30px rgba(0,0,0,0.1)";
    thankYouCard.style.maxHeight = "90vh";
    thankYouCard.style.overflowY = "auto";
    thankYouCard.innerHTML = `
        ${billHtml || `<h2>ধন্যবাদ!</h2>
        <p>আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে।</p>`}
        <p style="margin-top:14px;">হোমপেজে রিডিরেক্ট হবে <span id="countdown">10</span> সেকেন্ডে...</p>
        <a href="https://wa.me/${ENV.WHATSAPP_NUMBER}" target="_blank" class="btn btn-primary" 
        style="margin-top: 10px; display: inline-block;">
        Contact with WhatsApp
        </a>
    `;

    return thankYouCard;
}

// Order Submit Script Start =================================================

const orderForm = document.getElementById("orderForm");
if (orderForm) {
    orderForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        
        if (!orderForm.checkValidity()) {
            orderForm.reportValidity();
            return;
        }

        const modalContent = document.querySelector(".modal-content");
        const loader = document.getElementById("pageLoader");
        const submitBtn = document.getElementById("submitBtn");
        if (loader) loader.classList.remove("hidden");
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="loading loading-spinner loading-sm"></span> প্রসেসিং...';
        }


        function getProductJSON() {
            const productSummary = document.getElementById("productSummary");
            if (!productSummary) return [];
            const allRows = productSummary.querySelectorAll(".summary-row");
            const contents = [];
            allRows.forEach(row => {
                const product_id = row.dataset.productId;
                if (!product_id || product_id === "undefined" || product_id === "null") {
                    console.warn("Skipping row with invalid product_id:", row);
                    return;
                }
                const product_type = row.dataset.productType;
                const reference_id = row.dataset.referenceId;
                const product_unit_price = row.dataset.productUnitPrice;
                const product_title = row.querySelector(".product_name")?.textContent.trim() || "";
                const qty = Number(row.querySelector(".qty")?.textContent) || 0;
                const total_amount = parseFloat(row.querySelector(".total_amount")?.textContent) || 0;
                contents.push({
                    product_type: product_type,
                    reference_product: reference_id,
                    id: product_id,
                    name: product_title,
                    price: product_unit_price,
                    quantity: qty,
                    total_amount: total_amount
                });
            });
            return contents;
        }
        function getCustomerJSON() {
            const nameEl = document.getElementById("name");
            const phoneEl = document.getElementById("phone");
            const districtEl = document.getElementById("deliverydistrict");
            const addressEl = document.getElementById("address");
            return {
                name: nameEl ? nameEl.value.trim() : "",
                phone: phoneEl ? phoneEl.value.trim() : "",
                district: districtEl ? districtEl.value.trim() : "",
                address: addressEl ? addressEl.value.trim() : "",
            }
        }
        const customerData = getCustomerJSON();
        function getAmountJSON() {
            const productTotalEl = document.getElementById("productTotal");
            const summaryDeliveryEl = document.getElementById("summaryDelivery");
            const summaryTotalEl = document.getElementById('summaryTotal');
            return {
                productTotal: parseFloat(productTotalEl ? productTotalEl.textContent : 0),
                deliveryCharge: Number(summaryDeliveryEl ? summaryDeliveryEl.textContent : 0),
                totalAmount: parseFloat(summaryTotalEl ? summaryTotalEl.textContent : 0 || 0),
            }
        }

        function resetSubmitState() {
            if (loader) loader.classList.add("hidden");
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = "অর্ডার কনফার্ম করুন";
            }
        }

        // temporary OTP OFF — frontend now assumes OTP verified via /verify-otp/ before order submit,
        // or is simply not required (otp_required: false below).

        if (!customerData.name || !customerData.phone || !customerData.district || !customerData.address) {
            alert("অনুগ্রহ করে সমস্ত গ্রাহক তথ্য পূরণ করুন।");
            resetSubmitState();
            return;
        }
        if (!isValidBDPhoneNew(customerData.phone)) {
            alert("অনুগ্রহ করে সঠিক বাংলাদেশি মোবাইল নম্বর লিখুন!");
            resetSubmitState();
            return;
        }
        if (getProductJSON().length === 0) {
            alert("অনুগ্রহ করে অন্তত একটি পণ্য নির্বাচন করুন।");
            resetSubmitState();
            return;
        }
        if (getAmountJSON().totalAmount <= 0) {
            alert("অবৈধ অর্ডার পরিমাণ। দয়া করে পণ্য এবং পরিমাণ পরীক্ষা করুন।");
            resetSubmitState();
            return;
        }

        // ----- PIXEL INITIATE CHECKOUT SETUP -----
        const product_details_for_event_send = function getProductJsonForEventSend() {
            const productSummary = document.getElementById("productSummary");
            if (!productSummary) return [];
            const allRows = productSummary.querySelectorAll(".summary-row");
            const contents = [];
            allRows.forEach(row => {
                const product_id = row.dataset.productId;
                const product_unit_price = row.dataset.productUnitPrice;
                const product_title = row.querySelector(".product_name")?.textContent.trim() || "";
                const qty = Number(row.querySelector(".qty")?.textContent) || 0;
                contents.push({
                    id: product_id,
                    name: product_title,
                    quantity: qty,
                    price: product_unit_price,
                });
            });
            return contents;
        };
        const summaryTotalElFinal = document.getElementById('summaryTotal');
        const summaryTotal = parseFloat(summaryTotalElFinal ? summaryTotalElFinal.textContent : 0 || 0);
        GAInitiateCheckoutEvent(product_details_for_event_send(), summaryTotal);

        const noteEl = document.getElementById("note");
        const formData = {
            customer: customerData,
            products: getProductJSON(),
            amount: getAmountJSON(),
            note: noteEl ? (noteEl.value.trim() || "No Note Is Provided From Client") : "No Note Is Provided From Client",
            otp_required: false,
            coupon_code: appliedCouponCode,
            landing_page_code: ENV.PRODUCT_LANDING_PAGE_ID,
            ...window.getAttributionData(),
        };

        await new Promise(resolve => setTimeout(resolve, 2000));

        function handleOrderSuccess(bill) {
            // ----- PIXEL PURCHASE SETUP -----
            GAInitiatePurchaseEvent(product_details_for_event_send(), summaryTotal, null, customerData);

            lockModal = true;
            if (modalContent) {
                modalContent.innerHTML = "";
                modalContent.appendChild(OrderCompleteCard(bill));
            }
            if (loader) loader.classList.add("hidden");
            document.body.style.overflow = 'hidden';

            let countdown = 10;
            const countdownEl = document.getElementById("countdown");
            const interval = setInterval(() => {
                countdown -= 1;
                if (countdownEl) countdownEl.textContent = countdown;
                if (countdown <= 0) {
                    clearInterval(interval);
                    window.location.href = "/";
                }
            }, 1000);
        }

        try {
            const response = await fetch(`${ENV.API_BASE_URL}/site/api/create-order/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                handleOrderSuccess(data.bill);
            } else if (data.otp_required && !isMandatoryOtpEnabled()) {
                resetSubmitState();
                showOtpVerifyModal({
                    phone: data.phone || customerData.phone,
                    message: data.message,
                    apiBase: ENV.API_BASE_URL,
                    orderEndpoint: "/site/api/create-order/",
                    orderPayload: formData,
                    onSuccess: function (successData) {
                        handleOrderSuccess(successData && successData.bill);
                    }
                });
            } else if (data.blocked) {
                resetSubmitState();
                showBlockedMessageModal(data.message);
            } else {
                alert("অর্ডার সাবমিট করতে সমস্যা হয়েছে! দয়া করে আবার চেষ্টা করুন।\n" + (data.message || ""));
                resetSubmitState();
            }
        } catch (err) {
            console.log("অর্ডার সাবমিট করতে সমস্যা হয়েছে! দয়া করে আবার চেষ্টা করুন।\n" + err.message);
            resetSubmitState();
        }
    });
}
// Order Submit Script End =================================================


// Order Form Modal Open & Close Script End=================================