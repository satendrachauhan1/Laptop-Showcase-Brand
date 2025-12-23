// cart.js - server-aware cart handling + local fallback
let cart = [];
let total = 0;
const API_BASE = window.API_BASE || 'http://localhost:5000';
const authToken = () => localStorage.getItem('authToken');

// Persist cart to localStorage
function saveCart() {
    try { localStorage.setItem('cart', JSON.stringify({ cart, total })); } catch (e) { }
}

// Load cart: if logged in, try server; otherwise use localStorage
async function loadCart() {
    const token = authToken();
    if (token) {
        try {
            const res = await fetch(API_BASE + '/api/cart', { headers: { Authorization: 'Bearer ' + token } });
            if (res.ok) {
                const data = await res.json();
                cart = (data.items || []).map(i => ({ id: i._id, brand: i.brand, price: i.price, quantity: i.quantity }));
                total = cart.reduce((s,i) => s + ((i.price||0)*(i.quantity||1)), 0);
                return;
            }
        } catch (err) {
            console.error('Failed to load server cart', err);
        }
    }

    // fallback to localStorage
    try {
        const raw = localStorage.getItem('cart');
        if (raw) {
            const obj = JSON.parse(raw);
            cart = Array.isArray(obj.cart) ? obj.cart : [];
            total = typeof obj.total === 'number' ? obj.total : cart.reduce((s,i)=>s + ((i.price||0)*(i.quantity||1)),0);
        }
    } catch (e) { cart = []; total = 0; }
}

function updateCartCount() {
    const badge = document.getElementById('cartCount');
    if (!badge) return;
    const count = cart.reduce((s,i)=>s + (i.quantity||1), 0);
    badge.innerText = String(count || 0);
    // also update front-facing per-item badges
    try { updateFrontCounts(); } catch(e) { }
}

// Update badges shown on product cards in the main page
function updateFrontCounts() {
    const map = {};
    cart.forEach(i => { map[i.brand] = (map[i.brand]||0) + (i.quantity||1); });
    document.querySelectorAll('.item-count[data-brand]').forEach(el => {
        const b = el.dataset.brand;
        el.innerText = map[b] || 0;
    });
    // show/hide decrement buttons
    document.querySelectorAll('.dec-btn[data-brand]').forEach(btn => {
        const b = btn.dataset.brand;
        const cnt = map[b] || 0;
        btn.style.display = cnt > 0 ? 'inline-block' : 'none';
    });
}

async function addToCart(brand, price) {
    const token = authToken();
    const el = document.querySelector('.cart-btn');
    if (el && el.animate) el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.04)' }, { transform: 'scale(1)' }], { duration: 220 });

    if (token) {
        try {
            const res = await fetch(API_BASE + '/api/cart', {
                method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
                body: JSON.stringify({ brand, price: Number(price) })
            });
            const data = await res.json();
            if (!res.ok) { alert(data.message || 'Failed to add to cart'); return; }
            cart = (data.items || []).map(i => ({ id: i._id, brand: i.brand, price: i.price, quantity: i.quantity }));
            total = cart.reduce((s,i) => s + ((i.price||0)*(i.quantity||1)), 0);
            updateCartCount();
            showTempMessage('Added to server cart');
            return;
        } catch (err) {
            console.error(err);
            alert('Unable to reach server');
            return;
        }
    }

    // local fallback (use quantities)
    const idx = cart.findIndex(c => c.brand === brand && !c.id);
    if (idx >= 0) cart[idx].quantity = (cart[idx].quantity||1) + 1;
    else cart.push({ brand, price, quantity: 1 });
    total = cart.reduce((s,i)=>s + ((i.price||0)*(i.quantity||1)),0);
    saveCart();
    updateCartCount();
}

