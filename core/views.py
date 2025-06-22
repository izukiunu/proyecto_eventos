# core/views.py
from django.shortcuts import render, redirect, get_object_or_404
from django.views.generic import ListView
# Asegúrate de que HeroSlide esté importado correctamente aquí
from .models import Servicio, SolicitudCotizacion, MensajeContacto, ConfiguracionSitio, ChatbotQA, HeroSlide, Proyecto, Testimonio, SeccionSobreNosotros
from .forms import SolicitudCotizacionForm, MensajeContactoForm, ServicioForm
from django.contrib import messages
from django.http import JsonResponse
from django.core.mail import send_mail
from django.conf import settings
from .forms import ChatbotQAForm
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib.auth.mixins import UserPassesTestMixin
from urllib.parse import quote # <-- Importación necesaria para WhatsApp
from .models import (
    Servicio, SolicitudCotizacion, MensajeContacto, ConfiguracionSitio, 
    ChatbotQA, HeroSlide, Proyecto, Testimonio, SeccionSobreNosotros
)
from .forms import SolicitudCotizacionForm, MensajeContactoForm, ServicioForm, ChatbotQAForm
from .forms import ProyectoForm
from django.utils.html import escape
# --- Vistas Públicas ---


# Esta será la vista principal para la ruta de inicio (home) que incluye el carrusel hero
def home_carousel_view(request):
    """
    Vista principal para la página de inicio con contenido dinámico.
    """
    hero_slides = HeroSlide.objects.filter(is_active=True).order_by('order')
    servicios_destacados = Servicio.objects.filter(destacado=True).select_related('oferta')

    # --- NUEVAS CONSULTAS PARA CONTENIDO DINÁMICO ---
    proyectos = Proyecto.objects.filter(activo=True).prefetch_related('imagenes')
    testimonios = Testimonio.objects.filter(activo=True).prefetch_related('imagenes')
    
    # Usamos un try-except para la sección "Sobre Nosotros" para evitar errores si aún no se ha creado
    try:
        sobre_nosotros = SeccionSobreNosotros.objects.prefetch_related('puntos_clave', 'imagenes').first()
    except SeccionSobreNosotros.DoesNotExist:
        sobre_nosotros = None

    context = {
        'hero_slides': hero_slides,
        'servicios_destacados': servicios_destacados,
        # --- NUEVOS DATOS EN EL CONTEXTO ---
        'proyectos': proyectos,
        'testimonios': testimonios,
        'sobre_nosotros': sobre_nosotros,
    }
    return render(request, 'core/index.html', context)


# Re-introducimos index_view con su funcionalidad original (si se usaba aparte)
# Si no se usa en ninguna otra URL, puedes eliminarla.
def index_view(request):
    """
    Vista original para la página de inicio que muestra servicios destacados.
    Si esta vista se usa para una URL diferente a la raíz, se mantiene.
    """
    servicios_destacados = Servicio.objects.filter(destacado=True)
    context = {
        'servicios_destacados': servicios_destacados,
    }
    return render(request, 'core/index.html', context)

class ListaServiciosView(ListView):
    """
    Vista para mostrar la lista completa de servicios.
    """
    model = Servicio
    template_name = 'core/lista_servicios.html'
    context_object_name = 'servicios'

    # Se corrigió la indentación de get_queryset para que sea un método de la clase
    def get_queryset(self):
        """
        Sobrescribimos para traer la oferta asociada en la misma consulta
        y evitar consultas extra en la plantilla (N+1 problem).
        """
        return Servicio.objects.all().select_related('oferta')

