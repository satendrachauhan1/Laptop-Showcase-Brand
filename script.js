let cart = [];
let total = 0;

// Add item to cart
function addToCart(brand, price) {
    cart.push({ brand, price });
    total += price;
    alert(brand + " added to cart");
}

// Show cart details
function showCart() {
    const cartBox = document.getElementById("cartBox");
    const cartItems = document.getElementById("cartItems");
    const totalPrice = document.getElementById("totalPrice");

    cartItems.innerHTML = "";

    if (cart.length === 0) {
        cartItems.innerHTML = "<li>Your cart is empty</li>";
        totalPrice.innerText = "";
    } else {
        cart.forEach(item => {
            const li = document.createElement("li");
            li.innerText = item.brand + " - ₹" + item.price;
            cartItems.appendChild(li);
        });
        totalPrice.innerText = "Total Amount: ₹" + total;
    }

    cartBox.style.display = "block";
}

// Place order (unique simple logic)
function placeOrder() {
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    alert(
        "✅ Order Placed Successfully!\n\n" +
        "Total Items: " + cart.length + "\n" +
        "Total Amount: ₹" + total + "\n\n" +
        "Thank you for shopping!"
    );

    cart = [];
    total = 0;
    document.getElementById("cartBox").style.display = "none";
}

// Search brand
function searchBrand() {
    const input = document.getElementById("searchInput").value.toLowerCase();
    const cards = document.getElementsByClassName("brand-card");

    for (let card of cards) {
        const brandName = card.getElementsByTagName("h3")[0].innerText.toLowerCase();
        card.style.display = brandName.includes(input) ? "block" : "none";
    }
}
