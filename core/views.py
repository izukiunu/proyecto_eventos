# core/views.py
from django.shortcuts import render, redirect, get_object_or_404
from django.views.generic import ListView
from .models import Servicio, SolicitudCotizacion, MensajeContacto, ConfiguracionSitio, ChatbotQA
from .forms import SolicitudCotizacionForm, MensajeContactoForm, ServicioForm
from django.contrib import messages
from django.http import JsonResponse
from django.core.mail import send_mail
from django.conf import settings
from .models import ChatbotQA
from .forms import ChatbotQAForm
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib.auth.mixins import UserPassesTestMixin


# --- Vistas Públicas ---

def index_view(request): # CAMBIADO: de 'index' a 'index_view' para que coincida con urls.py
    """
    Vista para la página de inicio. Muestra los servicios más recientes como destacados.
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

def solicitar_cotizacion_view(request, servicio_id=None):
    """
    Maneja la creación de solicitudes de cotización, con envío de correos.
    """
    initial_data = {}
    servicio_seleccionado = None
    if servicio_id:
        servicio_seleccionado = get_object_or_404(Servicio, id=servicio_id)
        initial_data['servicio_interesado'] = servicio_seleccionado
    
    if request.method == 'POST':
        form = SolicitudCotizacionForm(request.POST)
        if form.is_valid():
            solicitud = form.save()

            ticket_display_id = f"#{solicitud.id}"
            
            admin_email_destino = settings.DEFAULT_FROM_EMAIL
            try:
                config = ConfiguracionSitio.objects.first()
                if config and config.email_notificaciones_admin:
                    admin_email_destino = config.email_notificaciones_admin
            except Exception as e:
                print(f"Error al obtener config del sitio: {e}")

            if admin_email_destino:
                asunto_admin = f"Nueva Solicitud de Cotización - Ticket: {ticket_display_id}"
                mensaje_admin = f"Nueva solicitud de {solicitud.nombre_cliente} ({solicitud.email_cliente}).\nServicio: {solicitud.servicio_interesado.nombre if solicitud.servicio_interesado else 'General'}.\nDescripción: {solicitud.descripcion_evento}"
                try: send_mail(asunto_admin, mensaje_admin, settings.DEFAULT_FROM_EMAIL, [admin_email_destino], fail_silently=False)
                except Exception as e: print(f"Error enviando correo al admin: {e}")
            
            asunto_cliente = f"Confirmación de Solicitud - Ticket: {ticket_display_id}"
            mensaje_cliente = f"Hola {solicitud.nombre_cliente},\nHemos recibido tu solicitud (Ticket: {ticket_display_id}). Nos pondremos en contacto contigo pronto.\n\nSaludos,\nEl equipo de MejíaEventos"
            try: send_mail(asunto_cliente, mensaje_cliente, settings.DEFAULT_FROM_EMAIL, [solicitud.email_cliente], fail_silently=False)
            except Exception as e: print(f"Error enviando correo al cliente: {e}")

            messages.success(request, f"¡Tu solicitud (Ticket: {ticket_display_id}) ha sido enviada! Revisa tu correo para una confirmación.")
            return redirect('core:lista_servicios')
        else:
            messages.error(request, 'Hubo un error en el formulario.')
    else:
        form = SolicitudCotizacionForm(initial=initial_data)
    
    context = {'form': form, 'servicio_seleccionado': servicio_seleccionado}
    return render(request, 'core/solicitud_cotizacion.html', context)

def contacto_view(request): # --- NUEVA VISTA PARA EL FORMULARIO DE CONTACTO ---
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
class AdminServicioListView(ListView):
    model = Servicio
    template_name = 'core/admin_panel/servicio_list.html'
    context_object_name = 'servicios'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['servicio_form'] = ServicioForm()
        context['titulo_pagina_panel'] = 'Administrar Servicios y Configuración'
        configuracion, _ = ConfiguracionSitio.objects.get_or_create(id=1, defaults={'email_notificaciones_admin': settings.DEFAULT_FROM_EMAIL})
        context['configuracion_sitio'] = configuracion
        context['chatbot_qa_list'] = ChatbotQA.objects.all()
        context['chatbot_qa_form'] = ChatbotQAForm()
        return context
    
    
##---- admnin seguridad ----####
class AdminServicioListView(UserPassesTestMixin, ListView):
    """
    Esta vista ahora usa un Mixin para la seguridad.
    UserPassesTestMixin: Se asegura de que el usuario pase una prueba.
    ListView: Muestra una lista de objetos.
    """
    model = Servicio
    template_name = 'core/admin_panel/servicio_list.html'
    context_object_name = 'servicios'

    def test_func(self):
        """
        La prueba que UserPassesTestMixin ejecuta.
        Solo permite el acceso si el usuario es un administrador (staff).
        """
        return self.request.user.is_staff

    def get_context_data(self, **kwargs):
        """
        Este método se queda exactamente como lo tenías.
        """
        context = super().get_context_data(**kwargs)
        context['servicio_form'] = ServicioForm()
        context['titulo_pagina_panel'] = 'Administrar Servicios y Configuración'
        configuracion, _ = ConfiguracionSitio.objects.get_or_create(id=1, defaults={'email_notificaciones_admin': settings.DEFAULT_FROM_EMAIL})
        context['configuracion_sitio'] = configuracion
        context['chatbot_qa_list'] = ChatbotQA.objects.all()
        context['chatbot_qa_form'] = ChatbotQAForm()
        return context

# ==========================================================
# --- VISTAS/ENDPOINTS AJAX (SECCIÓN CORREGIDA) ---
# ==========================================================

def servicio_create_ajax(request):
    if request.method == 'POST':
        form = ServicioForm(request.POST, request.FILES)
        if form.is_valid():
            servicio = form.save()
            # CORREGIDO: Se devuelve la descripción completa para que coincida con el JS
            response_data = {
                'id': servicio.id,
                'nombre': servicio.nombre,
                'descripcion': servicio.descripcion, # <-- CAMBIO CLAVE
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
            # CORREGIDO: Se devuelve la descripción completa
            response_data = {
                'id': updated_servicio.id,
                'nombre': updated_servicio.nombre,
                'descripcion': updated_servicio.descripcion, # <-- CAMBIO CLAVE
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
    # Tu código existente para esta vista está bien
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

        # --- LÓGICA DE BÚSQUEDA MEJORADA CON KEYWORDS ---
        all_qas = ChatbotQA.objects.all()
        best_match = None
        highest_score = 0
        user_words = set(user_question.split())

        for qa in all_qas:
            # Obtenemos las palabras clave, las limpiamos y las convertimos en un conjunto
            keywords = set(kw.strip() for kw in qa.keywords.lower().split(','))
            
            score = len(keywords.intersection(user_words))
            
            if score > highest_score:
                highest_score = score
                best_match = qa

        if best_match and highest_score > 0:
            answer = best_match.respuesta
            return JsonResponse({'status': 'success', 'answer': answer})
        else:
            # ... (la lógica de fallback se queda igual, la veremos en la Mejora 2) ...
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