# =================================================================================
# --- VISTA DE COTIZACIÓN MODIFICADA ---
# =================================================================================
def solicitar_cotizacion_view(request, servicio_id=None):
    """
    Maneja la creación de solicitudes de cotización, con envío de correos
    y redirección automática a WhatsApp.
    """
    if request.method == 'POST':
        form = SolicitudCotizacionForm(request.POST)
        if form.is_valid():
            # Extraemos la información detallada del campo oculto
            detalles_cotizacion = form.cleaned_data.get('cotizacion_detallada', '')
            
            # Guardamos la solicitud principal pero aún no en la base de datos (commit=False)
            solicitud = form.save(commit=False)

            # Combinamos la descripción del usuario con el resumen del carrito
            descripcion_usuario = form.cleaned_data.get('descripcion_evento', '')
            solicitud.descripcion_evento = f"{descripcion_usuario}\n\n--- RESUMEN DE SERVICIOS SOLICITADOS ---\n{detalles_cotizacion}"
            
            # Guardamos el objeto completo en la base de datos
            solicitud.save()

            # ----- LÓGICA DE ENVÍO DE CORREO (SE MANTIENE) -----
            ticket_display_id = f"#{solicitud.id}"
            
            # 1. Correo para el Administrador
            admin_email_destino = settings.DEFAULT_FROM_EMAIL
            try:
                config = ConfiguracionSitio.objects.first()
                if config and config.email_notificaciones_admin:
                    admin_email_destino = config.email_notificaciones_admin
            except Exception as e:
                print(f"Error al obtener config del sitio: {e}")

            if admin_email_destino:
                asunto_admin = f"Nueva Cotización Detallada - Ticket: {ticket_display_id}"
                mensaje_admin = (
                    f"Nueva solicitud de cotización de: {solicitud.nombre_cliente} ({solicitud.email_cliente})\n"
                    # Como el teléfono ahora es obligatorio, ya no necesitamos "or 'No especificado'"
                    f"Teléfono: {solicitud.telefono_cliente}\n\n"
                    f"== MENSAJE DEL CLIENTE ==\n{descripcion_usuario}\n\n"
                    f"== SERVICIOS SOLICITADOS ==\n{detalles_cotizacion}"
                )
                try:
                    send_mail(asunto_admin, mensaje_admin, settings.DEFAULT_FROM_EMAIL, [admin_email_destino])
                except Exception as e:
                    print(f"Error enviando correo al admin: {e}")
            
            # 2. Correo de confirmación para el Cliente
            asunto_cliente = f"Confirmación de Solicitud de Cotización - Ticket: {ticket_display_id}"
            mensaje_cliente = f"Hola {solicitud.nombre_cliente},\n\nHemos recibido tu solicitud de cotización (Ticket: {ticket_display_id}).\nNos pondremos en contacto contigo a la brevedad.\n\nSaludos,\nEl equipo de MejíaEventos"
            try:
                send_mail(asunto_cliente, mensaje_cliente, settings.DEFAULT_FROM_EMAIL, [solicitud.email_cliente])
            except Exception as e:
                print(f"Error enviando correo al cliente: {e}")

            # ----- MEJORA: LÓGICA DE WHATSAPP Y REDIRECCIÓN DIRECTA -----
            
            # 1. Crear el texto del mensaje para WhatsApp
            mensaje_wa = (
                f"¡Hola! Soy {solicitud.nombre_cliente}. "
                f"Quisiera confirmar mi cotización con Ticket #{solicitud.id}.\n\n"
                f"--- Mi Solicitud ---\n"
                f"{solicitud.descripcion_evento}"
            )
            
            # 2. Codificar el mensaje para que funcione en una URL
            mensaje_codificado = quote(mensaje_wa)
            
            # 3. Construir la URL final de WhatsApp
            numero_whatsapp = "56952046511"  # Tu número de WhatsApp aquí
            whatsapp_url = f"https://api.whatsapp.com/send?phone={numero_whatsapp}&text={mensaje_codificado}"
            
            # 4. Redirigir directamente a la URL de WhatsApp
            return redirect(whatsapp_url)
            # ----- FIN DE LA MEJORA -----

        else:
            messages.error(request, 'Hubo un error en el formulario. Por favor, revisa los campos marcados.')
    else:
        # La lógica GET se mantiene igual
        form = SolicitudCotizacionForm()
    
    context = {'form': form}
    return render(request, 'core/solicitud_cotizacion.html', context)
