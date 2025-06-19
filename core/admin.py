# core/admin.py
from django.contrib import admin
# Asegúrate de importar todos los modelos que vas a registrar
from .models import Servicio, Oferta, SolicitudCotizacion, MensajeContacto, ConfiguracionSitio, ChatbotQA, Proyecto, ImagenProyecto, SeccionSobreNosotros, PuntoClaveSobreNosotros, Testimonio, ImagenSobreNosotros, ImagenTestimonio
from django.utils.html import mark_safe




class OfertaInline(admin.StackedInline): # O usa admin.TabularInline para una vista más compacta
    model = Oferta
    can_delete = True
    verbose_name_plural = 'Oferta Asociada'
    # 'extra = 0' evita que se muestren formularios de oferta vacíos por defecto.
    extra = 0

# Registro para Servicio (simple, sin clase Admin personalizada por ahora)
@admin.register(Servicio)
class ServicioAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'destacado', 'precio') # Muestra si es destacado en la lista
    list_filter = ('destacado',) # Permite filtrar por destacados
    list_editable = ('destacado',) # Permite cambiarlo directamente desde la lista (muy útil)
    inlines = (OfertaInline,)

class ImagenSobreNosotrosInline(admin.TabularInline):
    model = ImagenSobreNosotros
    extra = 1
    verbose_name_plural = "Galería de Imágenes"



# Admin para SolicitudCotizacion
class SolicitudCotizacionAdmin(admin.ModelAdmin):
    list_display = ('id_como_ticket', 'nombre_cliente', 'servicio_interesado', 'email_cliente', 'fecha_solicitud', 'atendida')
    list_filter = ('atendida', 'fecha_solicitud', 'servicio_interesado')
    search_fields = ('id', 'nombre_cliente', 'email_cliente', 'descripcion_evento', 'servicio_interesado__nombre')
    # 'id' es de solo lectura por defecto y no necesita estar en readonly_fields.
    # El campo 'ticket_id' (UUID) ya no existe si seguimos el plan de usar solo 'id'.
    readonly_fields = ('fecha_solicitud',) # 'id' ya es readonly

    def id_como_ticket(self, obj):
        return f"#{obj.id}" # Usamos el id directamente
    id_como_ticket.short_description = 'Ticket #' # Nombre de la columna
    id_como_ticket.admin_order_field = 'id' # Permite ordenar por esta columna (que es el ID)
admin.site.register(SolicitudCotizacion, SolicitudCotizacionAdmin)

# Admin para MensajeContacto
class MensajeContactoAdmin(admin.ModelAdmin):
    list_display = ('id_como_mensaje', 'nombre_remitente', 'email_remitente', 'asunto', 'fecha_envio', 'leido')
    list_filter = ('leido', 'fecha_envio')
    search_fields = ('id', 'nombre_remitente', 'email_remitente', 'asunto', 'mensaje')
    readonly_fields = ('fecha_envio', 'nombre_remitente', 'email_remitente', 'asunto', 'mensaje')

    def id_como_mensaje(self, obj):
        return f"Msg #{obj.id}"
    id_como_mensaje.short_description = 'Mensaje #'
    id_como_mensaje.admin_order_field = 'id'

    def mark_as_leido(self, request, queryset):
        queryset.update(leido=True)
    mark_as_leido.short_description = "Marcar seleccionados como leídos"

    def mark_as_no_leido(self, request, queryset):
        queryset.update(leido=False)
    mark_as_no_leido.short_description = "Marcar seleccionados como no leídos"

    actions = [mark_as_leido, mark_as_no_leido]
admin.site.register(MensajeContacto, MensajeContactoAdmin)

# Admin para ConfiguracionSitio
@admin.register(ConfiguracionSitio) # Usando el decorador para registrar
class ConfiguracionSitioAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'email_notificaciones_admin')

    def has_add_permission(self, request):
        # Permite añadir una configuración solo si no existe ninguna todavía.
        return not ConfiguracionSitio.objects.exists()

    def has_delete_permission(self, request, obj=None):
        # No permitir borrar la configuración para asegurar que siempre exista una.
        return False
@admin.register(ChatbotQA)
class ChatbotQAAdmin(admin.ModelAdmin):
    list_display = ('keywords', 'respuesta')
    search_fields = ('keywords', 'respuesta')


from .models import HeroSlide
from django.db.models import Max

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

    # Método para reordenar los slides al guardar
    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        
        # Una vez que el objeto se guarda, reordenamos todos los slides activos
        self.reorder_hero_slides()

    # Opción adicional: Hook para reordenar al eliminar (útil si hay gaps)
    def delete_model(self, request, obj):
        super().delete_model(request, obj)
        self.reorder_hero_slides()

    # Función para reordenar de 1 en adelante sin saltos
    def reorder_hero_slides(self):
        active_slides = HeroSlide.objects.filter(is_active=True).order_by('order', 'id') # Ordena por order y luego por ID para consistencia
        current_order = 1
        for slide in active_slides:
            if slide.order != current_order:
                slide.order = current_order
                slide.save(update_fields=['order']) # Guarda solo el campo 'order'
            current_order += 1

# Inline para añadir imágenes directamente desde la página del proyecto
class ImagenProyectoInline(admin.TabularInline):
    model = ImagenProyecto
    extra = 1  # Muestra 1 campo de imagen vacío por defecto
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

    # Para asegurar que solo haya UNA instancia de esta sección
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