# Generated by Django 4.1.2 on 2022-10-28 08:30

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tree', '0002_dynamicfield_static'),
    ]

    operations = [
        migrations.AddField(
            model_name='dynamicfield',
            name='position',
            field=models.IntegerField(default=999, verbose_name='Позиция на странице'),
        ),
    ]