# =================================================================================

def contacto_view(request): # --- VISTA PARA EL FORMULARIO DE CONTACTO ---
    """
    Maneja el formulario de contacto público y envía notificaciones por email.
    """
    if request.method == 'POST':
        form = MensajeContactoForm(request.POST)
        if form.is_valid():
            mensaje_guardado = form.save()
            admin_email_destino = settings.DEFAULT_FROM_EMAIL
            try:
                config = ConfiguracionSitio.objects.first()
                if config and config.email_notificaciones_admin:
                    admin_email_destino = config.email_notificaciones_admin
            except Exception as e: print(f"Error al obtener config del sitio: {e}")

            if admin_email_destino:
                asunto_admin = f"Nuevo Mensaje de Contacto de {mensaje_guardado.nombre_remitente}"
                mensaje_admin = f"Has recibido un nuevo mensaje de contacto (Msg #{mensaje_guardado.id}):\n\nDe: {mensaje_guardado.nombre_remitente} ({mensaje_guardado.email_remitente})\nAsunto: {mensaje_guardado.asunto}\n\nMensaje:\n{mensaje_guardado.mensaje}"
                try: send_mail(asunto_admin, mensaje_admin, settings.DEFAULT_FROM_EMAIL, [admin_email_destino], fail_silently=False)
                except Exception as e: print(f"Error enviando correo de contacto al admin: {e}")

            messages.success(request, '¡Gracias por tu mensaje! Nos pondremos en contacto contigo pronto si es necesario.')
            return redirect('core:contacto')
        else:
            messages.error(request, 'Hubo un error en el formulario. Por favor, revisa los campos.')
    else:
        form = MensajeContactoForm()
    
    context = {'form': form, 'titulo_pagina': 'Contáctanos'}
    return render(request, 'core/contacto.html', context)


# --- Vistas para el Panel de Administración Personalizado de Servicios (SPA-like) ---
# 2. Modifica esta clase
class AdminServicioListView(UserPassesTestMixin, ListView):
    model = Servicio
    template_name = 'core/admin_panel/servicio_list.html'
    context_object_name = 'servicios'

    def test_func(self):
        return self.request.user.is_staff

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Datos existentes
        context['servicio_form'] = ServicioForm()
        context['chatbot_qa_list'] = ChatbotQA.objects.all()
        context['chatbot_qa_form'] = ChatbotQAForm()
        # ... (puedes añadir aquí los queries para hero_slides, testimonios, etc. si no lo has hecho)

        # --- NUEVOS DATOS PARA LOS PANELES ---
        context['proyectos'] = Proyecto.objects.order_by('orden')
        context['proyecto_form'] = ProyectoForm()
        context['solicitudes_cotizacion'] = SolicitudCotizacion.objects.order_by('-fecha_solicitud')
        context['mensajes_contacto'] = MensajeContacto.objects.order_by('-fecha_envio')

        # --- AÑADE ESTAS LÍNEAS AQUÍ ---
        try:
            # Intentamos obtener la configuración del sitio
            context['configuracion_sitio'] = ConfiguracionSitio.objects.first()
        except ConfiguracionSitio.DoesNotExist:
            # Si no existe, pasamos None para que no dé error en la plantilla
            context['configuracion_sitio'] = None
        # --- FIN DE LAS LÍNEAS A AÑADIR ---
        
        return context


@staff_member_required
def ajax_proyecto_create_or_update(request, proyecto_id=None):
    if request.method == 'POST':
        instance = get_object_or_404(Proyecto, pk=proyecto_id) if proyecto_id else None
        form = ProyectoForm(request.POST, request.FILES, instance=instance)
        if form.is_valid():
            proyecto = form.save()
            return JsonResponse({'success': True, 'message': 'Proyecto guardado exitosamente.'})
        else:
            return JsonResponse({'success': False, 'errors': form.errors}, status=400)
    return JsonResponse({'success': False, 'message': 'Método no permitido.'}, status=405)

