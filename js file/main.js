const navBar = document.querySelector(".navbar");
const navLinks = document.querySelectorAll(".nav-links a");
const logoText = document.querySelector(".logo-text");
const basket = loadStoredList("moonlightCart");
const orders = loadStoredList("moonlightOrders");

function loadStoredList(key) {
    try {
        const stored = localStorage.getItem(key);
        if (!stored) return [];

        const value = JSON.parse(stored);
        if (!Array.isArray(value)) {
            throw new TypeError(`Stored value for ${key} is not a list.`);
        }
        return value;
    } catch (error) {
        console.error(`Unable to load ${key} from local storage.`, error);
        return [];
    }
}

window.cart = basket;
window.cartIdCounter = basket.reduce((highestId, item) =>
    Math.max(highestId, Number(item.cartId) || 0), 0);

function formatCurrency(value) {
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2
    }).format(Number(value) || 0);
}

window.formatPrice = formatCurrency;

function saveStoredList(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Unable to save ${key} to local storage.`, error);
    }
}

const cartDrawer = document.getElementById("cartDrawer");
const cartOverlay = document.getElementById("cartOverlay");
const cartItemsContainer = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const historyDialog = document.getElementById("historyDialog");
const historyOverlay = document.getElementById("historyOverlay");
const historyItemsContainer = document.getElementById("historyItems");

function renderCart() {
    if (!cartItemsContainer) return;

    cartItemsContainer.replaceChildren();
    let total = 0;
    let itemCount = 0;

    if (basket.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "cart-empty";
        emptyMessage.textContent = "Your cart is empty.";
        cartItemsContainer.appendChild(emptyMessage);
    }

    basket.forEach((item, index) => {
        const quantity = Math.max(1, Number(item.qty) || 1);
        const unitPrice = Number(item.unitPrice) || 0;
        const lineTotal = unitPrice * quantity;
        total += lineTotal;
        itemCount += quantity;

        const row = document.createElement("article");
        row.className = "cart-item";

        if (item.image) {
            const image = document.createElement("img");
            image.src = item.image;
            image.alt = item.name || "Cart item";
            row.appendChild(image);
        }

        const details = document.createElement("div");
        details.className = "cart-item-details";
        const title = document.createElement("h3");
        title.textContent = item.name || "Product";
        const options = document.createElement("p");
        const optionParts = [item.size, item.sweetness, item.ice].filter(Boolean);
        options.textContent = `${optionParts.join(" · ")}${optionParts.length ? " · " : ""}Qty ${quantity}`;
        const price = document.createElement("strong");
        price.textContent = formatCurrency(lineTotal);
        details.append(title, options, price);
        row.appendChild(details);

        const actions = document.createElement("div");
        actions.className = "cart-item-actions";
        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.textContent = "Edit";
        editButton.addEventListener("click", () => {
            if (typeof window.openProductModal !== "function") return;
            closeCart();
            const prices = item.prices || { [item.size || "Small"]: unitPrice };
            window.openProductModal({
                id: item.productId,
                name: item.name,
                image: item.image,
                category: item.category,
                description: `Freshly prepared ${item.name || "product"}.`,
                prices
            }, item);
        });

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.textContent = "Remove";
        removeButton.addEventListener("click", () => {
            basket.splice(index, 1);
            renderCart();
        });
        actions.append(editButton, removeButton);
        row.appendChild(actions);
        cartItemsContainer.appendChild(row);
    });

    if (cartTotal) cartTotal.textContent = formatCurrency(total);
    document.querySelectorAll(".cart-count").forEach((badge) => {
        badge.textContent = String(itemCount);
    });
    const checkoutButton = document.getElementById("checkoutBtn");
    if (checkoutButton) checkoutButton.disabled = basket.length === 0;
    saveStoredList("moonlightCart", basket);
}

function openCart() {
    if (!cartDrawer || !cartOverlay) return;
    renderCart();
    cartDrawer.classList.add("open");
    cartOverlay.classList.add("active");
    cartDrawer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
}

function closeCart() {
    if (!cartDrawer || !cartOverlay) return;
    cartDrawer.classList.remove("open");
    cartOverlay.classList.remove("active");
    cartDrawer.setAttribute("aria-hidden", "true");
    if (!historyDialog || !historyDialog.classList.contains("open")) {
        document.body.style.overflow = "";
    }
}

window.renderCart = renderCart;
window.openCart = openCart;

function renderOrderHistory() {
    if (!historyItemsContainer) return;
    historyItemsContainer.replaceChildren();

    if (orders.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "cart-empty";
        emptyMessage.textContent = "No orders yet.";
        historyItemsContainer.appendChild(emptyMessage);
        return;
    }

    [...orders].reverse().forEach((order) => {
        const entry = document.createElement("article");
        entry.className = "history-order";
        const heading = document.createElement("h3");
        heading.textContent = `Order ${order.id}`;
        const date = document.createElement("p");
        date.textContent = new Date(order.createdAt).toLocaleString();
        const contents = document.createElement("p");
        contents.textContent = (order.items || []).map((item) =>
            `${item.name} × ${item.qty}`).join(", ");
        const total = document.createElement("strong");
        total.textContent = formatCurrency(order.total);
        entry.append(heading, date, contents, total);
        historyItemsContainer.appendChild(entry);
    });
}

function openHistory() {
    if (!historyDialog || !historyOverlay) return;
    closeCart();
    renderOrderHistory();
    historyDialog.classList.add("open");
    historyOverlay.classList.add("active");
    historyDialog.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
}

function closeHistory() {
    if (!historyDialog || !historyOverlay) return;
    historyDialog.classList.remove("open");
    historyOverlay.classList.remove("active");
    historyDialog.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
}

document.querySelectorAll(".cart-btn").forEach((button) => {
    button.addEventListener("click", openCart);
});
document.querySelectorAll(".history-btn").forEach((button) => {
    button.addEventListener("click", openHistory);
});
document.querySelectorAll(".cart-close").forEach((button) => {
    button.addEventListener("click", closeCart);
});
document.querySelectorAll(".history-close").forEach((button) => {
    button.addEventListener("click", closeHistory);
});
if (cartOverlay) cartOverlay.addEventListener("click", closeCart);
if (historyOverlay) historyOverlay.addEventListener("click", closeHistory);

const checkoutButton = document.getElementById("checkoutBtn");
if (checkoutButton) {
    checkoutButton.addEventListener("click", () => {
        if (basket.length === 0) return;
        const total = basket.reduce((sum, item) =>
            sum + (Number(item.unitPrice) || 0) * (Number(item.qty) || 1), 0);
        orders.push({
            id: `MC-${Date.now()}`,
            createdAt: new Date().toISOString(),
            items: basket.map((item) => ({ ...item })),
            total
        });
        saveStoredList("moonlightOrders", orders);
        basket.length = 0;
        renderCart();
        closeCart();
        openHistory();
    });
}

function updateNavigation() {
    const isScrolling = window.scrollY > 50;
    if (navBar) navBar.classList.toggle("scrolling", isScrolling);
    navLinks.forEach((link) => link.classList.toggle("scroll", isScrolling));
    if (logoText) logoText.classList.toggle("scrollLogo", isScrolling);
}

window.addEventListener("scroll", updateNavigation);
updateNavigation();

const slides = document.querySelectorAll(".featured-image img");
let slideIndex = 0;

function showSlide(index) {
    if (slides.length === 0) return;
    slideIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, currentIndex) =>
        slide.classList.toggle("displaySlide", currentIndex === slideIndex));
}

function prevSlide() {
    showSlide(slideIndex - 1);
}

function nextSlide() {
    showSlide(slideIndex + 1);
}

window.prevSlide = prevSlide;
window.nextSlide = nextSlide;
showSlide(slideIndex);

const categoryButtons = document.querySelectorAll(".category-btn[data-category]");
const productCards = document.querySelectorAll(".menu-card-content");
const searchInput = document.getElementById("search-bar");
let selectedCategory = "all";

function getCardCategory(card) {
    const imagePath = decodeURIComponent(card.querySelector(".menu-wrap-image")?.getAttribute("src") || "").toLowerCase();
    if (imagePath.includes("/tea/")) return "tea";
    if (imagePath.includes("/pastries/")) return "pastry";
    if (imagePath.includes("/iced coffee/")) return "iced";
    return "coffee";
}

function filterProducts() {
    const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
    productCards.forEach((card) => {
        const name = card.querySelector(".menu-card-name")?.textContent.toLowerCase() || "";
        const matchesCategory = selectedCategory === "all" || getCardCategory(card) === selectedCategory;
        card.hidden = !matchesCategory || !name.includes(query);
    });
}

categoryButtons.forEach((button) => {
    button.addEventListener("click", () => {
        selectedCategory = button.dataset.category || "all";
        categoryButtons.forEach((categoryButton) =>
            categoryButton.classList.toggle("active", categoryButton === button));
        filterProducts();
    });
});
if (searchInput) searchInput.addEventListener("input", filterProducts);

renderCart();
