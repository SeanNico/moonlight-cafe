const modalOverlay = document.getElementById("modalOverlay");
const productModal = document.getElementById("productModal");
const productCloseButton = document.getElementById("productClose");
const image = document.getElementById("productImage");
const name = document.getElementById("productName");
const description = document.getElementById("productDescription");
const addToCartBtn = document.getElementById("addToCartBtn");
const sizeOptionsContainer = document.getElementById("sizeOptions");
const qtyDisplay = document.getElementById("qtyDisplay");
const productPriceTotal = document.getElementById("productPriceTotal");
const decreaseQtyBtn = document.getElementById("decreaseQty");
const increaseQtyBtn = document.getElementById("increaseQty");

const cart = window.cart || [];
let cartIdCounter = window.cartIdCounter || 0;

window.cart = cart;
window.cartIdCounter = cartIdCounter;

function formatPrice(value) {
    if (typeof window.formatPrice === "function" && window.formatPrice !== formatPrice) {
        return window.formatPrice(value);
    }

    const number = Number(value || 0);
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2
    }).format(number);
}

function getBasePrice(product) {
    if (!product || !product.prices) {
        return 0;
    }

    const prices = Object.values(product.prices);
    return Number(prices[0] || 0);
}

function refreshCart() {
    if (typeof window.renderCart === "function") {
        return window.renderCart();
    }

    return undefined;
}

function showCart() {
    if (typeof window.openCart === "function") {
        return window.openCart();
    }
    
    return undefined;
}

function openModal() {
    if (!modalOverlay || !productModal) return;
    modalOverlay.classList.add("active");
    productModal.classList.add("open");
    document.body.style.overflow = "hidden";
}

function closeModal() {
    if (!modalOverlay || !productModal) return;
    modalOverlay.classList.remove("active");
    productModal.classList.remove("open");
    document.body.style.overflow = "";
}

function updateModalSizeInfo() {
    const infoBox = document.getElementById("sizeInfo");
    if (!infoBox) return;

    const details = {
        Small: "250ml cup — cozy and easy to sip",
        Medium: "350ml cup — balanced and satisfying",
        Large: "500ml cup — full and comforting"
    };

    infoBox.textContent = details[selectedSize] || "";
}

let currentProduct = null;
let selectedSize = "";
let selectedSweetness = "Regular";
let selectedIce = "Normal Ice";
let modalQty = 1;
let editingCartId = null;

const servingSizeDetails = {
    Small: "250ml cup — cozy and easy to sip",
    Medium: "350ml cup — balanced and satisfying",
    Large: "500ml cup — full and comforting"
};

function normaliseProductFromCard(card) {
    if (!card) return null;

    const imageEl = card.querySelector(".menu-wrap-image");
    const nameEl = card.querySelector(".menu-card-name");
    const valueEl = card.querySelector(".menu-card-value");

    const rawName = nameEl ? nameEl.textContent.trim() : "Product";
    const rawImage = imageEl ? imageEl.src : "";
    const rawValue = valueEl ? valueEl.textContent : "₱70";
    const basePrice = Number((rawValue.match(/\d+(?:\.\d+)?/) || [70])[0]);
    const imageSrc = rawImage || "";
    const srcLower = decodeURIComponent(imageEl ? imageEl.getAttribute("src") || imageSrc : imageSrc).toLowerCase();

    let category = "coffee";
    if (srcLower.includes("/tea/")) category = "tea";
    else if (srcLower.includes("/pastries/")) category = "pastry";
    else if (srcLower.includes("/iced coffee/")) category = "iced";

    const priceMap = {
        Small: basePrice,
        Medium: basePrice + 30,
        Large: basePrice + 60
    };

    return {
        id: rawName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        name: rawName,
        image: imageSrc,
        description: `Freshly prepared ${rawName}.`,
        category,
        prices: priceMap
    };
}

function openProductModal(product, existItem = null) {
    if (!product) return;

    currentProduct = product;

    if (existItem) {
        editingCartId = existItem.cartId;
        selectedSize = existItem.size || Object.keys(product.prices)[0];
        selectedSweetness = existItem.sweetness || "Regular";
        selectedIce = existItem.ice || "Normal Ice";
        modalQty = existItem.qty || 1;
    } else {
        editingCartId = null;
        selectedSize = Object.keys(product.prices)[0] || "Small";
        selectedSweetness = "Regular";
        selectedIce = "Normal Ice";
        modalQty = 1;
    }

    populateModalData(product);
    openModal();
}

