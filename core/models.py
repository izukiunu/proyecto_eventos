# core/models.py
# import uuid # Ya no es necesario para SolicitudCotizacion
from django.db import models

class Servicio(models.Model):
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField()
    imagen = models.ImageField(upload_to='servicios/', blank=True, null=True, help_text="Imagen opcional del servicio")

    def __str__(self):
        return self.nombre

class SolicitudCotizacion(models.Model):
    # EL CAMPO ticket_id (UUIDField) HA SIDO ELIMINADO. Usaremos el 'id' automático.
    nombre_cliente = models.CharField(max_length=150)
    email_cliente = models.EmailField()
    telefono_cliente = models.CharField(max_length=20, blank=True, null=True)
    servicio_interesado = models.ForeignKey(
        Servicio,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    descripcion_evento = models.TextField(
        help_text="Describe brevemente el servicio o evento que te interesa (si no seleccionaste uno específico arriba)"
    )
    fecha_solicitud = models.DateTimeField(auto_now_add=True)
    atendida = models.BooleanField(default=False)

    def __str__(self):
        # Ahora usamos self.id para el número de ticket.
        # self.id no estará disponible hasta que el objeto se guarde por primera vez.
        # Si se llama a __str__ antes de guardar, self.id podría ser None.
        ticket_num = self.id if self.id else "Nuevo"
        if self.servicio_interesado:
            return f"Ticket #{ticket_num} - {self.nombre_cliente} para '{self.servicio_interesado.nombre}'"
        return f"Ticket #{ticket_num} - {self.nombre_cliente} (general)"

    class Meta:
        verbose_name = "Solicitud de Cotización"
        verbose_name_plural = "Solicitudes de Cotización"
        ordering = ['-fecha_solicitud']

class MensajeContacto(models.Model):
    nombre_remitente = models.CharField(max_length=150)
    email_remitente = models.EmailField()
    asunto = models.CharField(max_length=200, blank=True, null=True) # Asunto puede ser opcional
    mensaje = models.TextField()
    fecha_envio = models.DateTimeField(auto_now_add=True)
    leido = models.BooleanField(default=False)

    def __str__(self):
        # Usamos self.id para el número de mensaje.
        mensaje_num = self.id if self.id else "Nuevo"
        return f"Mensaje #{mensaje_num} de {self.nombre_remitente} ({self.email_remitente})"

    class Meta:
        verbose_name = "Mensaje de Contacto"
        verbose_name_plural = "Mensajes de Contacto"
        ordering = ['-fecha_envio']

class ConfiguracionSitio(models.Model):
    email_notificaciones_admin = models.EmailField(
        verbose_name="Email para Notificaciones del Administrador",
        help_text="Correo donde se recibirán las notificaciones de nuevas solicitudes de cotización, mensajes de contacto, etc."
    )
    # Aquí podrías añadir más campos de configuración global en el futuro si los necesitas.
    # Por ejemplo:
    # nombre_visible_sitio = models.CharField(max_length=100, default="El Nombre de Tu Página", blank=True)
    # telefono_principal_contacto = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        # Esto ayuda a identificar la única instancia en el admin.
        return "Configuración General del Sitio (Editar Única Entrada)"

    class Meta:
        verbose_name = "Configuración del Sitio"
        # Usamos el mismo nombre en singular y plural para enfatizar que solo debe haber una.
        verbose_name_plural = "Configuración del Sitio"

# --- NUEVO MODELO PARA EL CHATBOT ---
class ChatbotQA(models.Model):
    keywords = models.TextField(
        verbose_name="Palabras Clave (separadas por comas)",
        help_text="Escribe palabras clave que activarán esta respuesta, separadas por comas. Ej: horario, atencion, abierto"
    )
    respuesta = models.TextField(
        help_text="La respuesta que el chatbot debe dar."
    )

    def __str__(self):
        # Muestra las primeras palabras clave en el admin para fácil identificación
        return f"Respuesta para: '{self.keywords.split(',')[0].strip()}'"

    class Meta:
        verbose_name = "Pregunta/Respuesta del Chatbot"
        verbose_name_plural = "Preguntas y Respuestas del Chatbot"