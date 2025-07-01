# core/models.py
# import uuid # Ya no es necesario para SolicitudCotizacion
from django.db import models
from django.core.exceptions import ValidationError
from django.templatetags.static import static
from django.utils.html import format_html
import json
# ==============================================================================
# === MODELO SERVICIO EVOLUCIONADO ===
# ==============================================================================
class Servicio(models.Model):
    """
    Modelo evolucionado que puede representar un Pack, un Servicio Independiente,
    o un Adicional exclusivo para Packs, manteniendo la compatibilidad.
    """
    # --- NUEVO: Enumeración para definir el tipo de servicio (colocada DENTRO de la clase) ---
    class Tipo(models.TextChoices):
        PACK = 'PACK', 'Pack Prediseñado'
        INDEPENDIENTE = 'INDEPENDIENTE', 'Producto o Servicio Independiente'
        ADICIONAL_PACK = 'ADICIONAL_PACK', 'Adicional exclusivo para Pack'
    class DurationUnit(models.TextChoices):
        MINUTES = 'MINUTOS', 'Minutos'
        HOURS = 'HORAS', 'Horas'

    # --- CAMPOS PRINCIPALES (EXISTENTES Y MODIFICADOS) ---
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(
    blank=True, 
    null=True, 
    verbose_name="Descripción (Opcional)"
)    
    # --- NUEVO: Campo para clasificar el servicio ---
    tipo_servicio = models.CharField(
        max_length=20,
        choices=Tipo.choices,
        default=Tipo.INDEPENDIENTE,
        verbose_name="Tipo de Servicio",
        help_text="Clasifica el ítem como un Pack o un servicio individual."
    )
    
    # --- MODIFICADO: Cambiado a DecimalField para más consistencia ---
    precio = models.DecimalField(
        verbose_name="Precio Base",
        max_digits=10,
        decimal_places=0, # Usamos 0 decimales para CLP
        default=0,
        help_text="Precio base del ítem. Si usa precios por niveles, dejar en 0."
    )
    
    destacado = models.BooleanField(
        default=False,
        verbose_name="Servicio Destacado",
        help_text="Marcar para que aparezca en la sección de destacados."
    )

    # --- NUEVO: Campo para manejar precios variables ---
    has_tiered_pricing = models.BooleanField(
        default=False, 
        verbose_name="¿Usa Precios por Niveles?",
        help_text="Marcar si este servicio tiene múltiples precios (ej. por horas)."
    )

    # --- NUEVO: Campos específicos para Packs ---
    max_guests = models.PositiveIntegerField(
        verbose_name="Máximo de Invitados (para Packs)",
        null=True, blank=True,
        help_text="Solo llenar si este ítem es un Pack."
    )
    # --- CAMBIADO: 'duration_hours' se reemplaza por 'duration' y 'duration_unit' ---
    duration = models.PositiveIntegerField(
        verbose_name="Duración (valor)",
        null=True, blank=True,
        help_text="El valor numérico de la duración (ej: 30, 2, 5)."
    )
    duration_unit = models.CharField(
        max_length=10,
        choices=DurationUnit.choices,
        default=DurationUnit.HOURS,
        verbose_name="Unidad de Duración",
        null=True, blank=True,
        help_text="La unidad para el valor de duración (Horas o Minutos)."
    )
    permite_cantidad = models.BooleanField(
        default=False,
        verbose_name="¿Permite seleccionar cantidad?",
        help_text="Marcar si este servicio es por unidades (ej: horas extra, sillas adicionales)."
    )
    max_cantidad = models.PositiveIntegerField(
        null=True, blank=True,
        verbose_name="Cantidad Máxima (Opcional)",
        help_text="Si permite cantidad, establece un límite. Déjalo vacío para no tener límite."
    )
    servicios_compatibles = models.ManyToManyField(
        'self',
        blank=True,
        symmetrical=False,
        verbose_name="Servicios Principales Compatibles",
        help_text="Si este es un servicio ADITIVO, selecciona a qué servicios principales se puede añadir."
    )
    @property
    def display_duration(self):
        """Devuelve un string formateado para la duración, ej: '30 minutos'."""
        if self.duration and self.duration_unit:
            # get_duration_unit_display() obtiene el valor legible de las choices (ej: "Minutos")
            return f"{self.duration} {self.get_duration_unit_display().lower()}"
        return None
    
    def get_thumbnail_url(self):
        """
        Busca la primera IMAGEN en la galería del servicio y devuelve su URL.
        Si no hay imágenes, devuelve la URL de una imagen genérica.
        """
        primera_imagen = self.media_gallery.filter(media_type='IMAGE').order_by('orden').first()
        
        if primera_imagen:
            return primera_imagen.media_file.url
        else:
            return static('img/placeholder_evento.jpg')
    

    # --- MODIFICADO: __str__ más descriptivo ---
    def __str__(self):
        return f"{self.nombre} ({self.get_tipo_servicio_display()})"


