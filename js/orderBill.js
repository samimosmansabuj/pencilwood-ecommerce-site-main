/* =========================================
   ORDER BILL  (js/orderBill.js)
   
   Usage:
     const html = OrderBill.html(response.bill);   // "" when no bill data
========================================= */
(function () {
    function esc(v) {
        return String(v == null ? "" : v)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    function money(v) {
        const n = Number(v || 0);
        return "৳" + (Number.isInteger(n) ? n : n.toFixed(2)).toLocaleString("en-US");
    }

    function safeColor(v, fallback) {
        return /^#[0-9a-fA-F]{3,8}$/.test(String(v || "")) ? v : fallback;
    }

    function safeUrl(v) {
        return /^https?:\/\//i.test(String(v || "")) ? v : "";
    }

    function injectStyle() {
        if (document.getElementById("pwBillStyle")) return;
        const st = document.createElement("style");
        st.id = "pwBillStyle";
        st.textContent = `
            .pw-bill{position:relative;max-width:360px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;
                box-shadow:0 8px 28px rgba(0,0,0,.14);text-align:left;font-family:inherit;color:#222;font-size:12.5px;line-height:1.4;}
            .pw-bill *{box-sizing:border-box;}
            .pw-bill-wm{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:0;}
            .pw-bill-wm img{width:62%;max-height:62%;object-fit:contain;opacity:.07;}
            .pw-bill-wm span{font-size:34px;font-weight:800;opacity:.06;transform:rotate(-25deg);white-space:nowrap;}
            .pw-bill-in{position:relative;z-index:1;}
            .pw-bill-head{display:flex;align-items:center;gap:10px;padding:12px 14px;}
            .pw-bill-logo{width:38px;height:38px;border-radius:50%;background:#fff;object-fit:contain;padding:3px;flex:none;}
            .pw-bill-brand{font-size:15px;font-weight:700;line-height:1.2;}
            .pw-bill-sub{font-size:10.5px;opacity:.85;}
            .pw-bill-ok{background:#e8f8ee;color:#157a3b;text-align:center;font-weight:600;padding:7px 10px;font-size:12.5px;}
            .pw-bill-body{padding:10px 14px 12px;}
            .pw-bill-meta{display:flex;justify-content:space-between;gap:8px;font-size:11px;color:#555;margin-bottom:8px;}
            .pw-bill-meta b{color:#222;}
            .pw-bill-cust{border:1px dashed #ddd;border-radius:8px;padding:7px 9px;margin-bottom:8px;font-size:11.5px;}
            .pw-bill-tbl{width:100%;border-collapse:collapse;margin-bottom:6px;}
            .pw-bill-tbl th{font-size:10.5px;text-transform:uppercase;letter-spacing:.3px;color:#666;text-align:left;padding:4px 0;border-bottom:1px solid #ddd;}
            .pw-bill-tbl td{padding:5px 0;border-bottom:1px dotted #e4e4e4;vertical-align:top;}
            .pw-bill-tbl .r{text-align:right;white-space:nowrap;}
            .pw-bill-tbl .c{text-align:center;width:34px;}
            .pw-bill-var{display:block;font-size:10.5px;color:#777;}
            .pw-bill-row{display:flex;justify-content:space-between;padding:2px 0;}
            .pw-bill-total{display:flex;justify-content:space-between;align-items:center;margin-top:6px;padding:8px 10px;border-radius:8px;font-weight:700;font-size:14px;}
            .pw-bill-foot{text-align:center;font-size:10.5px;color:#777;padding:0 14px 10px;}
        `;
        document.head.appendChild(st);
    }

    function html(bill) {
        if (!bill || !Array.isArray(bill.items) || !bill.items.length) return "";
        injectStyle();

        const brand = bill.brand || {};
        const colors = bill.colors || {};
        const headBg = safeColor(colors.header_bg, "#1c2b39");
        const headTx = safeColor(colors.header_text, "#ffffff");
        const hi = safeColor(colors.highlight, "#f5f5f5");
        const logo = safeUrl(brand.logo);
        const cust = bill.customer || {};

        const rows = bill.items.map(it => `
            <tr>
                <td>${esc(it.name)}${it.variant ? `<span class="pw-bill-var">${esc(it.variant)}</span>` : ""}</td>
                <td class="c">${esc(it.quantity)}</td>
                <td class="r">${it.is_free ? "ফ্রি" : money(it.line_total)}</td>
            </tr>`).join("");

        const addr = [cust.address, cust.district].filter(Boolean).join(", ");
        const contact = [brand.phone, brand.website].filter(Boolean).join("  •  ");

        return `
        <div class="pw-bill">
            <div class="pw-bill-wm">${logo ? `<img src="${esc(logo)}" alt="">` : `<span>${esc(brand.name)}</span>`}</div>
            <div class="pw-bill-in">
                <div class="pw-bill-head" style="background:${headBg};color:${headTx};">
                    ${logo ? `<img class="pw-bill-logo" src="${esc(logo)}" alt="">` : ""}
                    <div>
                        <div class="pw-bill-brand">${esc(brand.name)}</div>
                        ${contact ? `<div class="pw-bill-sub">${esc(contact)}</div>` : ""}
                    </div>
                </div>

                <div class="pw-bill-ok">✔ আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে</div>

                <div class="pw-bill-body">
                    <div class="pw-bill-meta">
                        <div>অর্ডার নং: <b>${esc(bill.order_id)}</b></div>
                        <div>${esc(bill.date)}</div>
                    </div>

                    <div class="pw-bill-cust">
                        <div><b>${esc(cust.name)}</b>${cust.phone ? ` &nbsp;|&nbsp; ${esc(cust.phone)}` : ""}</div>
                        ${addr ? `<div style="color:#555;">${esc(addr)}</div>` : ""}
                    </div>

                    <table class="pw-bill-tbl">
                        <thead><tr><th>পণ্য</th><th class="c">পরিমাণ</th><th class="r">মূল্য</th></tr></thead>
                        <tbody>${rows}</tbody>
                    </table>

                    <div class="pw-bill-row"><span>সাবটোটাল</span><span>${money(bill.subtotal)}</span></div>
                    <div class="pw-bill-row"><span>ডেলিভারি চার্জ</span><span>${Number(bill.delivery) > 0 ? money(bill.delivery) : "ফ্রি"}</span></div>
                    ${Number(bill.discount) > 0 ? `<div class="pw-bill-row" style="color:#157a3b;"><span>ডিসকাউন্ট</span><span>-${money(bill.discount)}</span></div>` : ""}

                    <div class="pw-bill-total" style="background:${hi};">
                        <span>সর্বমোট</span><span>${money(bill.total)}</span>
                    </div>
                    <div style="text-align:right;font-size:10.5px;color:#777;margin-top:3px;">পেমেন্ট: ${esc(bill.payment_type || "Cash on Delivery")}</div>
                </div>

                <div class="pw-bill-foot">ধন্যবাদ, ${esc(brand.name)}-এর সাথে থাকার জন্য!</div>
            </div>
        </div>`;
    }

    window.OrderBill = { html: html };
})();