@staff_member_required
def ajax_proyecto_delete(request, proyecto_id):
    if request.method == 'POST':
        proyecto = get_object_or_404(Proyecto, pk=proyecto_id)
        proyecto.delete()
        return JsonResponse({'success': True, 'message': 'Proyecto eliminado.'})
    return JsonResponse({'success': False, 'message': 'Método no permitido.'}, status=405)

@staff_member_required
def ajax_get_details(request, model_type, item_id):
    title = "Detalle"
    body = "<p>No se encontró el elemento.</p>"
    
    if model_type == 'solicitud':
        item = get_object_or_404(SolicitudCotizacion, pk=item_id)
        title = f"Detalle Solicitud #{item.id}"
        body = f"""
            <p><strong>Cliente:</strong> {escape(item.nombre_cliente)}</p>
            <p><strong>Email:</strong> {escape(item.email_cliente)}</p>
            <p><strong>Teléfono:</strong> {escape(item.telefono_cliente)}</p>
            <hr>
            <p><strong>Descripción:</strong></p>
            <pre>{escape(item.descripcion_evento)}</pre>
        """
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

    return JsonResponse({'success': True, 'title': title, 'body': body})

@staff_member_required
def ajax_toggle_status(request, model_type, item_id):
    if request.method == 'POST':
        new_status = False
        if model_type == 'solicitud':
            item = get_object_or_404(SolicitudCotizacion, pk=item_id)
            item.atendida = not item.atendida
            new_status = item.atendida
            item.save()
        elif model_type == 'mensaje':
            item = get_object_or_404(MensajeContacto, pk=item_id)
            item.leido = not item.leido
            new_status = item.leido
            item.save()
        else:
            return JsonResponse({'success': False, 'message': 'Tipo de modelo no válido.'}, status=400)
        
        return JsonResponse({'success': True, 'message': 'Estado actualizado.', 'new_status': new_status})
    return JsonResponse({'success': False, 'message': 'Método no permitido.'}, status=405)

# ==========================================================
# --- VISTAS/ENDPOINTS AJAX (SECCIÓN CORREGIDA) ---
# ==========================================================
# (El resto de tus vistas AJAX no necesitan cambios)

def servicio_create_ajax(request):
    if request.method == 'POST':
        form = ServicioForm(request.POST, request.FILES)
        if form.is_valid():
            servicio = form.save()
            response_data = {
                'id': servicio.id,
                'nombre': servicio.nombre,
                'descripcion': servicio.descripcion,
                'imagen_url': servicio.imagen.url if servicio.imagen else None,
                'precio': servicio.precio
            }
            return JsonResponse({'status': 'success', 'message': 'Servicio agregado.', 'servicio': response_data})
        else:
            return JsonResponse({'status': 'error', 'errors': form.errors}, status=400)
    return JsonResponse({'status': 'error', 'message': 'Método no permitido'}, status=405)

def servicio_update_ajax(request, servicio_id):
    servicio = get_object_or_404(Servicio, pk=servicio_id)
    if request.method == 'POST':
        form = ServicioForm(request.POST, request.FILES, instance=servicio)
        if form.is_valid():
            updated_servicio = form.save()
            response_data = {
                'id': updated_servicio.id,
                'nombre': updated_servicio.nombre,
                'descripcion': updated_servicio.descripcion,
                'imagen_url': updated_servicio.imagen.url if updated_servicio.imagen else None
            }
            return JsonResponse({'status': 'success', 'message': 'Servicio actualizado.', 'servicio': response_data})
        else:
            return JsonResponse({'status': 'error', 'errors': form.errors}, status=400)
    return JsonResponse({'status': 'error', 'message': 'Método no permitido'}, status=405)

def servicio_delete_ajax(request, servicio_id):
    if request.method == 'POST':
        servicio = get_object_or_404(Servicio, pk=servicio_id)
        servicio.delete()
        return JsonResponse({'status': 'success', 'message': 'Servicio eliminado.'})
    return JsonResponse({'status': 'error', 'message': 'Método no permitido'}, status=405)

