# proyecto_bodas/settings.py
"""
Django settings for proyecto_bodas project.
"""

from pathlib import Path
import os
from dotenv import load_dotenv  # Para cargar variables de entorno
from datetime import timedelta

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Carga las variables del archivo .env que está en la raíz del proyecto
load_dotenv(os.path.join(BASE_DIR, '.env'))

# --- CONFIGURACIONES BÁSICAS DE DJANGO ---
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-default-key-for-dev')
DEBUG = True
ALLOWED_HOSTS = []

# --- APLICACIONES ---
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.humanize',
    'core',
    'axes',
]
AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'axes.backends.AxesBackend',
]

# --- CONFIGURACIÓN FINAL DE DJANGO-AXES (SIN ADVERTENCIAS) ---

# --- CONFIGURACIÓN FINAL DE DJANGO-AXES (APUNTANDO A LA FUNCIÓN) ---
AXES_HANDLER = 'axes.handlers.database.AxesDatabaseHandler'
AXES_FAILURE_LIMIT = 5

# Apuntamos a nuestra función personalizada en utils.py para el bloqueo progresivo.
AXES_COOLOFF_TIME = 'core.utils.get_cooloff_time'
AXES_LOCKOUT_TEMPLATE = 'core/lockout.html'
MIDDLEWARE = [
    'axes.middleware.AxesMiddleware', 
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
SILENCED_SYSTEM_CHECKS = ['axes.W003']
ROOT_URLCONF = 'proyecto_bodas.urls'


TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'core.context_processors.chatbot_suggestions_processor',
            ],
        },
    },
]

WSGI_APPLICATION = 'proyecto_bodas.wsgi.application'

# --- BASE DE DATOS ---
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# --- VALIDACIÓN DE CONTRASEÑAS ---
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',},
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 10,  # <-- Aumenta este número para más seguridad
        }
    },
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',},
]

# --- INTERNACIONALIZACIÓN ---
LANGUAGE_CODE = 'es-cl'
TIME_ZONE = 'America/Santiago'
USE_I18N = True
USE_TZ = True

# --- ARCHIVOS ESTÁTICOS Y MULTIMEDIA ---
STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_DIRS = [ BASE_DIR / "core" / "static", ]
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# --- CONFIGURACIÓN DE CORREO ELECTRÓNICO (para enviar correos reales) ---
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER_GMAIL')      # Lee desde .env
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD_GMAIL')  # Lee desde .env
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL_GMAIL', EMAIL_HOST_USER)

# --- CONFIGURACIÓN DE AUTENTICACIÓN ---
LOGIN_URL = 'core:login'
LOGIN_REDIRECT_URL = 'core:admin_servicio_list'
LOGOUT_REDIRECT_URL = 'core:index'