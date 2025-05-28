let cart = [];

function addToCart(service, price) {
  cart.push({ name: service, price });
  updateCart();
}

function updateCart() {
  const cartCount = document.getElementById('cartCount');
  const cartItems = document.getElementById('cartItems');
  cartCount.textContent = cart.length;
  cartItems.innerHTML = cart.map(item => `
    <li class="dropdown-item d-flex justify-content-between">
      <span>${item.name}</span>
      <span class="text-success">$${item.price.toLocaleString()}</span>
    </li>
  `).join('');
}