function populateModalData(product) {
    if (!product || !image || !name || !description || !addToCartBtn || !sizeOptionsContainer) {
        return;
    }

    image.src = product.image || "";
    image.alt = product.name || "Product image";
    name.textContent = product.name || "Product";
    description.textContent = product.description || "";

    addToCartBtn.textContent = editingCartId !== null ? "💾 Save Changes" : "Add to Cart";

    sizeOptionsContainer.innerHTML = "";

    Object.keys(product.prices || {}).forEach((sizeKey) => {
        const btn = document.createElement("button");
        btn.className = "option" + (sizeKey === selectedSize ? " active" : "");
        btn.dataset.size = sizeKey;
        btn.textContent = `${sizeKey} — ${formatPrice(product.prices[sizeKey])}`;

        btn.addEventListener("click", () => {
            document.querySelectorAll("#sizeOptions .option").forEach((option) => {
                option.classList.remove("active");
            });

            btn.classList.add("active");
            selectedSize = sizeKey;
            updateModalPrice();
            updateModalSizeInfo();
        });

        sizeOptionsContainer.appendChild(btn);
    });

    const sizeGroup = document.getElementById("sizeGroup");
    if (sizeGroup) {
        const sizeKeys = Object.keys(product.prices || {});
        const shouldHide = sizeKeys.length <= 1 && !["Small", "Medium", "Large"].includes(sizeKeys[0]);
        sizeGroup.style.display = shouldHide ? "none" : "";
    }

    updateModalSizeInfo();

    const sweetnessGroup = document.getElementById("sweetnessGroup");
    if (sweetnessGroup) {
        sweetnessGroup.style.display = product.category === "pastry" ? "none" : "";
    }

    const iceGroup = document.getElementById("iceGroup");
    if (iceGroup) {
        iceGroup.style.display = product.category === "iced" || product.category === "blended" ? "" : "none";
    }

    document.querySelectorAll("[data-sweetness]").forEach((option) => {
        const isActive = (option.dataset.sweetness || "").toLowerCase() === selectedSweetness.toLowerCase();
        option.classList.toggle("active", isActive);

        option.onclick = () => {
            document.querySelectorAll("[data-sweetness]").forEach((item) => {
                item.classList.remove("active");
            });

            option.classList.add("active");
            selectedSweetness = option.dataset.sweetness || "Regular";
        };
    });

    document.querySelectorAll("[data-ice]").forEach((option) => {
        const isActive = (option.dataset.ice || "") === selectedIce;
        option.classList.toggle("active", isActive);

        option.onclick = () => {
            document.querySelectorAll("[data-ice]").forEach((item) => {
                item.classList.remove("active");
            });

            option.classList.add("active");
            selectedIce = option.dataset.ice || "Normal Ice";
        };
    });

    if (qtyDisplay) {
        qtyDisplay.textContent = String(modalQty);
    }

    updateModalPrice();
}

function calcModalPrice() {
    if (!currentProduct) return 0;
    const base = currentProduct.prices[selectedSize] || getBasePrice(currentProduct);
    return Number(base) * modalQty;
}

function updateModalPrice() {
    if (productPriceTotal) {
        productPriceTotal.textContent = formatPrice(calcModalPrice());
    }

    if (qtyDisplay) {
        qtyDisplay.textContent = String(modalQty);
    }
}

function saveEditedItem(unitPrice) {
    const idx = cart.findIndex((item) => item.cartId === editingCartId);
    if (idx === -1) {
        closeModal();
        return;
    }

    cart[idx] = {
        ...cart[idx],
        productId: currentProduct.id,
        name: currentProduct.name,
        image: currentProduct.image,
        category: currentProduct.category,
        prices: currentProduct.prices,
        size: selectedSize,
        sweetness: selectedSweetness,
        ice: currentProduct.category === "iced" || currentProduct.category === "blended" ? selectedIce : null,
        qty: modalQty,
        unitPrice
    };

    editingCartId = null;
    refreshCart();
    closeModal();
    showCart();
}

if (decreaseQtyBtn) {
    decreaseQtyBtn.addEventListener("click", () => {
        if (modalQty > 1) {
            modalQty -= 1;
            updateModalPrice();
        }
    });
}

if (increaseQtyBtn) {
    increaseQtyBtn.addEventListener("click", () => {
        if (modalQty < 10) {
            modalQty += 1;
            updateModalPrice();
        }
    });
}

if (addToCartBtn) {
    addToCartBtn.addEventListener("click", () => {
        if (!currentProduct) {
            return;
        }

        const base = currentProduct.prices[selectedSize] || getBasePrice(currentProduct);
        const unitPrice = Number(base);

        if (editingCartId !== null) {
            saveEditedItem(unitPrice);
            return;
        }

        const item = {
            cartId: ++cartIdCounter,
            productId: currentProduct.id,
            name: currentProduct.name,
            image: currentProduct.image,
            category: currentProduct.category,
            prices: currentProduct.prices,
            size: selectedSize,
            sweetness: selectedSweetness,
            ice: currentProduct.category === "iced" || currentProduct.category === "blended" ? selectedIce : null,
            qty: modalQty,
            unitPrice
        };

        cart.push(item);
        window.cart = cart;
        window.cartIdCounter = cartIdCounter;
        closeModal();
        refreshCart();
        showCart();
    });
}

if (modalOverlay) {
    modalOverlay.addEventListener("click", closeModal);
}

if (productCloseButton) {
    productCloseButton.addEventListener("click", closeModal);
}

document.querySelectorAll(".card-add-btn").forEach((button) => {
    button.addEventListener("click", (event) => {
        event.preventDefault();
        const card = button.closest(".menu-card-content");
        const product = normaliseProductFromCard(card);

        if (product) {
            openProductModal(product);
        } else {
            openModal();
        }
    });
});
