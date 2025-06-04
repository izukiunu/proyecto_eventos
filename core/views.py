# core/views.py
from django.shortcuts import render, redirect, get_object_or_404
from django.views.generic import ListView
from .models import Servicio, SolicitudCotizacion, MensajeContacto, ConfiguracionSitio
from .forms import SolicitudCotizacionForm, MensajeContactoForm, ServicioForm
from django.contrib import messages
from django.http import JsonResponse
from django.core.mail import send_mail
from django.conf import settings

# --- Vistas Públicas ---
class ListaServiciosView(ListView):
    model = Servicio
    template_name = 'core/lista_servicios.html'
    context_object_name = 'servicios'

# --- vista de index   ) ---
def index(request):
    return render(request, 'core/index.html')

def solicitar_cotizacion_view(request, servicio_id=None):
    initial_data = {}
    servicio_seleccionado = None
    if servicio_id:
        servicio_seleccionado = get_object_or_404(Servicio, id=servicio_id) # [cite: 2]
        initial_data['servicio_interesado'] = servicio_seleccionado # [cite: 2]
    
    if request.method == 'POST':
        form = SolicitudCotizacionForm(request.POST, initial=initial_data if not servicio_id else None) # [cite: 2]
        if form.is_valid():
            solicitud = form.save(commit=False) # [cite: 2]
            if servicio_seleccionado and not form.cleaned_data.get('servicio_interesado'): # [cite: 2]
                 solicitud.servicio_interesado = servicio_seleccionado # [cite: 2]
            solicitud.save() # Guarda para que se genere solicitud.id

            # --- MODIFICACIÓN IMPORTANTE AQUÍ: Usar solicitud.id ---
            ticket_display_id = f"#{solicitud.id}" # Usamos el ID autoincremental
            # ----------------------------------------------------

            # --- LÓGICA DE ENVÍO DE CORREO ---
            admin_email_destino = settings.DEFAULT_FROM_EMAIL # Fallback
            try:
                config = ConfiguracionSitio.objects.first()
                if config and config.email_notificaciones_admin:
                    admin_email_destino = config.email_notificaciones_admin
            except Exception as e:
                print(f"Error al obtener la configuración del sitio para el email del admin: {e}")

            if admin_email_destino:
                asunto_admin = f"Nueva Solicitud de Cotización - Ticket: {ticket_display_id}"
                mensaje_admin_partes = [
                    f"Has recibido una nueva solicitud de cotización (Ticket: {ticket_display_id}):",
                    f"Nombre del Cliente: {solicitud.nombre_cliente}",
                    f"Email del Cliente: {solicitud.email_cliente}",
                ]
                if solicitud.telefono_cliente:
                    mensaje_admin_partes.append(f"Teléfono del Cliente: {solicitud.telefono_cliente}")
                if solicitud.servicio_interesado:
                    mensaje_admin_partes.append(f"Servicio de Interés: {solicitud.servicio_interesado.nombre}")
                mensaje_admin_partes.append(f"Descripción del Evento/Solicitud:\n{solicitud.descripcion_evento}")
                mensaje_admin_partes.append(f"\nFecha de Solicitud: {solicitud.fecha_solicitud.strftime('%Y-%m-%d %H:%M')}")
                
                mensaje_admin_completo = "\n\n".join(mensaje_admin_partes)
                
                try:
                    send_mail(
                        asunto_admin,
                        mensaje_admin_completo,
                        settings.DEFAULT_FROM_EMAIL,
                        [admin_email_destino],
                        fail_silently=False,
                    )
                except Exception as e:
                    print(f"Error enviando correo al admin ({admin_email_destino}): {e}")
            else:
                print(f"Advertencia: No se ha configurado un email de administrador para notificaciones de cotización. Ticket: {ticket_display_id}")

            asunto_cliente = f"Confirmación de Solicitud de Cotización - Ticket: {ticket_display_id}"
            mensaje_cliente = (
                f"Hola {solicitud.nombre_cliente},\n\n"
                f"Hemos recibido tu solicitud de cotización (Ticket: {ticket_display_id}). ¡Gracias por tu interés!\n\n"
                f"Estos son los detalles que nos enviaste:\n"
                f"  - Email: {solicitud.email_cliente}\n"
                f"  - Servicio de Interés: {solicitud.servicio_interesado.nombre if solicitud.servicio_interesado else 'Consulta General'}\n"
                f"  - Descripción: {solicitud.descripcion_evento}\n\n"
                f"Nos pondremos en contacto contigo a la brevedad para darte más información.\n\n"
                f"Saludos,\nEl equipo de [Nombre de tu Página de Bodas]" # PERSONALIZA ESTO
            )
            try:
                send_mail(
                    asunto_cliente,
                    mensaje_cliente,
                    settings.DEFAULT_FROM_EMAIL,
                    [solicitud.email_cliente],
                    fail_silently=False,
                )
            except Exception as e:
                print(f"Error enviando correo de confirmación al cliente ({solicitud.email_cliente}): {e}")

            success_message = (
                f"¡Tu solicitud de cotización (Ticket: {ticket_display_id}) ha sido enviada con éxito! "
                f"Hemos enviado una confirmación a tu correo ({solicitud.email_cliente}). Nos pondremos en contacto contigo pronto."
            )
            messages.success(request, success_message) # [cite: 2]
            return redirect('core:lista_servicios') # [cite: 2]
        else:
            messages.error(request, 'Hubo un error en el formulario. Por favor, revisa los campos.') # [cite: 2]
    else:
        form = SolicitudCotizacionForm(initial=initial_data) # [cite: 2]
    context = { # [cite: 2]
        'form': form, # [cite: 2]
        'servicio_seleccionado': servicio_seleccionado # [cite: 2]
    }
    return render(request, 'core/solicitud_cotizacion.html', context) # [cite: 2]

