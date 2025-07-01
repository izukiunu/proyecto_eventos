# core/views.py
import json # Para manejar JSON
import threading # Para tareas asíncronas
from urllib.parse import quote # Para codificar URLs de WhatsApp
import pdb 
from django.shortcuts import render, redirect, get_object_or_404
from django.views.generic import ListView, DetailView # Importar DetailView para ServicioDetailView
from django.contrib import messages
from django.http import JsonResponse # Para respuestas AJAX
from django.core.mail import send_mail # Para envío de emails
from django.conf import settings # Para acceder a las configuraciones de Django (DEFAULT_FROM_EMAIL)
from django.template.loader import render_to_string, get_template # <-- CORRECCIÓN: AÑADIDO get_template
from django.utils.html import strip_tags, escape # Para procesar HTML en emails y escapar texto en AJAX
from django.views.decorators.http import require_http_methods # Para restringir métodos HTTP
from django.urls import reverse
from django.contrib.admin.views.decorators import staff_member_required # Para vistas de administración
from django.contrib.auth.mixins import UserPassesTestMixin # Para Mixins de autorización en clases basadas en vistas
import re
# Importa todos tus modelos
from .models import (
    Servicio, SolicitudCotizacion, MensajeContacto, ConfiguracionSitio, 
    ChatbotQA, HeroSlide, Proyecto, Testimonio, SeccionSobreNosotros
)

# Importa todos tus formularios
from .forms import (
    SolicitudCotizacionForm, MensajeContactoForm, ServicioForm, ChatbotQAForm, ProyectoForm
)
# =================================================================================
# --- FUNCIONES AUXILIARES GLOBALES ---
# =================================================================================

def _send_emails_async(subject, html_message, plain_message, from_email, recipient_list):
    # ... (esta función se mantiene sin cambios) ...
    print(f"DEBUG EMAIL ASYNC: Intentando enviar email a {recipient_list} - Asunto: {subject}")
    try:
        send_mail(
            subject,
            plain_message,
            from_email,
            recipient_list,
            html_message=html_message,
            fail_silently=False, 
        )
        print(f"DEBUG EMAIL ASYNC: Email '{subject}' enviado con éxito a {recipient_list}.")
    except Exception as e:
        print(f"DEBUG EMAIL ASYNC: ERROR al enviar email '{subject}' a {recipient_list}: {e}")
        import traceback
        traceback.print_exc() 

# --- NUEVA FUNCIÓN AUXILIAR PARA EL FORMATO DE TIPO DE SERVICIO ---
def _format_tipo_servicio(tipo_servicio_raw):
    """
    Formatea el string del tipo de servicio (ej. 'ADICIONAL_PACK' a 'adicional pack').
    """
    if tipo_servicio_raw:
        return tipo_servicio_raw.replace('_', ' ').lower()
    return '' # Devuelve una cadena vacía si es None o vacío


# =================================================================================
# --- VISTAS PÚBLICAS ---
# =================================================================================

def home_carousel_view(request):
    """
    Vista principal para la página de inicio con contenido dinámico.
    """
    hero_slides = HeroSlide.objects.filter(is_active=True).order_by('order')
    servicios_destacados = Servicio.objects.filter(destacado=True).select_related('oferta').prefetch_related('media_gallery')

    proyectos = Proyecto.objects.filter(activo=True).prefetch_related('imagenes')
    testimonios = Testimonio.objects.filter(activo=True).prefetch_related('imagenes')
    
    try:
        sobre_nosotros = SeccionSobreNosotros.objects.prefetch_related('puntos_clave', 'imagenes').first()
    except SeccionSobreNosotros.DoesNotExist:
        sobre_nosotros = None

    context = {
        'hero_slides': hero_slides,
        'servicios_destacados': servicios_destacados,
        'proyectos': proyectos,
        'testimonios': testimonios,
        'sobre_nosotros': sobre_nosotros,
        'navbar_class': 'navbar-transparent'
    }
    print("DEBUG: home_carousel_view renderizando index.html") # DEBUG
    return render(request, 'core/index.html', context)


def index_view(request):
    servicios_destacados = Servicio.objects.filter(destacado=True).select_related('oferta').prefetch_related('media_gallery')
    context = {
        'servicios_destacados': servicios_destacados,
    }
    print("DEBUG: index_view renderizando index.html") # DEBUG
    return render(request, 'core/index.html', context)

class ListaServiciosView(ListView):
    model = Servicio
    template_name = 'core/lista_servicios.html'
    context_object_name = 'servicios'

    def get_queryset(self):
        print("DEBUG: ListaServiciosView obteniendo queryset.") # DEBUG
        return Servicio.objects.all().select_related('oferta').prefetch_related('media_gallery')
        
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        print("DEBUG: ListaServiciosView obteniendo context_data.") # DEBUG
        servicios_activos = self.get_queryset()
        
        context['packs'] = servicios_activos.filter(tipo_servicio=Servicio.Tipo.PACK)
        context['servicios_independientes'] = servicios_activos.filter(tipo_servicio=Servicio.Tipo.INDEPENDIENTE)
        context['servicios_adicionales'] = servicios_activos.filter(tipo_servicio=Servicio.Tipo.ADICIONAL_PACK)
        
        context.pop('object_list', None) 
        context.pop('servicio_list', None)
        
        return context

