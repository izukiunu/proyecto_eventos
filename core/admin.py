# core/admin.py
from django.contrib import admin
from django.utils.html import mark_safe # Importar mark_safe para HTML seguro en el admin

# --- MODIFICADO: Aseguramos que todos los modelos, incluyendo los nuevos, estén importados ---
from .models import (
    Servicio, Oferta, SolicitudCotizacion, MensajeContacto, ConfiguracionSitio, 
    ChatbotQA, Proyecto, ImagenProyecto, SeccionSobreNosotros, PuntoClaveSobreNosotros, 
    Testimonio, ImagenSobreNosotros, ImagenTestimonio, HeroSlide, 
    PriceTier, ServicioMedia
)


# ==============================================================================
# --- DEFINICIÓN DE LOS FORMULARIOS INLINE PARA SERVICIO ---
# ==============================================================================

class ServicioMediaInline(admin.TabularInline):
    model = ServicioMedia
    extra = 1
    verbose_name_plural = "Galería de Imágenes y Videos (para el carrusel de detalle)"

class PriceTierInline(admin.TabularInline):
    model = PriceTier
    extra = 1
    verbose_name_plural = "Precios por Niveles (si aplica)"

class OfertaInline(admin.StackedInline):
    model = Oferta
    extra = 0
    can_delete = True
    verbose_name_plural = 'Oferta Asociada'

## ==============================================================================
# --- VERSIÓN FINAL Y COMPLETA DE ServicioAdmin ---
# ==============================================================================
@admin.register(Servicio)
class ServicioAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'tipo_servicio', 'precio', 'destacado')
    list_filter = ('tipo_servicio', 'destacado', 'has_tiered_pricing')
    search_fields = ('nombre', 'descripcion')
    
    # --- LA LÍNEA CLAVE QUE FALTABA ---
    # Esta línea le dice a Django que use el widget avanzado para este campo.
    filter_horizontal = ('servicios_compatibles',)

    # --- El orden de los inlines aquí afecta cómo aparecen al final de la página ---
    inlines = (ServicioMediaInline, PriceTierInline, OfertaInline,)

    # --- Usamos fieldsets para organizar el formulario de forma lógica ---
    fieldsets = (
        ('1. Información General', {
            'fields': ('nombre', 'tipo_servicio', 'descripcion')
        }),
        ('2. Configuración de Precios', {
            'fields': ('precio', 'has_tiered_pricing', ('permite_cantidad', 'max_cantidad')),
            'description': "Los 'Precios por Niveles' y las 'Ofertas' se gestionan en las secciones de abajo, después de guardar por primera vez."
        }),
        ('3. Vinculación de Adicionales (Opcional)', {
            'classes': ('collapse',),
            'fields': ('servicios_compatibles',),
            'description': 'Si este es un servicio Aditivo, selecciona aquí los servicios base a los que se puede añadir.'
        }),
        ('4. Detalles Adicionales (Opcional)', {
            'classes': ('collapse',),
            'fields': ('max_guests', ('duration', 'duration_unit')) 
        }),
        ('5. Visibilidad en el Sitio', {
            'fields': ('destacado',)
        }),
    )


class ImagenSobreNosotrosInline(admin.TabularInline):
    model = ImagenSobreNosotros
    extra = 1
    verbose_name_plural = "Galería de Imágenes"


# --- BLOQUE MODIFICADO PARA SolicitudCotizacionAdmin ---
@admin.register(SolicitudCotizacion)
class SolicitudCotizacionAdmin(admin.ModelAdmin):
    # 'id' se usa directamente como Ticket #, 'servicio_interesado' se elimina del list_display
    list_display = (
        'id', 
        'nombre_cliente', 
        'email_cliente', 
        'telefono_cliente', 
        'fecha_solicitud', 
        'estado', # Mostrar el nuevo campo de estado
        'monto_total_estimado_display' # Nuevo campo para mostrar el monto
    )
    # Filtra por estado y fecha. 'servicio_interesado' se elimina del list_filter
    list_filter = ('estado', 'fecha_solicitud') 
    # Añadir 'cotizacion_detallada_json' para búsqueda y remover 'servicio_interesado__nombre'
    search_fields = ('id', 'nombre_cliente', 'email_cliente', 'telefono_cliente', 'descripcion_evento', 'cotizacion_detallada_json')
    
    # 'fecha_solicitud' y los nuevos campos calculados/HTML son de solo lectura
    readonly_fields = ('fecha_solicitud', 'display_cotizacion_details_html', 'monto_total_estimado_display') 
    
    fieldsets = (
        (None, {
            'fields': ('nombre_cliente', 'email_cliente', 'telefono_cliente', 'estado', 'fecha_solicitud')
        }),
        ('Descripción del Evento', { # Renombrado
            'fields': ('descripcion_evento',)
        }),
        ('Servicios Solicitados', {
            'fields': ('cotizacion_detallada_json', 'display_cotizacion_details_html', 'monto_total_estimado_display') 
        }),
    )

    # Método para mostrar el monto total estimado formateado
    def monto_total_estimado_display(self, obj):
        monto = obj.calcular_monto_total_estimado()
        return f"${monto:,.0f} CLP" # Formato de miles sin decimales
    monto_total_estimado_display.short_description = "Monto Estimado"
    # Permite ordenar por ID, aunque el monto es calculado
    monto_total_estimado_display.admin_order_field = 'id' 


