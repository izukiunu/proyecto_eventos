// js/components/chatbot.js
$(document).ready(function() {

    // --- SELECTORES Y VARIABLES DEL CHATBOT ---
    const chatContainer = $('#chat-container');
    const chatMessages = $('#chat-messages');
    const userInput = $('#userMsg');

    // --- FUNCIONES DEL CHATBOT ---

    /**
     * Muestra u oculta la ventana del chat.
     * También se encarga de mostrar las sugerencias iniciales al abrir por primera vez.
     */
    window.toggleChat = function() {
        chatContainer.toggleClass('d-none');

        // Si estamos abriendo el chat y es la primera vez (no hay mensajes de usuario)
        if (!chatContainer.hasClass('d-none') && chatMessages.find('.user-message').length === 0) {
            
            const suggestionsDataEl = document.getElementById('chatbot-initial-suggestions');
            let suggestions = [];

            if (suggestionsDataEl) {
                try {
                    suggestions = JSON.parse(suggestionsDataEl.textContent);
                } catch (e) {
                    console.error("Error al parsear las sugerencias iniciales del chatbot:", e);
                }
            }
            
            chatMessages.empty(); 
            addMessageToChat(
                '¡Hola! Soy tu asistente virtual. Puedes escribirme una pregunta o seleccionar una de las siguientes opciones:', 
                'bot', 
                suggestions
            );
        }
    }

    /**
     * Añade un mensaje (de usuario o bot) y opcionalmente sugerencias a la ventana del chat.
     * @param {string} message - El texto del mensaje.
     * @param {string} sender - 'user' o 'bot'.
     * @param {Array} [suggestions=[]] - Una lista de strings con las sugerencias.
     */
    window.addMessageToChat = function(message, sender, suggestions = []) {
        const messageClass = sender === 'user' ? 'user-message' : 'bot-message';
        const cleanMessage = $('<div/>').text(message).html().replace(/\n/g, '<br>');
        let messageHtml = `<div class="message ${messageClass}"><p>${cleanMessage}</p></div>`;

        if (suggestions.length > 0) {
            let suggestionsHtml = '<ul class="suggestion-list">';
            suggestions.forEach(function(suggestion) {
                const escapedSuggestion = suggestion.replace(/'/g, "\\'");
                suggestionsHtml += `<li><button class="suggestion-item" onclick="sendSuggestion('${escapedSuggestion}')">${suggestion}</button></li>`;
            });
            suggestionsHtml += '</ul>';
            messageHtml += suggestionsHtml;
        }

        chatMessages.append(messageHtml);
        chatMessages.scrollTop(chatMessages[0].scrollHeight);
    }

    /**
     * Se ejecuta cuando un usuario hace clic en un botón de sugerencia.
     * @param {string} question - La pregunta de la sugerencia seleccionada.
     */
    window.sendSuggestion = function(question) {
        addMessageToChat(question, 'user');
        queryBackend(question);
    }

    /**
     * Envía la pregunta del usuario al backend de Django vía AJAX.
     * @param {string} question - La pregunta a enviar.
     */
    function queryBackend(question) {
        $.ajax({
            url: "/ajax/chatbot/query/",
            type: "POST",
            data: { 'question': question },
            dataType: 'json',
            success: function(response) {
                setTimeout(function() { 
                    if (response.status === 'success') {
                        addMessageToChat(response.answer, 'bot');
                    } else if (response.status === 'fallback') {
                        addMessageToChat(response.answer, 'bot', response.suggestions);
                    } else {
                        addMessageToChat('Lo siento, hubo un error al procesar tu solicitud.', 'bot');
                    }
                }, 500);
            },
            error: function() {
                setTimeout(function() {
                    addMessageToChat('No pude conectarme para obtener una respuesta. Intenta de nuevo.', 'bot');
                }, 500);
            }
        });
    }
    
    /**
     * Procesa y envía el mensaje escrito por el usuario.
     */
    window.procesarMensaje = function() {
        const userQuestion = userInput.val().trim();
        if (!userQuestion) return;
        addMessageToChat(userQuestion, 'user');
        userInput.val('');
        queryBackend(userQuestion);
    }

    // --- EVENT LISTENERS ---
    
    // Permitir enviar el mensaje con la tecla Enter en el textarea.
    userInput.on('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            procesarMensaje();
        }
    });

}); // Fin de $(document).ready()