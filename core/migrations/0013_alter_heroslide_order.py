# Generated by Django 5.2.1 on 2025-06-18 20:39

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0012_heroslide'),
    ]

    operations = [
        migrations.AlterField(
            model_name='heroslide',
            name='order',
            field=models.PositiveIntegerField(default=1, help_text='Número de orden para los slides (1, 2, 3...). Sin números negativos.', verbose_name='Orden de aparición'),
        ),
    ]
