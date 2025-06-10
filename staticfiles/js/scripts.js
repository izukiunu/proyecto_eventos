function toggleChat() {
  const chat = document.getElementById("chat-container");
  chat.classList.toggle("d-none");
}

function enviarAWhatsApp() {
  const nombre = document.getElementById("userName").value.trim();
  const mensaje = document.getElementById("userMsg").value.trim();
  if (!nombre || !mensaje) {
    alert("Completa tu nombre y mensaje.");
    return;
  }
  const texto = encodeURIComponent(`Hola, soy ${nombre}. ${mensaje}`);
  const numero = "56952046511";
  window.open(`https://wa.me/${numero}?text=${texto}`, "_blank");
}

// Chat inteligente básico
document.addEventListener("DOMContentLoaded", () => {
  const userMsgInput = document.getElementById("userMsg");

  userMsgInput.addEventListener("input", () => {
    const mensaje = userMsgInput.value.toLowerCase().trim();

    let respuesta = "";
    if (mensaje.includes("hola") || mensaje.includes("buenas")) {
      respuesta = "¡Hola! ¿En qué te puedo ayudar?";
    } else if (mensaje.includes("servicio") || mensaje.includes("evento")) {
      respuesta = "Ofrecemos varios servicios para eventos. ¿Qué tipo de evento deseas organizar?";
    } else if (mensaje.includes("precio") || mensaje.includes("costo")) {
      respuesta = "Los precios varían según el tipo de servicio. ¿Quieres que te contacte un asesor?";
    } else {
      respuesta = "";
    }

    const chatBody = document.getElementById("chat-body");
    const respuestaBot = document.getElementById("botRespuesta");

    if (respuesta) {
      if (!respuestaBot) {
        const p = document.createElement("p");
        p.className = "text-secondary small mt-2";
        p.id = "botRespuesta";
        p.textContent = respuesta;
        chatBody.appendChild(p);
      } else {
        respuestaBot.textContent = respuesta;
      }
    }
  });
});


// Carrito de cotización
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