# Admin para MensajeContacto (se mantiene con cambios de antes)
@admin.register(MensajeContacto) 
class MensajeContactoAdmin(admin.ModelAdmin):
    list_display = ('id', 'nombre_remitente', 'email_remitente', 'asunto', 'fecha_envio', 'leido') 
    list_filter = ('leido', 'fecha_envio')
    search_fields = ('id', 'nombre_remitente', 'email_remitente', 'asunto', 'mensaje')
    readonly_fields = ('fecha_envio', 'nombre_remitente', 'email_remitente', 'asunto', 'mensaje')

    def mark_as_leido(self, request, queryset):
        queryset.update(leido=True)
    mark_as_leido.short_description = "Marcar seleccionados como leídos"

    def mark_as_no_leido(self, request, queryset):
        queryset.update(leido=False)
    mark_as_no_leido.short_description = "Marcar seleccionados como no leídos"

    actions = [mark_as_leido, mark_as_no_leido]


# Admin para ConfiguracionSitio
@admin.register(ConfiguracionSitio)
class ConfiguracionSitioAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'email_notificaciones_admin')

    def has_add_permission(self, request):
        return not ConfiguracionSitio.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False
        
@admin.register(ChatbotQA)
class ChatbotQAAdmin(admin.ModelAdmin):
    list_display = ('keywords', 'respuesta')
    search_fields = ('keywords', 'respuesta')

@admin.register(HeroSlide)
class HeroSlideAdmin(admin.ModelAdmin):
    list_display = ('title', 'order', 'is_active', 'background_image_tag')
    list_editable = ('order', 'is_active')
    search_fields = ('title', 'subtitle')
    list_filter = ('is_active',)

    def background_image_tag(self, obj):
        if obj.background_image:
            return mark_safe(f'<img src="{obj.background_image.url}" width="100" />')
        return "No Image"
    background_image_tag.short_description = 'Thumbnail'

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        self.reorder_hero_slides()

    def delete_model(self, request, obj):
        super().delete_model(request, obj)
        self.reorder_hero_slides()

    def reorder_hero_slides(self):
        active_slides = HeroSlide.objects.filter(is_active=True).order_by('order', 'id')
        current_order = 1
        for slide in active_slides:
            if slide.order != current_order:
                slide.order = current_order
                slide.save(update_fields=['order'])
            current_order += 1

# Inline para añadir imágenes directamente desde la página del proyecto
class ImagenProyectoInline(admin.TabularInline):
    model = ImagenProyecto
    extra = 1
    verbose_name_plural = "Imágenes del Proyecto"

@admin.register(Proyecto)
class ProyectoAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'fecha_realizacion', 'activo', 'orden')
    list_editable = ('activo', 'orden')
    inlines = [ImagenProyectoInline]

# Inline para los puntos clave de la sección "Sobre Nosotros"
class PuntoClaveSobreNosotrosInline(admin.TabularInline):
    model = PuntoClaveSobreNosotros
    extra = 1
    verbose_name_plural = "Puntos Clave (Viñetas)"

@admin.register(SeccionSobreNosotros)
class SeccionSobreNosotrosAdmin(admin.ModelAdmin):
    inlines = [PuntoClaveSobreNosotrosInline, ImagenSobreNosotrosInline]

    def has_add_permission(self, request):
        return not SeccionSobreNosotros.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False

# Inline para las imágenes de los Testimonios
class ImagenTestimonioInline(admin.TabularInline):
    model = ImagenTestimonio
    extra = 1
    verbose_name_plural = "Imágenes del Testimonio"

@admin.register(Testimonio)
class TestimonioAdmin(admin.ModelAdmin):
    list_display = ('autor', 'descripcion_autor', 'activo', 'orden')
    list_editable = ('activo', 'orden')
    inlines = [ImagenTestimonioInline]