# (Aquí tu vista contacto_view si la tienes)
# def contacto_view(request):
# # ...

# --- Vistas para el Panel de Administración Personalizado de Servicios (SPA-like) ---
class AdminServicioListView(ListView):
    model = Servicio # [cite: 2]
    template_name = 'core/admin_panel/servicio_list.html' # [cite: 2]
    context_object_name = 'servicios' # [cite: 2]

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs) # [cite: 2]
        context['servicio_form'] = ServicioForm() # [cite: 2]
        context['titulo_pagina_panel'] = 'Administrar Servicios y Configuración' # [cite: 2]
        
        configuracion, created = ConfiguracionSitio.objects.get_or_create(
            id=1,
            defaults={'email_notificaciones_admin': settings.DEFAULT_FROM_EMAIL}
        )
        if created:
            print(f"Se creó una instancia de ConfiguracionSitio por defecto con email: {settings.DEFAULT_FROM_EMAIL}")
        
        context['configuracion_sitio'] = configuracion
        return context

# --- VISTAS/ENDPOINTS AJAX para Servicios ---
def servicio_create_ajax(request):
    if request.method == 'POST': # [cite: 2]
        form = ServicioForm(request.POST, request.FILES) # [cite: 2]
        if form.is_valid(): # [cite: 2]
            servicio = form.save() # [cite: 2]
            return JsonResponse({ # [cite: 2]
                'status': 'success', # [cite: 2]
                'message': 'Servicio agregado exitosamente.', # [cite: 2]
                'servicio': { # [cite: 2]
                    'id': servicio.id, # [cite: 2]
                    'nombre': servicio.nombre, # [cite: 2]
                    'descripcion_corta': servicio.descripcion[:50] + "..." if len(servicio.descripcion) > 50 else servicio.descripcion, # [cite: 2]
                    'imagen_url': servicio.imagen.url if servicio.imagen else None # [cite: 2]
                }
            })
        else:
            return JsonResponse({'status': 'error', 'errors': form.errors}, status=400) # [cite: 2]
    return JsonResponse({'status': 'error', 'message': 'Método no permitido'}, status=405) # [cite: 2]

def servicio_update_ajax(request, servicio_id):
    try:
        servicio = Servicio.objects.get(pk=servicio_id) # [cite: 2]
    except Servicio.DoesNotExist: # [cite: 2]
        return JsonResponse({'status': 'error', 'message': 'Servicio no encontrado'}, status=404) # [cite: 2]

    if request.method == 'POST': # [cite: 2]
        form = ServicioForm(request.POST, request.FILES, instance=servicio) # [cite: 2]
        if form.is_valid(): # [cite: 2]
            updated_servicio = form.save() # [cite: 2]
            return JsonResponse({ # [cite: 2]
                'status': 'success', # [cite: 2]
                'message': 'Servicio actualizado exitosamente.', # [cite: 2]
                'servicio': { # [cite: 2]
                    'id': updated_servicio.id, # [cite: 2]
                    'nombre': updated_servicio.nombre, # [cite: 2]
                    'descripcion_corta': updated_servicio.descripcion[:50] + "..." if len(updated_servicio.descripcion) > 50 else updated_servicio.descripcion, # [cite: 2]
                    'imagen_url': updated_servicio.imagen.url if updated_servicio.imagen else None # [cite: 2]
                }
            })
        else:
            return JsonResponse({'status': 'error', 'errors': form.errors}, status=400) # [cite: 2]
    return JsonResponse({'status': 'error', 'message': 'Método no permitido'}, status=405) # [cite: 2]

def servicio_delete_ajax(request, servicio_id):
    if request.method == 'POST': # [cite: 2]
        try:
            servicio = Servicio.objects.get(pk=servicio_id) # [cite: 2]
            servicio.delete() # [cite: 2]
            return JsonResponse({'status': 'success', 'message': 'Servicio eliminado exitosamente.'}) # [cite: 2]
        except Servicio.DoesNotExist: # [cite: 2]
            return JsonResponse({'status': 'error', 'message': 'Servicio no encontrado.'}, status=404) # [cite: 2]
        except Exception as e: # [cite: 2]
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500) # [cite: 2]
    return JsonResponse({'status': 'error', 'message': 'Método no permitido'}, status=405) # [cite: 2]

def servicio_detail_json(request, servicio_id):
    try:
        servicio = Servicio.objects.get(pk=servicio_id) # [cite: 2]
        return JsonResponse({ # [cite: 2]
            'status': 'success', # [cite: 2]
            'servicio': { # [cite: 2]
                'id': servicio.id, # [cite: 2]
                'nombre': servicio.nombre, # [cite: 2]
                'descripcion': servicio.descripcion, # [cite: 2]
            }
        })
    except Servicio.DoesNotExist: # [cite: 2]
        return JsonResponse({'status': 'error', 'message': 'Servicio no encontrado'}, status=404) # [cite: 2]

def configuracion_sitio_update_ajax(request):
    if request.method == 'POST':
        nuevo_email = request.POST.get('email_notificaciones_admin')
        if not nuevo_email:
            return JsonResponse({'status': 'error', 'message': 'El email no puede estar vacío.'}, status=400)
        
        config, created = ConfiguracionSitio.objects.get_or_create(
            id=1, 
            defaults={'email_notificaciones_admin': nuevo_email}
        )
        
        if not created:
            config.email_notificaciones_admin = nuevo_email
            config.save()
        
        return JsonResponse({
            'status': 'success',
            'message': 'Email de notificaciones para el administrador actualizado correctamente.',
            'nuevo_email': config.email_notificaciones_admin
        })
    return JsonResponse({'status': 'error', 'message': 'Método no permitido'}, status=405)