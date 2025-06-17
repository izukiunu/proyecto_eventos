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

// core/static/js/scripts.js

// --- LÓGICA COMPLETA Y MEJORADA DEL CHATBOT ---

// Función para mostrar/ocultar la ventana del chat.
// Ahora también se encarga de mostrar las sugerencias iniciales.
function toggleChat() {
    const chatContainer = $('#chat-container');
    chatContainer.toggleClass('d-none');

    // --- LÓGICA AÑADIDA: Mostrar sugerencias iniciales al abrir ---
    const chatMessages = $('#chat-messages');
    // Si estamos abriendo el chat y es la primera vez (no hay mensajes de usuario)
    if (!chatContainer.hasClass('d-none') && chatMessages.find('.user-message').length === 0) {
        
        const suggestionsDataEl = document.getElementById('chatbot-initial-suggestions');
        let suggestions = [];

        // Verificamos que el elemento con las sugerencias exista y lo parseamos
        if (suggestionsDataEl) {
            try {
                suggestions = JSON.parse(suggestionsDataEl.textContent);
            } catch (e) {
                console.error("Error al parsear las sugerencias iniciales del chatbot:", e);
            }
        }
        
        // Limpiamos cualquier contenido previo y añadimos el saludo con las sugerencias
        chatMessages.empty(); 
        addMessageToChat(
            '¡Hola! Soy tu asistente virtual. Puedes escribirme una pregunta o seleccionar una de las siguientes opciones:', 
            'bot', 
            suggestions
        );
    }
}

// Lógica principal que se ejecuta cuando la página está lista
$(document).ready(function() {
    
    // --- CONFIGURACIÓN DE CSRF TOKEN PARA TODAS LAS LLAMADAS AJAX ---
    // Esta función obtiene el token CSRF de las cookies del navegador.
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    // Esta función configura jQuery para que envíe el token CSRF en la cabecera
    // de cada petición AJAX que no sea GET, protegiéndolas.
    $.ajaxSetup({
        beforeSend: function(xhr, settings) {
            if (!/^(GET|HEAD|OPTIONS|TRACE)$/.test(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
            }
        }
    });
    // --- FIN DE LA CONFIGURACIÓN CSRF ---

    const chatMessages = $('#chat-messages');
    const userInput = $('#userMsg');

    // Función para añadir mensajes y sugerencias al chat
    window.addMessageToChat = function(message, sender, suggestions = []) {
        const messageClass = sender === 'user' ? 'user-message' : 'bot-message';
        // Limpiamos el HTML para evitar inyección de código (XSS)
        const cleanMessage = $('<div/>').text(message).html().replace(/\n/g, '<br>');
        let messageHtml = `<div class="message ${messageClass}"><p>${cleanMessage}</p></div>`;

        // Si la respuesta del servidor incluye sugerencias, las creamos como botones
        if (suggestions.length > 0) {
            let suggestionsHtml = '<ul class="suggestion-list">';
            suggestions.forEach(function(suggestion) {
                // Escapamos las comillas en la sugerencia por si acaso
                const escapedSuggestion = suggestion.replace(/'/g, "\\'");
                suggestionsHtml += `<li><button class="suggestion-item" onclick="sendSuggestion('${escapedSuggestion}')">${suggestion}</button></li>`;
            });
            suggestionsHtml += '</ul>';
            messageHtml += suggestionsHtml;
        }

        chatMessages.append(messageHtml);
        // Hacer scroll automático hasta el final para ver el último mensaje
        chatMessages.scrollTop(chatMessages[0].scrollHeight);
    }

    // Función para que los botones de sugerencia funcionen
    window.sendSuggestion = function(question) {
        // Muestra la pregunta seleccionada como si el usuario la hubiera escrito
        addMessageToChat(question, 'user');
        // Envía la pregunta al backend
        queryBackend(question);
    }

    // Función que se comunica con el backend de Django
    function queryBackend(question) {
        // Opcional: mostrar un indicador de "escribiendo..."
        // addMessageToChat('...', 'bot'); 

        $.ajax({
            url: "/ajax/chatbot/query/", // La URL que creamos en urls.py
            type: "POST",
            data: {
                'question': question
                // Ya no es necesario pasar el csrfmiddlewaretoken aquí, ajaxSetup lo maneja.
            },
            dataType: 'json',
            success: function(response) {
                // Pequeña demora para que la respuesta no sea instantánea
                setTimeout(function() { 
                    if (response.status === 'success') {
                        // Respuesta normal encontrada
                        addMessageToChat(response.answer, 'bot');
                    } else if (response.status === 'fallback') {
                        // Respuesta por defecto + sugerencias
                        addMessageToChat(response.answer, 'bot', response.suggestions);
                    } else {
                        addMessageToChat('Lo siento, hubo un error al procesar tu solicitud.', 'bot');
                    }
                }, 500); // 500 milisegundos de demora
            },
            error: function() {
                setTimeout(function() {
                    addMessageToChat('No pude conectarme para obtener una respuesta. Intenta de nuevo.', 'bot');
                }, 500);
            }
        });
    }
    
    // Función principal que se llama desde el botón "Enviar" en el HTML
    window.procesarMensaje = function() {
        const userQuestion = userInput.val().trim();
        if (!userQuestion) return;
        addMessageToChat(userQuestion, 'user');
        userInput.val('');
        queryBackend(userQuestion);
    }

    // Permitir enviar el mensaje con la tecla Enter en el textarea
    userInput.on('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) { // shiftKey permite saltos de línea con Shift+Enter
            e.preventDefault(); // Evita el salto de línea por defecto al presionar solo Enter
            procesarMensaje();
        }
    });

}); // Fin de $(document).ready()

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

document.addEventListener('DOMContentLoaded', function() {
    
    // Contamos cuántos slides hay en total
    const swiperWrapper = document.querySelector('.servicios-slider .swiper-wrapper');
    const totalSlides = swiperWrapper ? swiperWrapper.children.length : 0;
    
    // Obtenemos los elementos de navegación para poder ocultarlos
    const swiperNavNext = document.querySelector('.slider-contenedor .swiper-button-next');
    const swiperNavPrev = document.querySelector('.slider-contenedor .swiper-button-prev');
    const swiperPagination = document.querySelector('.slider-contenedor .swiper-pagination');

    let swiperOptions;

    // --- LÓGICA CONDICIONAL ---
    // Si hay 3 o menos slides, usamos una configuración simple
    if (totalSlides <= 3) {
        
        swiperOptions = {
            slidesPerView: 'auto', // Se ajusta al contenido
            spaceBetween: 30,
            centeredSlides: true, // ¡CLAVE para centrar 1, 2 o 3 slides!
            loop: false, // Desactivamos el loop
            autoplay: false, // Desactivamos el autoplay
        };

        // Ocultamos los botones y la paginación si existen
        if(swiperNavNext) swiperNavNext.style.display = 'none';
        if(swiperNavPrev) swiperNavPrev.style.display = 'none';
        if(swiperPagination) swiperPagination.style.display = 'none';

    } else {
        // Si hay más de 3, usamos la configuración completa
        swiperOptions = {
            loop: true,
            slidesPerView: 1,
            spaceBetween: 30,
            autoplay: {
                delay: 5000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            breakpoints: {
                768: { slidesPerView: 2 },
                992: { slidesPerView: 3 }
            }
        };
    }

    // Inicializamos Swiper con la configuración elegida
    const serviciosSlider = new Swiper('.servicios-slider', swiperOptions);

});