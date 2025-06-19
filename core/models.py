# core/models.py
# import uuid # Ya no es necesario para SolicitudCotizacion
from django.db import models
from django.core.exceptions import ValidationError

class Servicio(models.Model):
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField()
    imagen = models.ImageField(upload_to='servicios/', blank=True, null=True, help_text="Imagen opcional del servicio")
    destacado = models.BooleanField(
        default=False,
        verbose_name="Servicio Destacado",
        help_text="Marcar para que este servicio aparezca en la sección de destacados.")
    precio = models.PositiveIntegerField(
        verbose_name="Precio Base (Opcional)",
        null=True,
        blank=True,
        help_text="Precio base del servicio."
    )

    def __str__(self):
        return self.nombre
class Oferta(models.Model):
    # Relación uno-a-uno: Un servicio solo puede tener una oferta a la vez.
    servicio = models.OneToOneField(
        Servicio, 
        on_delete=models.CASCADE, 
        related_name='oferta',
        verbose_name="Servicio asociado"
    )
    # Precio de la oferta, también como número entero. Es obligatorio.
    precio_oferta = models.PositiveIntegerField(
        verbose_name="Precio de Oferta",
        help_text="El precio especial con el descuento aplicado."
    )
    descripcion_oferta = models.CharField(
        max_length=255, 
        blank=True, 
        null=True, 
        verbose_name="Descripción de la oferta (ej: 'Solo por este mes!')"
    )
    # Interruptor para activar/desactivar la oferta fácilmente.
    activa = models.BooleanField(
        default=True,
        verbose_name="¿Oferta activa?",
        help_text="Desmarca esta casilla para ocultar la oferta sin borrarla."
    )

    def clean(self):
        """
        Validación personalizada: Asegura que no se pueda crear una oferta
        para un servicio que no tiene un precio base definido.
        """
        if not self.servicio.precio or self.servicio.precio <= 0:
            raise ValidationError('No se puede crear una oferta para un servicio que no tiene un precio base asignado.')

    def __str__(self):
        return f"Oferta para '{self.servicio.nombre}' - Precio: ${self.precio_oferta}"

    class Meta:
        verbose_name = "Oferta"
        verbose_name_plural = "Ofertas"

class SolicitudCotizacion(models.Model):
    # EL CAMPO ticket_id (UUIDField) HA SIDO ELIMINADO. Usaremos el 'id' automático.
    nombre_cliente = models.CharField(max_length=150)
    email_cliente = models.EmailField()
    telefono_cliente = models.CharField(max_length=20)
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
from django.db import models

class HeroSlide(models.Model):
    # Título principal del slide
    title = models.CharField(max_length=200, verbose_name="Título del Slide")
    # Texto descriptivo más pequeño
    subtitle = models.TextField(max_length=500, blank=True, verbose_name="Subtítulo del Slide (opcional)")
    # Imagen de fondo para el slide
    background_image = models.ImageField(upload_to='hero_slides/', verbose_name="Imagen de Fondo")
    # URL a la que redirige el botón (opcional)
    button_link = models.URLField(max_length=200, blank=True, null=True, verbose_name="Enlace del Botón (opcional)")
    # Texto del botón (opcional, si hay un enlace)
    button_text = models.CharField(max_length=50, blank=True, verbose_name="Texto del Botón (opcional)")
    
    # MODIFICACIÓN CLAVE AQUÍ: Usamos PositiveIntegerField y default=1
    order = models.PositiveIntegerField(default=1, verbose_name="Orden de aparición", help_text="Número de orden para los slides (1, 2, 3...). Sin números negativos.")
    
    is_active = models.BooleanField(default=True, verbose_name="¿Activo?")

    class Meta:
        verbose_name = "Slide de Inicio"
        verbose_name_plural = "Slides de Inicio"
        # Esto ya estaba bien, asegura el orden ascendente
        ordering = ['order'] 

    def __str__(self):
        return self.title