class ServicioDetailView(DetailView):
    model = Servicio
    template_name = 'core/servicio_detail.html'
    context_object_name = 'servicio'

    def get_queryset(self):
        print("DEBUG: ServicioDetailView obteniendo queryset.") # DEBUG
        return Servicio.objects.select_related('oferta').prefetch_related('media_gallery')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        print("DEBUG: ServicioDetailView obteniendo context_data.") # DEBUG
        servicio_actual = self.get_object()
        
        context['servicios_adicionales'] = Servicio.objects.filter(
            tipo_servicio=Servicio.Tipo.ADICIONAL_PACK,
            servicios_compatibles=servicio_actual
        ).select_related('oferta').prefetch_related('media_gallery')

        return context


# =================================================================================
# --- VISTA DE COTIZACIÓN (AJAX ENDPOINT) ---
# =================================================================================
@require_http_methods(["GET", "POST"])
def solicitar_cotizacion_view(request, servicio_id=None):
    print(f"DEBUG: solicitar_cotizacion_view recibido para método {request.method}.") # DEBUG
    if request.method == 'POST':
        form = SolicitudCotizacionForm(request.POST)
        print("DEBUG: Formulario de cotización creado con datos POST.") # DEBUG

        if form.is_valid():
            print("DEBUG: Formulario de cotización es válido.") # DEBUG
            try:
                solicitud = form.save(commit=False) 
                print("DEBUG: Instancia de SolicitudCotizacion creada (sin guardar todavía).") # DEBUG
                
                cotizacion_json_str = form.cleaned_data.get('cotizacion_detallada_json') 
                items_carrito = []
                
                if cotizacion_json_str:
                    print(f"DEBUG: cotizacion_detallada_json recibida: {cotizacion_json_str[:100]}...") # DEBUG
                    try:
                        items_carrito = json.loads(cotizacion_json_str)
                        print(f"DEBUG: JSON de carrito parseado exitosamente. Items: {len(items_carrito)}") # DEBUG
                    except json.JSONDecodeError:
                        print("ERROR: Fallo al parsear JSON de carrito.") # DEBUG
                        return JsonResponse({'success': False, 'message': "Error: Formato de servicios no válido. Contacte al administrador."}, status=400)
                else:
                    print("DEBUG: cotizacion_detallada_json está vacía o nula.") # DEBUG

                 # 1. Extrae los IDs tal cual vienen del frontend
                ids_desde_carrito = [item.get('id') for item in items_carrito if item.get('id')]
                print(f"DEBUG: IDs brutos desde el carrito: {ids_desde_carrito}")

                # 2. Procesa la lista para obtener solo los IDs numéricos base
                ids_numericos_limpios = []
                for item_id in ids_desde_carrito:
                    # Usamos una expresión regular para encontrar el primer número en el string del ID.
                    # Esto funciona para '5', '3-tier-2' y 'adicional-20-tier-16'
                    numeros_encontrados = re.findall(r'\d+', str(item_id))
                    if numeros_encontrados:
                        # Añade el primer número encontrado a nuestra lista de IDs limpios
                        ids_numericos_limpios.append(int(numeros_encontrados[0]))
                
                # 3. Crea una lista de IDs únicos para evitar consultas duplicadas
                ids_finales_unicos = list(set(ids_numericos_limpios))
                print(f"DEBUG: IDs limpios y únicos para la consulta: {ids_finales_unicos}")
                
                # 4. Ahora, usa la lista limpia y única para la consulta a la base de datos
                servicios_en_carrito_tipos = Servicio.objects.filter(id__in=ids_finales_unicos).values_list('tipo_servicio', flat=True)
                
                # --- FIN DE LA CORRECCIÓN ---

                tipos_de_servicio = set(servicios_en_carrito_tipos)
                print(f"DEBUG: Tipos de servicio en carrito: {tipos_de_servicio}") # DEBUG
                
                if 'ADICIONAL_PACK' in tipos_de_servicio and 'PACK' not in tipos_de_servicio:
                    print("ERROR: Validación de adicional sin pack fallida.") # DEBUG
                    return JsonResponse({'success': False, 'message': 'Error: Has seleccionado un servicio adicional que requiere un Pack. Por favor, añade un Pack a tu cotización para poder continuar.'}, status=400)

                solicitud.cotizacion_detallada_json = cotizacion_json_str 
                solicitud.save() 
                print(f"DEBUG: Solicitud de cotización guardada con ID: {solicitud.id}") # DEBUG

                admin_email_destino = settings.DEFAULT_FROM_EMAIL
                try:
                    config = ConfiguracionSitio.objects.first()
                    if config and config.email_notificaciones_admin:
                        admin_email_destino = config.email_notificaciones_admin
                    print(f"DEBUG: Email de admin para notificaciones: {admin_email_destino}") # DEBUG
                except Exception as e:
                    print(f"ERROR: Fallo al obtener email de config del sitio: {e}") # DEBUG

                subject_customer = 'Confirmación de tu Solicitud de Cotización - MejíaEventos'
                print(f"DEBUG: Intentando renderizar template de cliente: 'emails/confirmacion_solicitud_cliente.html'") # DEBUG

                try:
                    # Intenta cargar la plantilla para que el error sea explícito aquí si no se encuentra.
                    get_template('emails/confirmacion_solicitud_cliente.html') # <-- USO DE get_template
                    print("DEBUG: Template 'emails/confirmacion_solicitud_cliente.html' encontrado.") # DEBUG
                except Exception as e:
                    print(f"ERROR: Template 'emails/confirmacion_solicitud_cliente.html' NO encontrado: {e}") # DEBUG
                    # Si falla, el error se propagará y causará el 500, mostrando el traceback.
                    raise # Vuelve a lanzar la excepción para que el traceback sea visible

                html_message_customer = render_to_string(
                    'emails/confirmacion_solicitud_cliente.html', 
                    {'solicitud': solicitud} 
                )
                plain_message_customer = strip_tags(html_message_customer)
                print("DEBUG: Mensajes HTML/Plain de cliente renderizados.") # DEBUG
                
                subject_admin = f'NUEVA SOLICITUD DE COTIZACIÓN - {solicitud.nombre_cliente} (ID: {solicitud.id})'
                print(f"DEBUG: Intentando renderizar template de admin: 'emails/notificacion_admin_solicitud.html'") # DEBUG
                try:
                    get_template('emails/notificacion_admin_solicitud.html') # <-- USO DE get_template
                    print("DEBUG: Template 'emails/notificacion_admin_solicitud.html' encontrado.") # DEBUG
                except Exception as e:
                    print(f"ERROR: Template 'emails/notificacion_admin_solicitud.html' NO encontrado: {e}") # DEBUG
                    raise # Vuelve a lanzar la excepción para que el traceback sea visible

                html_message_admin = render_to_string(
                    'emails/notificacion_admin_solicitud.html', 
                    {'solicitud': solicitud, 'request': request} 
                )
                plain_message_admin = strip_tags(html_message_admin)
                print("DEBUG: Mensajes HTML/Plain de admin renderizados.") # DEBUG

                threading.Thread(target=_send_emails_async, args=(
                    subject_customer, html_message_customer, plain_message_customer,
                    settings.DEFAULT_FROM_EMAIL, [solicitud.email_cliente]
                )).start()
                print("DEBUG: Hilo de envío de email al cliente iniciado.") # DEBUG
                threading.Thread(target=_send_emails_async, args=(
                    subject_admin, html_message_admin, plain_message_admin,
                    settings.DEFAULT_FROM_EMAIL, [admin_email_destino]
                )).start()
                print("DEBUG: Hilo de envío de email al admin iniciado.") # DEBUG
                
                mensaje_wa_parts = []
                mensaje_wa_parts.append(f"¡Hola! Soy *{solicitud.nombre_cliente}*.")
                mensaje_wa_parts.append(f"He enviado una solicitud de cotización con ID: *#{solicitud.id}* en MejíaEventos.\n")
                
                if solicitud.descripcion_evento: 
                    mensaje_wa_parts.append(f"*Descripción del evento:* {solicitud.descripcion_evento}\n")

                if items_carrito:
                    # ... (código previo) ...
                    for item in items_carrito:
                        item_name = item.get('nombre', 'Servicio no especificado')
                        item_qty = item.get('cantidad', 1)
                        precio_numerico = float(item.get('precioNumerico', 0))
                        precio_base_original = float(item.get('precioBaseOriginal', 0))
                        precio_oferta = float(item.get('precioOferta', 0))

                        precio_display = ""
                        if precio_oferta and precio_oferta > 0 and precio_oferta < precio_base_original:
                            precio_display = f"Antes: ${precio_base_original:,.0f} Ahora: *${precio_oferta:,.0f} CLP*"
                            if item.get('descripcionOferta'):
                                precio_display += f" ({item['descripcionOferta']})"
                        else:
                            precio_display = f"*${precio_numerico:,.0f} CLP*"
                        
                        item_block = []
                        item_block.append(f"\n*--- {item_name} (x{item_qty}) ---*")
                        item_block.append(f"  - Precio Unitario: {precio_display}")
                        
                        if item.get('fechaInicio'):
                            item_block.append(f"  - Fecha: {item['fechaInicio']}")
                        if item.get('max_guests'):
                            item_block.append(f"  - Máx. Invitados: {item['max_guests']}")
                        if item.get('duration_hours'):
                            item_block.append(f"  - Duración: {item['duration_hours']} Hrs")
                        if item.get('parentId'):
                            item_block.append(f"  - Tipo: Adicional")
                        if item.get('descripcion'):
                             item_block.append(f"  - Desc.: {item['descripcion'][:70]}...") 
                        
                        mensaje_wa_parts.extend(item_block)
                    
                    total_estimado_wa = solicitud.calcular_monto_total_estimado()
                    mensaje_wa_parts.append(f"\n*Total Estimado:* ${total_estimado_wa:,.0f} CLP")
                    mensaje_wa_parts.append("(No incluye traslados ni impuestos)")

                else:
                    mensaje_wa_parts.append("*No se seleccionaron servicios específicos en el carrito.*")

                mensaje_wa_parts.append("\nPronto me contactarán con la cotización detallada. ¡Gracias!")

                mensaje_wa = "\n".join(mensaje_wa_parts) # Unir todas las partes con saltos de línea
                
                mensaje_codificado = quote(mensaje_wa) 
                numero_whatsapp = "56952046511" 
                whatsapp_url = f"https://api.whatsapp.com/send?phone={numero_whatsapp}&text={mensaje_codificado}"
                print(f"DEBUG: WhatsApp URL generada: {whatsapp_url[:100]}...") # DEBUG
                success_url = reverse('core:solicitud_cotizacion_success', kwargs={'solicitud_id': solicitud.id})
                return JsonResponse({
                    'success': True,
                    'message': '¡Tu solicitud de cotización ha sido enviada con éxito! Revisa tu correo para la confirmación.',
                    'whatsapp_url': whatsapp_url,
                    'solicitud_id': solicitud.id,
                    'redirect_url': success_url
                })

            except Exception as e:
                print(f"ERROR CRÍTICO: Fallo general en solicitar_cotizacion_view: {e}") # DEBUG
                import traceback
                traceback.print_exc() 
                return JsonResponse({'success': False, 'message': f'Hubo un error interno al procesar tu solicitud. Por favor, inténtalo de nuevo más tarde.'}, status=500)
        else:
            print(f"DEBUG: Formulario de cotización NO es válido. Errores: {form.errors}") # DEBUG
            errors = {}
            for field, field_errors in form.errors.items():
                errors[field] = [str(e) for e in field_errors] 
            return JsonResponse({'success': False, 'message': 'Por favor, corrige los errores en el formulario.', 'errors': errors}, status=400)
    else:
        form = SolicitudCotizacionForm()
        print("DEBUG: solicitar_cotizacion_view - GET request, renderizando formulario.") # DEBUG
    
    return render(request, 'core/solicitud_cotizacion.html', {'form': form})

