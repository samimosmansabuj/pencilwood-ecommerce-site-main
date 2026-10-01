let PRODUCT_DATA = null;
window.__CURRENT_LANDING_CODE__ = ENV.PRODUCT_LANDING_PAGE_ID;

// =========================
// Frontend Images
// =========================
const HERO_IMAGE = "/lan/masala-dani/images/smart-masala-dani-hero.webp";
const GALLERY_IMAGES = [
    "/lan/masala-dani/images/gallery-1.webp",
    "/lan/masala-dani/images/gallery-2.webp",
    "/lan/masala-dani/images/gallery-3.webp",
    "/lan/masala-dani/images/gallery-4.webp",
    "/lan/masala-dani/images/gallery-5.webp",
    "/lan/masala-dani/images/gallery-6.webp"
];

// =========================
// Utility Functions
// =========================
function toBanglaNumber(number) {
    const eng = "0123456789";
    const bang = "০১২৩৪৫৬৭৮৯";

    return number.toString().split("").map(d =>
        bang[eng.indexOf(d)] || d
    ).join("");
}

function toEnglishNumber(number) {
    const bang = "০১২৩৪৫৬৭৮৯";
    const eng = "0123456789";

    return number.toString().split("").map(d =>
        eng[bang.indexOf(d)] || d
    ).join("");
}

function isValidBDPhoneNew(phone) {
    phone = toEnglishNumber(phone);

    const regex = /^(?:\+8801|8801|01)[3-9]\d{8}$/;
    return regex.test(phone);
}

// =========================
// Product Fetch
// =========================
function showProductError() {
    if (document.getElementById("productError")) return;
    document.body.innerHTML = "";
    const div = document.createElement("div");
    div.id = "productError";
    div.className = "product-error";

    div.innerHTML = `
        <div class="error-box">
            <div class="spinner-ring"></div>
            <h2>Loading product</h2>
            <p>We are connecting to server...</p>
            <div class="sub-text">
                Retrying automatically...
            </div>
        </div>
    `;
    document.body.appendChild(div);
}

(async function () {
    document.getElementById("main_content").style.display = "none";
    try {
        const response = await fetch(
            `${ENV.API_BASE_URL}/site/api/landing-page/${ENV.PRODUCT_LANDING_PAGE_ID}/`
        );
        const response_data = await response.json();

        if (response_data.status) {
            document.getElementById("main_content").style.display = "block";
            PRODUCT_DATA = response_data.data.product[0];
            PRODUCT_DATA["productTitle"] = response_data.data.title
            setupProductData();
            setupGallery();
            updateSummary();
        } else {
            showProductError();
        }

    } catch (e) {
        showProductError();
    }
})();

function setupProductData() {
    GAViewItemEvent(PRODUCT_DATA);

    document.getElementById("productTitle").textContent = PRODUCT_DATA.productTitle;

    if (PRODUCT_DATA.short_description) {
        document.getElementById("productDescription").innerHTML = PRODUCT_DATA.short_description;

    }

    // Frontend Hero Image
    document.getElementById("heroImage").src = HERO_IMAGE;

    document.querySelectorAll(".product-old-price")
        .forEach(el => {
            el.textContent = `${toBanglaNumber(Math.floor(PRODUCT_DATA.price))} ৳`;

        });

    document.querySelectorAll(".product-new-price")
        .forEach(el => {

            el.textContent = `${toBanglaNumber(Math.floor(PRODUCT_DATA.discount_price))} ৳`;

        });

}

// =========================
// Gallery
// =========================

function setupGallery() {

    const gallery =
        document.getElementById("galleryGrid");

    gallery.innerHTML = "";

    GALLERY_IMAGES.forEach(image => {

        const img =
            document.createElement("img");

        img.src = image;

        img.addEventListener("click", () => {

            document.getElementById("heroImage").src =
                image;

        });

        gallery.appendChild(img);

    });

}

// =========================
// District Fetch
// =========================

const districtSelect = document.getElementById("deliverydistrict");
fetch('https://bdapi.vercel.app/api/v.1/district')
    .then(response => response.json())
    .then(data => {

        if (data.status === 200 && data.success) {

            data.data.forEach(district => {

                const option =
                    document.createElement('option');

                option.value =
                    district.name.toLowerCase();

                option.textContent =
                    district.bn_name;

                districtSelect.appendChild(option);

            });

        }

    })
    .catch(error =>
        console.log('District fetch error:', error));

// =========================
// Delivery Charge
// =========================

function getProductDeliveryCharge(product, district) {
    const dc = product.delivery_charge;
    if (!dc) {
        return district === "dhaka"
            ? 80
            : 120;
    }
    if (dc.area_and_charge?.all !== undefined) {
        return dc.area_and_charge.all;
    }
    if (dc.all !== undefined) {
        return dc.all;
    }
    const areaSets = ["area-set-1", "area-set-2", "area-set-3"];
    const area_and_charge = dc.area_and_charge;
    for (const key of areaSets) {
        if (!area_and_charge[key]) continue;
        const { area, charge } =
            area_and_charge[key];
        if (
            area.includes("all") ||
            area.includes(district)
        ) {
            return charge;
        }
    }

    return district === "dhaka"
        ? 80
        : 120;

}

