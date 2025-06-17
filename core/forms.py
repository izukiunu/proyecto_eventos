# core/forms.py
from django import forms
from .models import SolicitudCotizacion, Servicio, MensajeContacto, ChatbotQA 

class SolicitudCotizacionForm(forms.ModelForm):
    class Meta:
        model = SolicitudCotizacion
        fields = ['nombre_cliente', 'email_cliente', 'telefono_cliente', 'servicio_interesado', 'descripcion_evento']
        widgets = {
            'nombre_cliente': forms.TextInput(attrs={'placeholder': 'Tu nombre completo', 'class': 'form-control'}),
            'email_cliente': forms.EmailInput(attrs={'placeholder': 'tu_correo@ejemplo.com', 'class': 'form-control'}),
            'telefono_cliente': forms.TextInput(attrs={'placeholder': 'Tu número de teléfono (Opcional)', 'class': 'form-control'}),
            'servicio_interesado': forms.Select(attrs={'class': 'form-control'}), # Añadido para consistencia si usas clases
            'descripcion_evento': forms.Textarea(attrs={'rows': 4, 'placeholder': 'Detalles adicionales de tu solicitud...', 'class': 'form-control'}),
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

class ServicioForm(forms.ModelForm): # Para el panel de admin personalizado
    class Meta:
        model = Servicio
        fields = ['nombre', 'descripcion', 'imagen', 'destacado','precio']
        widgets = {
            'nombre': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Nombre del servicio'}),
            'descripcion': forms.Textarea(attrs={'class': 'form-control', 'rows': 5, 'placeholder': 'Descripción detallada del servicio'}),
            'imagen': forms.ClearableFileInput(attrs={'class': 'form-control-file'}),
            'destacado': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'precio': forms.NumberInput(attrs={'class': 'form-control', 'placeholder': 'Ej: 250000.00'}),
        }
        labels = {
            'nombre': 'Nombre del Servicio',
            'descripcion': 'Descripción',
            'imagen': 'Imagen del Servicio',
            'destacado': 'Marcar como Servicio Destacado',
        }

class MensajeContactoForm(forms.ModelForm):
    class Meta:
        model = MensajeContacto
        fields = ['nombre_remitente', 'email_remitente', 'asunto', 'mensaje']
        widgets = {
            'nombre_remitente': forms.TextInput(attrs={'placeholder': 'Tu nombre', 'class': 'form-control'}),
            'email_remitente': forms.EmailInput(attrs={'placeholder': 'tu_correo@ejemplo.com', 'class': 'form-control'}),
            'asunto': forms.TextInput(attrs={'placeholder': 'Asunto del mensaje (Opcional)', 'class': 'form-control'}), # Asunto puede ser opcional
            'mensaje': forms.Textarea(attrs={'rows': 5, 'placeholder': 'Escribe tu mensaje aquí...', 'class': 'form-control'}),
        }
        labels = {
            'nombre_remitente': 'Tu Nombre',
            'email_remitente': 'Tu Correo Electrónico',
            'asunto': 'Asunto',
            'mensaje': 'Mensaje',
        }
class ChatbotQAForm(forms.ModelForm):
    class Meta:
        model = ChatbotQA
        fields = ['keywords', 'respuesta']
        widgets = {
            'keywords': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Ej: horario, atencion, abierto'}),
            'respuesta': forms.Textarea(attrs={'class': 'form-control', 'rows': 4, 'placeholder': 'Escribe aquí la respuesta del bot...'}),
        }
        labels = {
            'keywords': "Palabras Clave (separadas por comas)",
            'respuesta': "Respuesta del Bot",
        }