def contacto_view(request):
    """
    Maneja el formulario de contacto público y envía notificaciones por email.
    """
    if request.method == 'POST':
        form = MensajeContactoForm(request.POST)
        print("DEBUG: contacto_view - Formulario de contacto recibido.") # DEBUG
        if form.is_valid():
            mensaje_guardado = form.save()
            print(f"DEBUG: Mensaje de contacto guardado con ID: {mensaje_guardado.id}") # DEBUG
            admin_email_destino = settings.DEFAULT_FROM_EMAIL
            try:
                config = ConfiguracionSitio.objects.first()
                if config and config.email_notificaciones_admin:
                    admin_email_destino = config.email_notificaciones_admin
                print(f"DEBUG: Email de admin para contacto: {admin_email_destino}") # DEBUG
            except Exception as e: 
                print(f"ERROR: Fallo al obtener config del sitio para contacto: {e}") # DEBUG

            if admin_email_destino:
                asunto_admin = f"Nuevo Mensaje de Contacto de {mensaje_guardado.nombre_remitente}"
                mensaje_admin = f"Has recibido un nuevo mensaje de contacto (Msg #{mensaje_guardado.id}):\n\nDe: {mensaje_guardado.nombre_remitente} ({mensaje_guardado.email_remitente})\nAsunto: {mensaje_guardado.asunto}\n\nMensaje:\n{mensaje_guardado.mensaje}"
                try: 
                    send_mail(asunto_admin, mensaje_admin, settings.DEFAULT_FROM_EMAIL, [admin_email_destino], fail_silently=False)
                    print("DEBUG: Correo de contacto al admin enviado.") # DEBUG
                except Exception as e: 
                    print(f"ERROR: Fallo enviando correo de contacto al admin: {e}") # DEBUG

            messages.success(request, '¡Gracias por tu mensaje! Nos pondremos en contacto contigo pronto si es necesario.')
            print("DEBUG: Mensaje de éxito de contacto establecido. Redirigiendo.") # DEBUG
            return redirect('core:contacto')
        else:
            print(f"DEBUG: Formulario de contacto NO es válido. Errores: {form.errors}") # DEBUG
            messages.error(request, 'Hubo un error en el formulario. Por favor, revisa los campos.')
    else:
        form = MensajeContactoForm()
        print("DEBUG: contacto_view - GET request, renderizando formulario.") # DEBUG
    
    context = {'form': form, 'titulo_pagina': 'Contáctanos'}
    return render(request, 'core/contacto.html', context)


