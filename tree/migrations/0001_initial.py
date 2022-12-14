# Generated by Django 4.1.2 on 2022-10-27 14:38

from django.db import migrations, models
import django.db.models.deletion
import django.db.models.manager
import tinymce.models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Dialog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=50, verbose_name='Название')),
                ('description', models.TextField(blank=True, verbose_name='Описание')),
                ('slug', models.SlugField(unique=True)),
            ],
            options={
                'verbose_name': 'Диалог',
                'verbose_name_plural': 'Диалоги',
            },
        ),
        migrations.CreateModel(
            name='DynamicField',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('label', models.SlugField(verbose_name='Метка в тексте')),
                ('name', models.CharField(max_length=50, verbose_name='Обозначение')),
                ('default_value', models.CharField(default='Unknown', max_length=50, verbose_name='Значение по умолчанию')),
            ],
            options={
                'verbose_name': 'Динамичное поле',
                'verbose_name_plural': 'Динамичные поля',
            },
        ),
        migrations.CreateModel(
            name='Phrase',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=100, verbose_name='Краткое описание')),
                ('text', tinymce.models.HTMLField(verbose_name='Текст')),
                ('billet', models.JSONField(blank=True, null=True, verbose_name='Заготовка')),
                ('initial', models.BooleanField(default=False, verbose_name='Начальная фраза')),
                ('dialog', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='tree.dialog', verbose_name='Диалог')),
                ('requests_fill', models.ManyToManyField(blank=True, to='tree.dynamicfield', verbose_name='Запрос на заполнение динамичного поля')),
            ],
            options={
                'verbose_name': 'Фраза',
                'verbose_name_plural': 'Фразы',
            },
            managers=[
                ('run_query', django.db.models.manager.Manager()),
            ],
        ),
        migrations.CreateModel(
            name='Reaction',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=50, verbose_name='Ответ клиента')),
                ('from_phrase', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='from_phrase_set', to='tree.phrase', verbose_name='Принадлежность к фразе')),
                ('to_phrase', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='to_phrase_set', to='tree.phrase', verbose_name='Отсылка к фразе')),
            ],
            options={
                'verbose_name': 'Реакция',
                'verbose_name_plural': 'Реакции',
            },
        ),
    ]
