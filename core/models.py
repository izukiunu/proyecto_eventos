# core/models.py
import uuid # Para el ticket ID
from django.db import models

class Servicio(models.Model):
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField()
    imagen = models.ImageField(upload_to='servicios/', blank=True, null=True, help_text="Imagen opcional del servicio")

    def __str__(self):
        return self.nombre

class SolicitudCotizacion(models.Model):
    # --- NUEVO CAMPO PARA EL TICKET ---
    ticket_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    # ----------------------------------
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
        # Usamos una parte del UUID para un identificador más corto en el __str__
        ticket_corto = str(self.ticket_id).split('-')[-1].upper()
        if self.servicio_interesado:
            return f"Ticket {ticket_corto} - {self.nombre_cliente} para '{self.servicio_interesado.nombre}'"
        return f"Ticket {ticket_corto} - {self.nombre_cliente} (general)"

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
        return f"Mensaje de {self.nombre_remitente} ({self.email_remitente}) - {self.fecha_envio.strftime('%Y-%m-%d')}"

    class Meta:
        verbose_name = "Mensaje de Contacto"
        verbose_name_plural = "Mensajes de Contacto"
        ordering = ['-fecha_envio']

# --- NUEVO MODELO PARA CONFIGURACIÓN DEL SITIO ---
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