# ==============================================================================
# === NUEVO MODELO PARA PRECIOS POR NIVELES ===
# ==============================================================================
class PriceTier(models.Model):
    """
    Permite definir múltiples precios para un único Servicio.
    Ej: 1 hora $120.000, 2 horas $150.000
    """
    servicio = models.ForeignKey(Servicio, on_delete=models.CASCADE, related_name='price_tiers')
    description = models.CharField(max_length=255, help_text="Ej: '2 horas', '2 Robot en zancos'")
    price = models.DecimalField(max_digits=10, decimal_places=0, help_text="Precio para este nivel, sin decimales.")

    class Meta:
        verbose_name = "Nivel de Precio"
        verbose_name_plural = "Niveles de Precio"

    def __str__(self):
        return f"{self.servicio.nombre} - {self.description} (${self.price})"


# ==============================================================================
# === MODELO OFERTA (Se mantiene sin cambios) ===
# ==============================================================================
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
# ==============================================================================
# === NUEVO MODELO PARA LA GALERÍA DE IMÁGENES Y VIDEOS ===
# ==============================================================================
class ServicioMedia(models.Model):
    """
    Modelo para asociar múltiples imágenes y videos a un único Servicio.
    """
    class MediaType(models.TextChoices):
        IMAGE = 'IMAGE', 'Imagen'
        VIDEO = 'VIDEO', 'Video'

    servicio = models.ForeignKey(Servicio, on_delete=models.CASCADE, related_name='media_gallery')
    
    # Usamos FileField para que acepte tanto imágenes como videos
    media_file = models.FileField(
        upload_to='servicios_media/',
        help_text="Sube una imagen o un video corto (MP4)."
    )
    
    media_type = models.CharField(
        max_length=10,
        choices=MediaType.choices,
        default=MediaType.IMAGE,
        verbose_name="Tipo de Medio"
    )
    
    orden = models.PositiveIntegerField(default=0, help_text="Orden de aparición en la galería.")

    class Meta:
        verbose_name = "Medio de Servicio"
        verbose_name_plural = "Galería de Medios del Servicio"
        ordering = ['orden']
    

    def __str__(self):
        return f"Medio para {self.servicio.nombre}"

