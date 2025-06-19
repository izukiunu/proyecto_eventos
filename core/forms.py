# core/forms.py
from django import forms
from .models import SolicitudCotizacion, Servicio, MensajeContacto, ChatbotQA 
import re

from .models import Proyecto


class SolicitudCotizacionForm(forms.ModelForm):
    cotizacion_detallada = forms.CharField(
        widget=forms.HiddenInput(), 
        required=False
    )

    class Meta:
        model = SolicitudCotizacion
        # El campo 'telefono_cliente' ahora es requerido por el cambio en models.py
        fields = ['nombre_cliente', 'email_cliente', 'telefono_cliente', 'descripcion_evento']
        widgets = {
            'nombre_cliente': forms.TextInput(attrs={'placeholder': 'Tu nombre completo', 'class': 'form-control'}),
            'email_cliente': forms.EmailInput(attrs={'placeholder': 'tu_correo@ejemplo.com', 'class': 'form-control'}),
            'telefono_cliente': forms.TextInput(attrs={'placeholder': '+56912345678', 'class': 'form-control'}),
            'descripcion_evento': forms.Textarea(attrs={'rows': 4, 'placeholder': 'Detalles adicionales de tu evento...', 'class': 'form-control'}),
        }
        labels = {
            'nombre_cliente': 'Nombre Completo',
            'email_cliente': 'Correo Electrónico',
            'telefono_cliente': 'Teléfono de Contacto',
            'descripcion_evento': 'Describe tu Evento o Solicitud Adicional',
        }

    # --- NUEVA VALIDACIÓN PARA EL NOMBRE ---
    def clean_nombre_cliente(self):
        nombre = self.cleaned_data.get('nombre_cliente')
        # Esta expresión regular permite letras (incluyendo acentos y ñ) y espacios.
        if not re.match(r'^[a-zA-Z\sÁÉÍÓÚáéíóúÑñ]+$', nombre):
            raise forms.ValidationError("El nombre solo puede contener letras y espacios.")
        return nombre
class ProyectoForm(forms.ModelForm):
    class Meta:
        model = Proyecto
        fields = '__all__'


    # --- NUEVA VALIDACIÓN PARA EL TELÉFONO ---
    def clean_telefono_cliente(self):
        telefono = self.cleaned_data.get('telefono_cliente')
        # Esta expresión regular permite un signo '+' opcional al inicio, seguido de números y espacios.
        if not re.match(r'^\+?[0-9\s]+$', telefono):
            raise forms.ValidationError("El teléfono solo puede contener números, espacios y el signo '+' al inicio.")
        return telefono

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