// =========================
// Price Update
// =========================

const quantity = document.getElementById('quantity');

quantity.addEventListener('change', () => {
    updateSummary();
});

districtSelect.addEventListener("change", () => {
    updateSummary();
});

function updateSummary() {
    if (!PRODUCT_DATA) return;
    const qty = Number(quantity.value);

    const productTotal = qty * PRODUCT_DATA.discount_price;

    const deliveryCharge =
        getProductDeliveryCharge(
            PRODUCT_DATA,
            districtSelect.value
        );

    const summaryTotal =
        productTotal + deliveryCharge;

    document.getElementById("productTotal").innerText =
        toBanglaNumber(productTotal) + "৳";

    document.getElementById("summaryDelivery").innerText =
        toBanglaNumber(deliveryCharge) + "৳";

    document.getElementById("summaryTotal").innerText =
        toBanglaNumber(summaryTotal) + "৳";

    const inside = 80;
    const outside = 120;

    document.getElementById("deliveryNote").innerText =
        `ঢাকার ভিতরে ${toBanglaNumber(inside)}৳ / ঢাকার বাইরে ${toBanglaNumber(outside)}৳`;

}

// =========================
// FAQ
// =========================

const faqQuestions =
    document.querySelectorAll('.faq-question');

faqQuestions.forEach(item => {

    item.addEventListener('click', () => {

        const answer =
            item.nextElementSibling;

        answer.style.display =
            answer.style.display === 'block'
                ? 'none'
                : 'block';

    });

});

// REPLACE ONLY THIS PART

const faqToggleBtn = document.getElementById("faqToggleBtn");
const faqText = document.getElementById("faqText");
const faqIcon = document.getElementById("faqIcon");
const moreFaqs = document.getElementById("moreFaqs");

let expanded = false;

faqToggleBtn.addEventListener("click", () => {

  expanded = !expanded;

  if (expanded) {
    moreFaqs.style.display = "block";

    faqText.textContent = "Hide Questions";

    faqIcon.innerHTML = `
      <path d="M17.94 17.94C16.16 19.23 14.11 20 12 20 5 20 1 12 1 12a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-4.17 5.13M1 1l22 22"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    `;

  } else {
    moreFaqs.style.display = "none";

    faqText.textContent = "View All Questions";

    faqIcon.innerHTML = `
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="12" cy="12" r="3"
        stroke="currentColor" stroke-width="2"/>
    `;
  }

});
// =========================
// Countdown
// =========================

let time = 21599;

const timer =
    document.getElementById('timer');

setInterval(() => {

    let hours =
        Math.floor(time / 3600);

    let minutes =
        Math.floor((time % 3600) / 60);

    let seconds =
        time % 60;

    timer.innerHTML =
        `${hours}:${minutes}:${seconds}`;

    time--;

}, 1000);

// =========================
// Exit Popup
// =========================

document.addEventListener('mouseleave', () => {

    const popup =
        document.getElementById('popup');

    if (popup) {
        popup.style.display = 'flex';
    }

});

function closePopup() {
    const popup =
        document.getElementById('popup');

    if (popup) {
        popup.style.display = 'none';
    }

}


// =========================
// Order Submit
// =========================
function getTotalAmount(){
    const qty = Number(quantity.value);
    const deliveryCharge = getProductDeliveryCharge(PRODUCT_DATA, districtSelect.value);
    const productTotal = qty * PRODUCT_DATA.discount_price;
    return productTotal + deliveryCharge
}

function getProductJsonForEventSend(){
    const qtyInput = Number(quantity.value);
    const contents = [];
    contents.push({
        id: PRODUCT_DATA.id,
        name: PRODUCT_DATA.name,
        quantity: qtyInput,
        price: PRODUCT_DATA.discount_price,
    });
    return contents;
};