# --- MODELOS PARA LA SECCIÓN "PROYECTOS REALIZADOS" ---

class Proyecto(models.Model):
    titulo = models.CharField(max_length=200, verbose_name="Título del Proyecto")
    descripcion = models.TextField(verbose_name="Descripción del Proyecto")
    fecha_realizacion = models.DateField(verbose_name="Fecha de Realización", null=True, blank=True)
    activo = models.BooleanField(default=True, help_text="Marcar para que se muestre en la página de inicio.")
    orden = models.PositiveIntegerField(default=0, help_text="Orden de aparición (0 primero).")

    class Meta:
        verbose_name = "Proyecto Realizado"
        verbose_name_plural = "Proyectos Realizados"
        ordering = ['orden']

    def __str__(self):
        return self.titulo

class ImagenProyecto(models.Model):
    proyecto = models.ForeignKey(Proyecto, related_name='imagenes', on_delete=models.CASCADE)
    imagen = models.ImageField(upload_to='proyectos/', verbose_name="Imagen del Proyecto")
    alt_text = models.CharField(max_length=255, blank=True, verbose_name="Texto alternativo (accesibilidad)")

    class Meta:
        verbose_name = "Imagen de Proyecto"
        verbose_name_plural = "Imágenes de Proyectos"

    def __str__(self):
        return f"Imagen para {self.proyecto.titulo}"


# --- MODELOS PARA LA SECCIÓN "SOBRE NOSOTROS" (Personalizable) ---

class SeccionSobreNosotros(models.Model):
    titulo = models.CharField(max_length=200, default="Transformamos Tu Visión en un Evento Inolvidable")
    descripcion = models.TextField()

    class Meta:
        verbose_name = "Sección Sobre Nosotros"
        verbose_name_plural = "Sección Sobre Nosotros"

    def __str__(self):
        return "Contenido de la Sección 'Sobre Nosotros'"
    
class ImagenSobreNosotros(models.Model):
    seccion = models.ForeignKey(SeccionSobreNosotros, related_name='imagenes', on_delete=models.CASCADE)
    imagen = models.ImageField(upload_to='sobre_nosotros_galeria/', verbose_name="Imagen de la Galería")
    orden = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['orden']
        verbose_name = "Imagen de Sobre Nosotros"
        verbose_name_plural = "Imágenes de Sobre Nosotros"

class PuntoClaveSobreNosotros(models.Model):
    seccion = models.ForeignKey(SeccionSobreNosotros, related_name='puntos_clave', on_delete=models.CASCADE)
    texto = models.CharField(max_length=255, verbose_name="Texto del Punto Clave")
    orden = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Punto Clave"
        verbose_name_plural = "Puntos Clave"
        ordering = ['orden']
    
    def __str__(self):
        return self.texto


# --- MODELO PARA LOS TESTIMONIOS (Carrusel Pequeño) ---

class Testimonio(models.Model):
    cita = models.TextField(verbose_name="Cita o Comentario")
    autor = models.CharField(max_length=100, verbose_name="Autor del testimonio")
    descripcion_autor = models.CharField(max_length=150, blank=True, verbose_name="Descripción del autor (ej: 'Matrimonio, Enero 2025')")
    activo = models.BooleanField(default=True)
    orden = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Testimonio"
        verbose_name_plural = "Testimonios"
        ordering = ['orden']

    def __str__(self):
        return f"Testimonio de {self.autor}"
    
class ImagenTestimonio(models.Model):
    testimonio = models.ForeignKey(Testimonio, related_name='imagenes', on_delete=models.CASCADE)
    imagen = models.ImageField(upload_to='testimonios/', verbose_name="Imagen del Testimonio")
    alt_text = models.CharField(max_length=255, blank=True, verbose_name="Texto alternativo")

    class Meta:
        verbose_name = "Imagen de Testimonio"
        verbose_name_plural = "Imágenes de Testimonios"