class SolicitudCotizacion(models.Model):
    """
    Modelo para almacenar las solicitudes de cotización de los clientes.
    """
    nombre_cliente = models.CharField(max_length=150)
    email_cliente = models.EmailField()
    telefono_cliente = models.CharField(max_length=20)
    
    # Campo para la descripción libre del evento (modificado para ser blank/null)
    descripcion_evento = models.TextField(
        blank=True,
        null=True,
        help_text="Descripción adicional del evento proporcionada por el cliente."
    )
    
    # NUEVO CAMPO: Para almacenar el JSON completo del carrito
    # Si usas PostgreSQL, puedes usar models.JSONField para un manejo nativo de JSON.
    # cotizacion_detallada_json = models.JSONField(blank=True, null=True, verbose_name="Detalles de Cotización (JSON)")
    # Para compatibilidad con otras bases de datos (SQLite, MySQL), usa TextField y maneja el JSON manualmente.
    cotizacion_detallada_json = models.TextField(
        blank=True,
        null=True,
        verbose_name="Detalles de Cotización (JSON)",
        help_text="Datos JSON serializados de los ítems del carrito."
    )

    fecha_solicitud = models.DateTimeField(auto_now_add=True)
    
    # NUEVO CAMPO: Estado de la solicitud
    class EstadoSolicitud(models.TextChoices):
        PENDIENTE = 'PENDIENTE', 'Pendiente'
        EN_PROCESO = 'EN_PROCESO', 'En Proceso'
        COTIZADO = 'COTIZADO', 'Cotizado'
        COMPLETADO = 'COMPLETADO', 'Completado'
        CANCELADO = 'CANCELADO', 'Cancelado'
        RECHAZADO = 'RECHAZADO', 'Rechazado'

    estado = models.CharField(
        max_length=20,
        choices=EstadoSolicitud.choices,
        default=EstadoSolicitud.PENDIENTE,
        verbose_name="Estado de la Solicitud"
    )

    class Meta:
        verbose_name = "Solicitud de Cotización"
        verbose_name_plural = "Solicitudes de Cotización"
        ordering = ['-fecha_solicitud']

    def __str__(self):
        ticket_num = self.id if self.id else "Nuevo"
        # El campo 'servicio_interesado' se elimina del __str__ ya que ahora tenemos 'cotizacion_detallada_json'
        # y la descripción de evento, haciendo el `servicio_interesado` menos relevante para el resumen.
        return f"Solicitud #{ticket_num} de {self.nombre_cliente} ({self.fecha_solicitud.strftime('%Y-%m-%d')})"

    def get_cotizacion_detalles_list(self):
        """Devuelve los detalles de la cotización como una lista de objetos Python."""
        if self.cotizacion_detallada_json:
            try:
                return json.loads(self.cotizacion_detallada_json)
            except json.JSONDecodeError:
                return []
        return []

    def calcular_monto_total_estimado(self):
        """Calcula el monto total estimado de la cotización a partir de los ítems en el JSON."""
        total = 0
        detalles = self.get_cotizacion_detalles_list()
        for item in detalles:
            precio_unitario = float(item.get('precioNumerico', 0))
            cantidad = int(item.get('cantidad', 1))
            total += precio_unitario * cantidad
        return total

    def display_cotizacion_details_html(self):
        """Genera un HTML legible de los detalles de la cotización para el panel de administración."""
        details = self.get_cotizacion_detalles_list()
        if not details:
            return "No se especificaron servicios."
        
        html = '<ul style="list-style-type: disc; margin-left: 20px;">'
        for item in details:
            item_html = f"<li><strong>{item.get('nombre', 'N/A')}</strong> (Cant: {item.get('cantidad', 1)})"
            
            precio_base = item.get('precioBaseOriginal', 0)
            precio_oferta = item.get('precioOferta', 0)
            precio_numerico = item.get('precioNumerico', 0)
            
            if precio_oferta and precio_oferta > 0 and precio_oferta < precio_base:
                item_html += f" - P.U.: <del>${precio_base:,.0f}</del> <strong>${precio_oferta:,.0f} CLP</strong>"
                if item.get('descripcionOferta'):
                    item_html += f" <em>({item.get('descripcionOferta')})</em>"
            else:
                item_html += f" - P.U.: <strong>${precio_numerico:,.0f} CLP</strong>"
            
            if item.get('fechaInicio'):
                item_html += f" - Fecha: {item['fechaInicio']}"
            if item.get('tipo_servicio') and item['tipo_servicio'] != 'INDEPENDIENTE':
                item_html += f" ({item['tipo_servicio'].replace('_', ' ').lower()})"
            if item.get('max_guests'):
                item_html += f" - Máx Invitados: {item['max_guests']}"
            if item.get('duration_hours'):
                item_html += f" - Duración: {item['duration_hours']} Hrs"
            if item.get('descripcion'):
                item_html += f"<br/><small><em>{item['descripcion'][:50]}...</em></small>" # Truncar descripción
            
            item_html += '</li>'
            html += item_html
        
        html += f'</ul><p><strong>Total Estimado: ${self.calcular_monto_total_estimado():,.0f} CLP</strong></p>'
        return format_html(html) # Usar format_html para renderizar como HTML en el admin
    
    display_cotizacion_details_html.short_description = "Detalles de Cotización"

class MensajeContacto(models.Model):
    nombre_remitente = models.CharField(max_length=150)
    email_remitente = models.EmailField()
    asunto = models.CharField(max_length=200, blank=True, null=True)
    mensaje = models.TextField()
    fecha_envio = models.DateTimeField(auto_now_add=True)
    leido = models.BooleanField(default=False)

    def __str__(self):
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
    # ... (Otros campos de ConfiguraciónSitio si los tienes) ...

    def __str__(self):
        return "Configuración General del Sitio (Editar Única Entrada)"

    class Meta:
        verbose_name = "Configuración del Sitio"
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
