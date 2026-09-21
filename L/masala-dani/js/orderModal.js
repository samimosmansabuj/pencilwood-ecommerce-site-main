const orderModal = document.getElementById("orderModal");
const closeOrderModal = document.getElementById("closeOrderModal");

/* OPEN MODAL */
document.querySelectorAll(".orderNowBtn")
    .forEach(btn => {
        btn.addEventListener("click", () => {
            orderModal.classList.add("active");
            document.body.style.overflow = "hidden";
            GAAddToCartEvent(PRODUCT_DATA);
        });
    });

/* CLOSE BUTTON */
closeOrderModal.addEventListener("click", closeModal);

/* CLICK OUTSIDE */
document.querySelector(".order-modal-overlay").addEventListener("click", closeModal);

/* ESC KEY */
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        closeModal();
    }
});

function closeModal() {
    orderModal.classList.remove("active");
    document.body.style.overflow = "";
}