# --- Vistas para el Panel de Administración Personalizado de Servicios (SPA-like) ---
class AdminServicioListView(UserPassesTestMixin, ListView):
    model = Servicio
    template_name = 'core/admin_panel/servicio_list.html'
    context_object_name = 'servicios'

    def test_func(self):
        return self.request.user.is_staff

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        print("DEBUG: AdminServicioListView obteniendo context_data.") # DEBUG
        context['servicio_form'] = ServicioForm()
        context['chatbot_qa_list'] = ChatbotQA.objects.all()
        context['chatbot_qa_form'] = ChatbotQAForm()

        context['proyectos'] = Proyecto.objects.order_by('orden')
        context['proyecto_form'] = ProyectoForm()
        context['solicitudes_cotizacion'] = SolicitudCotizacion.objects.order_by('-fecha_solicitud')
        context['mensajes_contacto'] = MensajeContacto.objects.order_by('-fecha_envio')

        try:
            context['configuracion_sitio'] = ConfiguracionSitio.objects.first()
            if context['configuracion_sitio']:
                print(f"DEBUG: Configuración del sitio obtenida: {context['configuracion_sitio'].email_notificaciones_admin}") # DEBUG
        except ConfiguracionSitio.DoesNotExist:
            context['configuracion_sitio'] = None
            print("DEBUG: Configuración del sitio NO encontrada.") # DEBUG
        
        return context