function showOrderSuccessModal() {
    document.getElementById("orderSuccessOverlay")?.remove();

    const overlay = document.createElement("div");
    overlay.id = "orderSuccessOverlay";
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.background = "rgba(0,0,0,0.6)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "9999";

    const card = document.createElement("div");
    card.style.textAlign = "center";
    card.style.padding = "35px 25px";
    card.style.background = "rgba(255,255,255,0.95)";
    card.style.borderRadius = "22px";
    card.style.boxShadow = "0 15px 40px rgba(0,0,0,0.15)";
    card.style.maxWidth = "420px";
    card.style.width = "90%";
    card.style.backdropFilter = "blur(8px)";
    card.innerHTML = `
        <div style="font-size:50px;">🎉</div>

        <h2>অর্ডার সফল হয়েছে!</h2>

        <p>আমরা আপনার অর্ডার গ্রহণ করেছি।</p>

        <div style="background:#eaffea;padding:10px;border-radius:10px;margin:10px 0;color:#1b7f2a;">
            ✔ কনফার্ম হয়েছে
        </div>

        <p>Redirect <b><span id="countdown">5</span></b> sec</p>

        <a href="https://wa.me/${ENV.WHATSAPP_NUMBER}"
        style="display:inline-block;margin-top:10px;padding:10px 15px;background:#25D366;color:#fff;border-radius:10px;text-decoration:none;">
        WhatsApp
        </a>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    let count = 5;
    const el = card.querySelector("#countdown");
    const interval = setInterval(() => {
        count--;
        el.textContent = count;
        if (count <= 0) {
            clearInterval(interval);
            window.location.href = "/";
        }
    }, 1000);
}

document.getElementById("orderForm")
    .addEventListener("submit", async function (e) {
        e.preventDefault();

        const submitBtn = document.getElementById("submitBtn");
        if (submitBtn.disabled) return;   

        submitBtn.disabled = true;
        submitBtn.innerHTML = "প্রসেসিং...";

        const customerData = {
            name: document.getElementById("name").value.trim(),
            phone: document.getElementById("phone").value.trim(),
            district: document.getElementById("deliverydistrict").value.trim(),
            address: document.getElementById("address").value.trim(),

        };

        if (
            !customerData.name ||
            !customerData.phone ||
            !customerData.district ||
            !customerData.address
        ) {

            alert("অনুগ্রহ করে সমস্ত তথ্য পূরণ করুন");

            submitBtn.disabled = false;
            submitBtn.innerHTML = "🛒 অর্ডার কনফার্ম করুন";
            return;

        }

        if (!isValidBDPhoneNew(customerData.phone)) {
            alert("সঠিক মোবাইল নাম্বার লিখুন");
            submitBtn.disabled = false;
            submitBtn.innerHTML = "🛒 অর্ডার কনফার্ম করুন";
            return;

        }

        const qty = Number(quantity.value);
        const deliveryCharge = getProductDeliveryCharge(PRODUCT_DATA, districtSelect.value);
        const productTotal = qty * PRODUCT_DATA.discount_price;
        const summaryTotal = productTotal + deliveryCharge;

        const formData = {
            customer: customerData,
            products: [{
                product_type: "MAIN",
                id: PRODUCT_DATA.id,
                name: PRODUCT_DATA.name,
                price: PRODUCT_DATA.discount_price,
                quantity: qty,
                total_amount: productTotal
            }],
            amount: {
                productTotal,
                deliveryCharge,
                totalAmount: summaryTotal,
            },
            note: document.getElementById("note")?.value.trim() || "",
            otp_required: false,
            ...window.getAttributionData(),
        };

        try {
            const response = await fetch(
                `${ENV.API_BASE_URL}/site/api/create-order/`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify(formData)
                }
            );
            const data = await response.json();
            if (data.success) {
                closeModal();
                GAInitiatePurchaseEvent(getProductJsonForEventSend(), getTotalAmount(), null, customerData);

                showOrderSuccessModal();
            } else if (data.otp_required) {
                showOtpVerifyModal({
                    phone: data.phone || formData.customer.phone,
                    message: data.message,
                    apiBase: ENV.API_BASE_URL,
                    orderEndpoint: "/site/api/create-order/",
                    orderPayload: formData,
                    onSuccess: function () {
                        GAInitiatePurchaseEvent(getProductJsonForEventSend(), getTotalAmount(), null, customerData);
                        closeModal();
                        showOrderSuccessModal();
                    }
                });
                submitBtn.disabled = false;
                submitBtn.innerHTML = "🛒 অর্ডার কনফার্ম করুন";
            } else {
                alert(data.message || "অর্ডার করতে সমস্যা হয়েছে");
            }
        } catch (err) {
            alert("অর্ডার সাবমিট করতে সমস্যা হয়েছে");
        }

        submitBtn.disabled = false;
        submitBtn.innerHTML = "🛒 অর্ডার কনফার্ম করুন";
    });





const iframe = document.querySelector("iframe");
function enableSound() {
  iframe.src = iframe.src.replace("mute=1", "mute=0");
}
document.getElementById("ShowVideo").addEventListener("click", function () {
    enableSound();
    document.querySelector(".video-section").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
});
// const videoSection = document.querySelector(".video-section");
// const video = document.getElementById("productVideo");
// const videoSrc = video.src;

// function playVideo() {
//   if (!video.src.includes("autoplay=1")) {
//     video.src = videoSrc + "&autoplay=1&mute=1";
//   }
// }

// // Button click
// document.getElementById("ShowVideo").addEventListener("click", function () {
//   videoSection.scrollIntoView({ behavior: "smooth" });

//   setTimeout(() => {
//     playVideo();
//   }, 800);
// });

// // Scroll detect (video section এ আসলে)
// window.addEventListener("scroll", function () {
//   const rect = videoSection.getBoundingClientRect();

//   if (rect.top < window.innerHeight && rect.bottom > 200) {
//     playVideo();
//   }
// });