// Change quantity for a brand by delta (positive to add, negative to subtract)
async function changeQuantity(brand, delta) {
    const token = authToken();
    if (token) {
        try {
            // fetch server cart, find item by brand
            const res = await fetch(API_BASE + '/api/cart', { headers: { Authorization: 'Bearer ' + token } });
            if (!res.ok) throw new Error('Could not fetch server cart');
            const data = await res.json();
            const serverItems = data.items || [];
            const found = serverItems.find(i => i.brand === brand);
            if (!found) {
                if (delta > 0) return await addToCart(brand, price || 0);
                return; // nothing to decrement
            }
            const newQty = (found.quantity || 1) + delta;
            if (newQty <= 0) {
                // delete
                const del = await fetch(API_BASE + '/api/cart/' + found._id, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } });
                if (!del.ok) throw new Error('Delete failed');
            } else {
                const upd = await fetch(API_BASE + '/api/cart/' + found._id, { method: 'PATCH', headers: { 'Content-Type':'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ quantity: newQty }) });
                if (!upd.ok) throw new Error('Update failed');
            }
            await loadCart(); updateCartCount();
            showTempMessage('Cart updated');
            return;
        } catch (e) { console.error(e); showTempMessage('Could not update cart'); return; }
    }

    // local fallback
    const idx = cart.findIndex(c => c.brand === brand && !c.id);
    if (idx === -1) {
        if (delta > 0) { cart.push({ brand, price, quantity: 1 }); }
        else return;
    } else {
        cart[idx].quantity = (cart[idx].quantity||1) + delta;
        if (cart[idx].quantity <= 0) cart.splice(idx,1);
    }
    total = cart.reduce((s,i)=>s + ((i.price||0)*(i.quantity||1)),0);
    saveCart(); updateCartCount();
}

// expose for inline handlers
window.changeQuantity = changeQuantity;

function showTempMessage(text, ms=900) {
    let node = document.getElementById('cartTempMsg');
    if (!node) {
        node = document.createElement('div');
        node.id = 'cartTempMsg';
        node.style.position = 'fixed';
        node.style.right = '20px';
        node.style.top = '20px';
        node.style.background = 'rgba(25,118,210,0.95)';
        node.style.color = '#fff';
        node.style.padding = '10px 14px';
        node.style.borderRadius = '8px';
        node.style.boxShadow = '0 6px 18px rgba(0,0,0,0.12)';
        document.body.appendChild(node);
    }
    node.innerText = text;
    node.style.opacity = '1';
    setTimeout(()=>{ node.style.transition='opacity 300ms'; node.style.opacity='0'; }, ms);
}

// Show cart details (used on-page)
function showCart() {
    const cartBox = document.getElementById("cartBox");
    const cartItems = document.getElementById("cartItems");
    const totalPrice = document.getElementById("totalPrice");

    if (!cartItems || !totalPrice || !cartBox) return;

    cartItems.innerHTML = "";

    if (cart.length === 0) {
        cartItems.innerHTML = "<li>Your cart is empty</li>";
        totalPrice.innerText = "";
    } else {
        cart.forEach(item => {
            const li = document.createElement("li");
            const qty = item.quantity || 1;
            li.innerText = item.brand + " x" + qty + " - ₹" + ((item.price||0)*qty);
            cartItems.appendChild(li);
        });
        totalPrice.innerText = "Total Amount: ₹" + total;
    }

    cartBox.style.display = "block";
}

// Place order (server-aware)
function placeOrder() {
    if (cart.length === 0) { alert("Your cart is empty!"); return; }
    alert(
        "✅ Order Placed Successfully!\n\n" +
        "Total Items: " + cart.reduce((s,i)=>s + (i.quantity||1),0) + "\n" +
        "Total Amount: ₹" + total + "\n\n" +
        "Thank you for shopping!"
    );

    const token = authToken();
    if (token) {
        fetch(API_BASE + '/api/cart/clear', { method: 'POST', headers: { Authorization: 'Bearer ' + token } })
            .then(()=>{ cart = []; total = 0; saveCart(); updateCartCount(); const cb = document.getElementById("cartBox"); if (cb) cb.style.display='none'; })
            .catch(err=>{ console.error(err); alert('Order placed locally, but failed to clear server cart'); });
        return;
    }

    cart = [];
    total = 0;
    saveCart();
    updateCartCount();
    const cb = document.getElementById("cartBox"); if (cb) cb.style.display = "none";
}

// remove item by index (server-aware)
async function removeCartItem(idx) {
    if (idx < 0 || idx >= cart.length) return;
    const token = authToken();
    if (token && cart[idx].id) {
        try {
            const res = await fetch(API_BASE + '/api/cart/' + cart[idx].id, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } });
            const data = await res.json();
            if (!res.ok) { alert(data.message || 'Failed'); return; }
            cart = (data.items || []).map(i => ({ id: i._id, brand: i.brand, price: i.price, quantity: i.quantity }));
            total = cart.reduce((s,i) => s + ((i.price||0)*(i.quantity||1)), 0);
            updateCartCount();
            showTempMessage('Item removed');
            return;
        } catch (err) { console.error(err); alert('Server error'); return; }
    }
    // local fallback
    const item = cart[idx];
    if (item) {
        total = total - ((item.price||0)*(item.quantity||1));
        cart.splice(idx,1);
        saveCart();
        updateCartCount();
    }
}

// initialize
loadCart().then(updateCartCount).catch(()=>updateCartCount());