@staff_member_required
def ajax_proyecto_create_or_update(request, proyecto_id=None):
    print(f"DEBUG: ajax_proyecto_create_or_update recibido para ID: {proyecto_id}") # DEBUG
    if request.method == 'POST':
        instance = get_object_or_404(Proyecto, pk=proyecto_id) if proyecto_id else None
        form = ProyectoForm(request.POST, request.FILES, instance=instance)
        if form.is_valid():
            proyecto = form.save()
            print(f"DEBUG: Proyecto guardado/actualizado ID: {proyecto.id}") # DEBUG
            return JsonResponse({'success': True, 'message': 'Proyecto guardado exitosamente.'})
        else:
            print(f"DEBUG: Formulario de proyecto NO es válido. Errores: {form.errors}") # DEBUG
            return JsonResponse({'success': False, 'errors': form.errors}, status=400)
    print("DEBUG: Método no permitido para ajax_proyecto_create_or_update.") # DEBUG
    return JsonResponse({'success': False, 'message': 'Método no permitido.'}, status=405)

@staff_member_required
def ajax_proyecto_delete(request, proyecto_id):
    print(f"DEBUG: ajax_proyecto_delete recibido para ID: {proyecto_id}") # DEBUG
    if request.method == 'POST':
        proyecto = get_object_or_404(Proyecto, pk=proyecto_id)
        proyecto.delete()
        print(f"DEBUG: Proyecto ID {proyecto_id} eliminado.") # DEBUG
        return JsonResponse({'success': True, 'message': 'Proyecto eliminado.'})
    print("DEBUG: Método no permitido para ajax_proyecto_delete.") # DEBUG
    return JsonResponse({'success': False, 'message': 'Método no permitido.'}, status=405)

@staff_member_required
def ajax_get_details(request, model_type, item_id):
    print(f"DEBUG: ajax_get_details recibido para tipo: {model_type}, ID: {item_id}")
    title = "Detalle"
    body = "<p>No se encontró el elemento.</p>"
    
    if model_type == 'solicitud':
        item = get_object_or_404(SolicitudCotizacion, pk=item_id)
        title = f"Detalle Solicitud #{item.id}"
        
        monto_estimado = item.calcular_monto_total_estimado()
        # Para usar Decimal en isinstance, asegúrate de haberlo importado: from decimal import Decimal
        from decimal import Decimal # Asegurarse de importar Decimal aquí si no está al inicio del archivo
        monto_estimado_formateado = f"${monto_estimado:,.0f} CLP" if isinstance(monto_estimado, (int, float, Decimal)) else "N/A"
        
        body = f"""
            <p><strong>Cliente:</strong> {escape(item.nombre_cliente)}</p>
            <p><strong>Email:</strong> {escape(item.email_cliente)}</p>
            <p><strong>Teléfono:</strong> {escape(item.telefono_cliente)}</p>
            <hr>
            <p><strong>Descripción del Evento:</strong></p>
            <pre>{escape(item.descripcion_evento)}</pre>
            <hr>
            <p><strong>Servicios de Cotización:</strong></p>
            <pre>{escape(json.dumps(item.get_cotizacion_detalles_list(), indent=2))}</pre>
            <p><strong>Monto Estimado:</strong> {monto_estimado_formateado}</p> # Ya no es un comentario de Django
            """ # <--- Aquí estaba el '{' sin cerrar debido al comentario Django.
        print(f"DEBUG: Detalles de solicitud ID {item_id} generados. Monto: {monto_estimado_formateado}")
    elif model_type == 'mensaje':
        item = get_object_or_404(MensajeContacto, pk=item_id)
        title = f"Detalle Mensaje #{item.id}"
        body = f"""
            <p><strong>Remitente:</strong> {escape(item.nombre_remitente)}</p>
            <p><strong>Email:</strong> {escape(item.email_remitente)}</p>
            <p><strong>Asunto:</strong> {escape(item.asunto)}</p>
            <hr>
            <p><strong>Mensaje:</strong></p>
            <pre>{escape(item.mensaje)}</pre>
        """
        print(f"DEBUG: Detalles de mensaje ID {item_id} generados.")
    else:
        print(f"ERROR: Tipo de modelo no válido para ajax_get_details: {model_type}")

    return JsonResponse({'success': True, 'title': title, 'body': body})

