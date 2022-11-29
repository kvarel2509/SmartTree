from django.db import models
from re import split, search
from django.core.exceptions import ValidationError
from tinymce.models import HTMLField

from tree.src.constants import BILLET_TYPES


class Dialog(models.Model):
	title = models.CharField('Название', max_length=50)
	description = models.TextField('Описание', blank=True)
	slug = models.SlugField(max_length=50, unique=True)

	def __str__(self):
		return self.slug

	class Meta:
		verbose_name = 'Диалог'
		verbose_name_plural = 'Диалоги'


class PhraseManager(models.Manager):
	def has_initial(self, dialog_id):
		return self.filter(dialog=dialog_id, initial=True).exists()

	def count_initial(self, dialog_id):
		return self.filter(dialog=dialog_id, initial=True).count()


class Phrase(models.Model):
	run_query = PhraseManager()
	title = models.CharField('Краткое описание', max_length=100)
	text = HTMLField('Текст')
	billet = models.JSONField('Заготовка', blank=True, null=True)
	initial = models.BooleanField('Начальная фраза', default=False)
	timer = models.DurationField('Таймер')
	dialog = models.ForeignKey(Dialog, on_delete=models.CASCADE, verbose_name='Диалог')

	def clean(self):
		self._check_for_single_initial_phrase()
		self.billet = self._get_billet()

	def _check_for_single_initial_phrase(self):
		if any([
			not self.pk and self.initial and Phrase.run_query.has_initial(self.dialog_id),
			self.pk and self.initial and Phrase.run_query.count_initial(self.dialog_id) > 1
		]):
			raise ValidationError('Диалог может содержать тольку одну начальную фразу')

	def _get_billet(self):
		split_pattern = r'(\${.+?})'
		parse_pattern = r'\${(.+?):(.+?)}'
		data = split(split_pattern, self.text)
		billet = []

		for item in data:
			parse_item = search(parse_pattern, item)
			
			if parse_item:
				billet_item_type = BILLET_TYPES.get(parse_item.group(1))
				
				if not billet_item_type:
					raise ValidationError(f'Типа {parse_item.group(1)} не существует')

				billet.append({'type': billet_item_type, 'value': parse_item.group(2)})
			else:
				billet.append({'type': 'text', 'value': item})

		return billet

	def __str__(self):
		return f'Phrase {self.pk} / {self.title}'

	class Meta:
		verbose_name = 'Фраза'
		verbose_name_plural = 'Фразы'


class Reaction(models.Model):
	title = models.CharField('Ответ клиента', max_length=50)
	from_phrase = models.ForeignKey(
		Phrase, on_delete=models.CASCADE, verbose_name='Принадлежность к фразе', related_name='from_phrase_set'
	)
	to_phrase = models.ForeignKey(
		Phrase, on_delete=models.CASCADE, verbose_name='Отсылка к фразе', related_name='to_phrase_set'
	)

	def __str__(self):
		return self.title

	class Meta:
		verbose_name = 'Реакция'
		verbose_name_plural = 'Реакции'


class DynamicField(models.Model):
	label = models.SlugField('Метка в тексте', max_length=50)
	name = models.CharField('Обозначение', max_length=50)
	default_value = models.CharField('Значение по умолчанию', max_length=50, default='Unknown')
	changeable = models.BooleanField('Разное значение для каждого разговора', default=True)
	position = models.IntegerField('Позиция на странице', default=999)

	def __str__(self):
		return self.name

	class Meta:
		verbose_name = 'Динамичное поле'
		verbose_name_plural = 'Динамичные поля'