def servicio_detail_json(request, servicio_id):
    servicio = get_object_or_404(Servicio, pk=servicio_id)
    response_data = {
        'id': servicio.id,
        'nombre': servicio.nombre,
        'descripcion': servicio.descripcion,
        'destacado': servicio.destacado,
        'precio': servicio.precio,
    }
    return JsonResponse({'status': 'success', 'servicio': response_data})

def configuracion_sitio_update_ajax(request):
    if request.method == 'POST':
        nuevo_email = request.POST.get('email_notificaciones_admin')
        if not nuevo_email: return JsonResponse({'status': 'error', 'message': 'El email no puede estar vacío.'}, status=400)
        config, _ = ConfiguracionSitio.objects.get_or_create(id=1)
        config.email_notificaciones_admin = nuevo_email
        config.save()
        return JsonResponse({'status': 'success', 'message': 'Email de notificaciones actualizado.', 'nuevo_email': config.email_notificaciones_admin})
    return JsonResponse({'status': 'error', 'message': 'Método no permitido'}, status=405)

# --- chatbot --- 
def chatbot_query_ajax(request):
    if request.method == 'POST':
        user_question = request.POST.get('question', '').lower().strip()
        if not user_question:
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
            return JsonResponse({'status': 'success', 'answer': answer})
        else:
            try:
                config = ConfiguracionSitio.objects.first()
                fallback_answer = config.chatbot_fallback_response
            except (ConfiguracionSitio.DoesNotExist, AttributeError):
                fallback_answer = "Lo siento, no tengo una respuesta para eso en este momento."
            
            suggestions = [qa.keywords.split(',')[0].strip().capitalize() for qa in all_qas[:5]]

            return JsonResponse({
                'status': 'fallback', 
                'answer': fallback_answer,
                'suggestions': suggestions
            })
    
    return JsonResponse({'status': 'error', 'message': 'Método no permitido'}, status=405)

def chatbot_qa_create_ajax(request):
    if request.method == 'POST':
        form = ChatbotQAForm(request.POST)
        if form.is_valid():
            qa = form.save()
            return JsonResponse({'status': 'success', 'message': 'Pregunta/Respuesta agregada.', 'qa': {'id': qa.id, 'keywords': qa.keywords, 'respuesta': qa.respuesta}})
        else:
            return JsonResponse({'status': 'error', 'errors': form.errors}, status=400)
    return JsonResponse({'status': 'error', 'message': 'Método no permitido'}, status=405)

def chatbot_qa_update_ajax(request, qa_id):
    qa = get_object_or_404(ChatbotQA, pk=qa_id)
    if request.method == 'POST':
        form = ChatbotQAForm(request.POST, instance=qa)
        if form.is_valid():
            updated_qa = form.save()
            return JsonResponse({'status': 'success', 'message': 'Pregunta/Respuesta actualizada.', 'qa': {'id': updated_qa.id, 'keywords': updated_qa.keywords, 'respuesta': updated_qa.respuesta}})
        else:
            return JsonResponse({'status': 'error', 'errors': form.errors}, status=400)
    return JsonResponse({'status': 'error', 'message': 'Método no permitido'}, status=405)

def chatbot_qa_delete_ajax(request, qa_id):
    if request.method == 'POST':
        qa = get_object_or_404(ChatbotQA, pk=qa_id)
        qa.delete()
        return JsonResponse({'status': 'success', 'message': 'Pregunta/Respuesta eliminada.'})
    return JsonResponse({'status': 'error', 'message': 'Método no permitido'}, status=405)

def chatbot_qa_detail_json(request, qa_id):
    qa = get_object_or_404(ChatbotQA, pk=qa_id)
    return JsonResponse({'status': 'success', 'qa': {'id': qa.id, 'keywords': qa.keywords, 'respuesta': qa.respuesta}})