@staff_member_required
def ajax_toggle_status(request, model_type, item_id):
    print(f"DEBUG: ajax_toggle_status recibido para tipo: {model_type}, ID: {item_id}") # DEBUG
    if request.method == 'POST':
        new_status = False
        if model_type == 'solicitud':
            item = get_object_or_404(SolicitudCotizacion, pk=item_id)
            # CORRECCIÓN: El campo es 'estado', no 'atendida'
            # Hay que cambiar el estado a 'EN_PROCESO' o 'COMPLETADO' dependiendo de la lógica
            # O si quieres un simple toggle, puedes tener un campo booleano 'atendida' si lo vuelves a añadir.
            # Por ahora, asumo que quieres alternar 'atendida' como antes, pero tu modelo SolicitudCotizacion
            # tiene 'estado'. Necesitas decidir cómo mapear esto.
            # Si quieres alternar entre PENDIENTE y EN_PROCESO/COMPLETADO:
            if item.estado == SolicitudCotizacion.EstadoSolicitud.PENDIENTE:
                item.estado = SolicitudCotizacion.EstadoSolicitud.EN_PROCESO
            elif item.estado == SolicitudCotizacion.EstadoSolicitud.EN_PROCESO:
                item.estado = SolicitudCotizacion.EstadoSolicitud.COMPLETADO
            else: # Si ya está en otro estado, vuelve a pendiente para toggle simple
                item.estado = SolicitudCotizacion.EstadoSolicitud.PENDIENTE
            new_status = item.estado # Nuevo valor de estado
            item.save()
            print(f"DEBUG: Solicitud ID {item_id} estado actualizado a {item.estado}.") # DEBUG
        elif model_type == 'mensaje':
            item = get_object_or_404(MensajeContacto, pk=item_id)
            item.leido = not item.leido 
            new_status = item.leido 
            item.save()
            print(f"DEBUG: Mensaje ID {item_id} estado leido actualizado a {item.leido}.") # DEBUG
        else:
            print(f"ERROR: Tipo de modelo no válido para ajax_toggle_status: {model_type}") # DEBUG
            return JsonResponse({'success': False, 'message': 'Tipo de modelo no válido.'}, status=400)
        
        return JsonResponse({'success': True, 'message': 'Estado actualizado.', 'new_status': new_status})
    print("DEBUG: Método no permitido para ajax_toggle_status.") # DEBUG
    return JsonResponse({'success': False, 'message': 'Método no permitido.'}, status=405)

# ==========================================================
# --- VISTAS/ENDPOINTS AJAX ---
# ==========================================================

def servicio_create_ajax(request):
    print("DEBUG: servicio_create_ajax recibido.") # DEBUG
    if request.method == 'POST':
        form = ServicioForm(request.POST, request.FILES)
        if form.is_valid():
            servicio = form.save()
            print(f"DEBUG: Servicio creado con ID: {servicio.id}") # DEBUG
            response_data = {
                'id': servicio.id,
                'nombre': servicio.nombre,
                'descripcion': servicio.descripcion,
                'imagen_url': servicio.get_thumbnail_url(), # Usar el método del modelo
                'precio': servicio.precio
            }
            return JsonResponse({'status': 'success', 'message': 'Servicio agregado.', 'servicio': response_data})
        else:
            print(f"DEBUG: Formulario de servicio NO es válido. Errores: {form.errors}") # DEBUG
            return JsonResponse({'status': 'error', 'errors': form.errors}, status=400)
    print("DEBUG: Método no permitido para servicio_create_ajax.") # DEBUG
    return JsonResponse({'status': 'error', 'message': 'Método no permitido'}, status=405)

