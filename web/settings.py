"""
Django settings for web project.

Generated by 'django-admin startproject' using Django 2.0.5.

For more information on this file, see
https://docs.djangoproject.com/en/2.0/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/2.0/ref/settings/
"""

import boto3
import json
import os
from botocore.exceptions import NoCredentialsError


def get_secret(secret_name, region_name):
    session = boto3.session.Session()
    client = session.client(
        service_name='secretsmanager',
        region_name=region_name
    )
    get_secret_value_response = client.get_secret_value(
        SecretId=secret_name
    )
    return json.loads(get_secret_value_response['SecretString'])


REGION_NAME = "us-east-2"

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/2.0/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
# try:
#     SECRET_KEY = get_secret("brainscore-django-secret-key", REGION_NAME)["SECRET_KEY"]
# except NoCredentialsError:
SECRET_KEY = 'dummy'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv("DEBUG", "False") == "True"

# AWS fix to add the IP of the AWS Instance to ALLOWED_HOSTS
hosts_list = os.getenv("DOMAIN", "localhost:brain-score-web-dev.us-east-2.elasticbeanstalk.com").split(":")
if os.getenv("DJANGO_ENV") == 'development': hosts_list.append('127.0.0.1')
hosts_list.append("Brain-score-web-prod-updated.kmk2mcntkw.us-east-2.elasticbeanstalk.com")  # updated prod site
hosts_list.append("Brain-score-web-dev-updated.kmk2mcntkw.us-east-2.elasticbeanstalk.com")  # updated dev site
ALLOWED_HOSTS = hosts_list

# Allows E-mail use
# After 6/1/22, Google removed login with username/password from "less secure apps" (i.e. Django)
# django_gmail_password thus is an app-specific login for Gmail (adds Django as authorized login for Gmail)
# try:
#     email_secrets = get_secret("brainscore-email", REGION_NAME)
# except NoCredentialsError:
#     email_secrets = {'host': None, 'address': None, 'password': None, 'django_gmail_password': None}
EMAIL_USE_TLS = True
EMAIL_HOST = None  # email_secrets["host"]
EMAIL_PORT = 587
EMAIL_HOST_USER = None # email_secrets["address"]
EMAIL_HOST_PASSWORD = None # email_secrets["django_gmail_password"]

LOGOUT_REDIRECT_URL = '/'

# Application definition

INSTALLED_APPS = [
    'benchmarks.apps.BenchmarksConfig',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'compressor',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'web.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'web.wsgi.application'


# Database
# https://docs.djangoproject.com/en/2.0/ref/settings/#databases

def get_db_info():
    # if os.getenv("DJANGO_ENV") == "development":
    #     from dotenv import load_dotenv; load_dotenv()

    #     return {
    #         'default': {
    #             'ENGINE': 'django.db.backends.postgresql_psycopg2',
    #             'NAME': 'dev',
    #             'USER': 'postgres',
    #             'PASSWORD': os.getenv('DB_PASSWORD'),
    #             'HOST': os.getenv('DB_HOST'),
    #             'PORT': '5432'
    #         }
    #     }
    # db_secret_name = os.getenv("DB_CRED", "brainscore-1-ohio-cred")
    # try:
    #     secrets = get_secret(db_secret_name, REGION_NAME)
    #     DATABASES = {
    #         'default': {
    #             'ENGINE': 'django.db.backends.postgresql_psycopg2',
    #             'NAME': secrets["dbInstanceIdentifier"],
    #             'USER': secrets["username"],
    #             'PASSWORD': secrets["password"],
    #             'HOST': secrets["host"],
    #             'PORT': secrets["port"]
    #         }
    #     }
    # except NoCredentialsError:
    #     if 'RDS_DB_NAME' in os.environ:  # when deployed to AWS, use environment settings for database
    #         DATABASES = {
    #             'default': {
    #                 'ENGINE': 'django.db.backends.postgresql_psycopg2',
    #                 'NAME': os.environ['RDS_DB_NAME'],
    #                 'USER': os.environ['RDS_USERNAME'],
    #                 'PASSWORD': os.environ['RDS_PASSWORD'],
    #                 'HOST': os.environ['RDS_HOSTNAME'],
    #                 'PORT': os.environ['RDS_PORT'],
    #             }
    #         }
    #     else:  # for deployment, use local sqlite
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
        }
    }
    return DATABASES


DATABASES = get_db_info()

# Password validation
# https://docs.djangoproject.com/en/2.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
# https://docs.djangoproject.com/en/2.0/topics/i18n/

# Security settings for headers and cookies
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True


LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'America/New_York'

USE_I18N = True

USE_L10N = True

USE_TZ = True

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/2.0/howto/static-files/

STATIC_URL = '/static/'
STATIC_ROOT = 'static/'
STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
    'compressor.finders.CompressorFinder',
)

# compress
COMPRESS_PRECOMPILERS = (
    ('text/less', 'lessc {infile} {outfile}'),
    ('text/x-sass', 'sass {infile} {outfile}'),
)

AUTH_USER_MODEL = 'benchmarks.User'

# Logging
log_level = 'DEBUG' if DEBUG else 'INFO'
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'basic': {'format': '%(asctime)s %(name)-15.15s %(levelname)-8.8s %(message)s'}
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'basic',
        },
        'file': {
            'level': log_level,
            'class': 'logging.FileHandler',
            'formatter': 'basic',
            'filename': os.path.join(BASE_DIR, 'django.log'),
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file', 'console'],
            'level': log_level,
            'propagate': True,
        },
    },
}
