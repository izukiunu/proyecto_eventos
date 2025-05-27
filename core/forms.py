# core/forms.py
from django import forms
from .models import SolicitudCotizacion, Servicio, MensajeContacto # Asegúrate de importar todos los modelos que usan tus formularios

class SolicitudCotizacionForm(forms.ModelForm):
    class Meta:
        model = SolicitudCotizacion
        fields = ['nombre_cliente', 'email_cliente', 'telefono_cliente', 'servicio_interesado', 'descripcion_evento']
        widgets = {
            'nombre_cliente': forms.TextInput(attrs={'placeholder': 'Tu nombre completo'}),
            'email_cliente': forms.EmailInput(attrs={'placeholder': 'tu_correo@ejemplo.com'}),
            'telefono_cliente': forms.TextInput(attrs={'placeholder': 'Tu número de teléfono (Opcional)'}),
            'descripcion_evento': forms.Textarea(attrs={'rows': 4, 'placeholder': 'Detalles adicionales de tu solicitud...'}),
        }
        labels = {
            'nombre_cliente': 'Nombre Completo',
            'email_cliente': 'Correo Electrónico',
            'telefono_cliente': 'Teléfono de Contacto',
            'servicio_interesado': 'Servicio de Interés',
            'descripcion_evento': 'Describe tu Solicitud',
        }
        help_texts = {
            'email_cliente': 'Nos pondremos en contacto contigo a través de este correo.',
        }

# --- CORRECCIÓN AQUÍ: ServicioForm debe estar fuera de SolicitudCotizacionForm ---
class ServicioForm(forms.ModelForm): # Este es el formulario para tu panel de admin personalizado
    class Meta:
        model = Servicio
        fields = ['nombre', 'descripcion', 'imagen']
        widgets = {
            'nombre': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Nombre del servicio'}),
            'descripcion': forms.Textarea(attrs={'class': 'form-control', 'rows': 5, 'placeholder': 'Descripción detallada del servicio'}),
            'imagen': forms.ClearableFileInput(attrs={'class': 'form-control-file'}), # Permite limpiar la imagen o subir una nueva
        }
        labels = {
            'nombre': 'Nombre del Servicio',
            'descripcion': 'Descripción',
            'imagen': 'Imagen del Servicio',
        }

class MensajeContactoForm(forms.ModelForm): # Asumo que ya tenías este o lo crearías
    class Meta:
        model = MensajeContacto
        fields = ['nombre_remitente', 'email_remitente', 'asunto', 'mensaje']
        widgets = {
            'nombre_remitente': forms.TextInput(attrs={'placeholder': 'Tu nombre'}),
            'email_remitente': forms.EmailInput(attrs={'placeholder': 'tu_correo@ejemplo.com'}),
            'asunto': forms.TextInput(attrs={'placeholder': 'Asunto del mensaje'}),
            'mensaje': forms.Textarea(attrs={'rows': 5, 'placeholder': 'Escribe tu mensaje aquí...'}),
        }
        labels = {
            'nombre_remitente': 'Tu Nombre',
            'email_remitente': 'Tu Correo Electrónico',
            'asunto': 'Asunto',
            'mensaje': 'Mensaje',
        }