def servicio_update_ajax(request, servicio_id):
    print(f"DEBUG: servicio_update_ajax recibido para ID: {servicio_id}") # DEBUG
    servicio = get_object_or_404(Servicio, pk=servicio_id)
    if request.method == 'POST':
        form = ServicioForm(request.POST, request.FILES, instance=servicio)
        if form.is_valid():
            updated_servicio = form.save()
            print(f"DEBUG: Servicio ID {servicio_id} actualizado.") # DEBUG
            response_data = {
                'id': updated_servicio.id,
                'nombre': updated_servicio.nombre,
                'descripcion': updated_servicio.descripcion,
                'imagen_url': updated_servicio.get_thumbnail_url() # Usar el método del modelo
            }
            return JsonResponse({'status': 'success', 'message': 'Servicio actualizado.', 'servicio': response_data})
        else:
            print(f"DEBUG: Formulario de actualización de servicio NO es válido. Errores: {form.errors}") # DEBUG
            return JsonResponse({'status': 'error', 'errors': form.errors}, status=400)
    print("DEBUG: Método no permitido para servicio_update_ajax.") # DEBUG
    return JsonResponse({'status': 'error', 'message': 'Método no permitido'}, status=405)

def servicio_delete_ajax(request, servicio_id):
    print(f"DEBUG: servicio_delete_ajax recibido para ID: {servicio_id}") # DEBUG
    if request.method == 'POST':
        servicio = get_object_or_404(Servicio, pk=servicio_id)
        servicio.delete()
        print(f"DEBUG: Servicio ID {servicio_id} eliminado.") # DEBUG
        return JsonResponse({'status': 'success', 'message': 'Servicio eliminado.'})
    print("DEBUG: Método no permitido para servicio_delete_ajax.") # DEBUG
    return JsonResponse({'status': 'error', 'message': 'Método no permitido'}, status=405)

def servicio_detail_json(request, servicio_id):
    print(f"DEBUG: servicio_detail_json recibido para ID: {servicio_id}") # DEBUG
    servicio = get_object_or_404(Servicio, pk=servicio_id)
    response_data = {
        'id': servicio.id,
        'nombre': servicio.nombre,
        'descripcion': servicio.descripcion,
        'destacado': servicio.destacado,
        'precio': servicio.precio,
        # Puedes añadir más campos aquí si los necesitas en el JSON de detalle
    }
    print(f"DEBUG: Detalles de servicio ID {servicio_id} generados.") # DEBUG
    return JsonResponse({'status': 'success', 'servicio': response_data})

def configuracion_sitio_update_ajax(request):
    print("DEBUG: configuracion_sitio_update_ajax recibido.") # DEBUG
    if request.method == 'POST':
        nuevo_email = request.POST.get('email_notificaciones_admin')
        if not nuevo_email: 
            print("ERROR: Email de notificación vacío en config update.") # DEBUG
            return JsonResponse({'status': 'error', 'message': 'El email no puede estar vacío.'}, status=400)
        config, _ = ConfiguracionSitio.objects.get_or_create(id=1)
        config.email_notificaciones_admin = nuevo_email
        config.save()
        print(f"DEBUG: Email de notificaciones actualizado a: {config.email_notificaciones_admin}") # DEBUG
        return JsonResponse({'status': 'success', 'message': 'Email de notificaciones actualizado.', 'nuevo_email': config.email_notificaciones_admin})
    print("DEBUG: Método no permitido para configuracion_sitio_update_ajax.") # DEBUG
    return JsonResponse({'status': 'error', 'message': 'Método no permitido'}, status=405)

# --- chatbot --- 
def chatbot_query_ajax(request):
    print("DEBUG: chatbot_query_ajax recibido.") # DEBUG
    if request.method == 'POST':
        user_question = request.POST.get('question', '').lower().strip()
        if not user_question:
            print("DEBUG: Pregunta de chatbot vacía.") # DEBUG
            return JsonResponse({'status': 'error', 'answer': 'No se recibió ninguna pregunta.'}, status=400)

        all_qas = ChatbotQA.objects.all()
        best_match = None
        highest_score = 0
        user_words = set(user_question.split())

        for qa in all_qas:
            keywords = set(kw.strip() for kw in qa.keywords.lower().split(','))
            score = len(keywords.intersection(user_words))
            
            if score > highest_score:
                highest_score = score
                best_match = qa

        if best_match and highest_score > 0:
            answer = best_match.respuesta
            print(f"DEBUG: Respuesta de chatbot encontrada para '{user_question[:20]}'.") # DEBUG
            return JsonResponse({'status': 'success', 'answer': answer})
        else:
            print(f"DEBUG: No se encontró respuesta directa para '{user_question[:20]}'.") # DEBUG
            try:
                config = ConfiguracionSitio.objects.first()
                # Asegúrate de que ConfiguracionSitio tiene un campo chatbot_fallback_response
                fallback_answer = config.chatbot_fallback_response 
            except (ConfiguracionSitio.DoesNotExist, AttributeError):
                fallback_answer = "Lo siento, no tengo una respuesta para eso en este momento."
            
            suggestions = [qa.keywords.split(',')[0].strip().capitalize() for qa in all_qas[:5]]

            return JsonResponse({
                'status': 'fallback', 
                'answer': fallback_answer,
                'suggestions': suggestions
            })
    print("DEBUG: Método no permitido para chatbot_query_ajax.") # DEBUG
    return JsonResponse({'status': 'error', 'message': 'Método no permitido'}, status=405)

def chatbot_qa_create_ajax(request):
    print("DEBUG: chatbot_qa_create_ajax recibido.") # DEBUG
    if request.method == 'POST':
        form = ChatbotQAForm(request.POST)
        if form.is_valid():
            qa = form.save()
            print(f"DEBUG: QA de chatbot creada con ID: {qa.id}") # DEBUG
            return JsonResponse({'status': 'success', 'message': 'Pregunta/Respuesta agregada.', 'qa': {'id': qa.id, 'keywords': qa.keywords, 'respuesta': qa.respuesta}})
        else:
            print(f"DEBUG: Formulario de QA de chatbot NO es válido. Errores: {form.errors}") # DEBUG
            return JsonResponse({'status': 'error', 'errors': form.errors}, status=400)
    print("DEBUG: Método no permitido para chatbot_qa_create_ajax.") # DEBUG
    return JsonResponse({'status': 'error', 'message': 'Método no permitido'}, status=405)

def chatbot_qa_update_ajax(request, qa_id):
    print(f"DEBUG: chatbot_qa_update_ajax recibido para ID: {qa_id}") # DEBUG
    qa = get_object_or_404(ChatbotQA, pk=qa_id)
    if request.method == 'POST':
        form = ChatbotQAForm(request.POST, instance=qa)
        if form.is_valid():
            updated_qa = form.save()
            print(f"DEBUG: QA de chatbot ID {qa_id} actualizada.") # DEBUG
            return JsonResponse({'status': 'success', 'message': 'Pregunta/Respuesta actualizada.', 'qa': {'id': updated_qa.id, 'keywords': updated_qa.keywords, 'respuesta': updated_qa.respuesta}})
        else:
            print(f"DEBUG: Formulario de actualización de QA de chatbot NO es válido. Errores: {form.errors}") # DEBUG
            return JsonResponse({'status': 'error', 'errors': form.errors}, status=400)
    print("DEBUG: Método no permitido para chatbot_qa_update_ajax.") # DEBUG
    return JsonResponse({'status': 'error', 'message': 'Método no permitido'}, status=405)

def chatbot_qa_delete_ajax(request, qa_id):
    print(f"DEBUG: chatbot_qa_delete_ajax recibido para ID: {qa_id}") # DEBUG
    if request.method == 'POST':
        qa = get_object_or_404(ChatbotQA, pk=qa_id)
        qa.delete()
        print(f"DEBUG: QA de chatbot ID {qa_id} eliminada.") # DEBUG
        return JsonResponse({'status': 'success', 'message': 'Pregunta/Respuesta eliminada.'})
    print("DEBUG: Método no permitido para chatbot_qa_delete_ajax.") # DEBUG
    return JsonResponse({'status': 'error', 'message': 'Método no permitido'}, status=405)

def chatbot_qa_detail_json(request, qa_id):
    print(f"DEBUG: chatbot_qa_detail_json recibido para ID: {qa_id}") # DEBUG
    qa = get_object_or_404(ChatbotQA, pk=qa_id)
    print(f"DEBUG: Detalles de QA de chatbot ID {qa_id} generados.") # DEBUG
    return JsonResponse({'status': 'success', 'qa': {'id': qa.id, 'keywords': qa.keywords, 'respuesta': qa.respuesta}})

def solicitud_cotizacion_success_view(request, solicitud_id):
    """
    Vista para la página de éxito de la solicitud de cotización.
    Carga el objeto SolicitudCotizacion completo y lo pasa a la plantilla.
    """
    solicitud = get_object_or_404(SolicitudCotizacion, id=solicitud_id)
    print(f"DEBUG: solicitud_cotizacion_success_view - Cargada solicitud ID: {solicitud.id}") # DEBUG

    # Puedes añadir lógica aquí para limpiar el carrito de localStorage
    # si la redirección a esta página debe ser el punto final de la sesión de carrito.
    # El JS en la plantilla ya lo hace, pero si quieres una garantía en el backend:
    # messages.success(request, 'Carrito limpiado con éxito desde el backend.') # Esto no funcionará bien con JS redireccionado

    context = {
        'solicitud': solicitud,
        'navbar_class': 'navbar-solid' # O el tipo de navbar que quieras para esta página
    }
    return render(request, 'core/solicitud_cotizacion_success.html', context)
