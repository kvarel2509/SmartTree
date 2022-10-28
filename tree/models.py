from django.db import models
from re import split, fullmatch, search
from django.core.exceptions import ValidationError
from tinymce.models import HTMLField

from tree.src.constants import BilletType


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
	dialog = models.ForeignKey(Dialog, on_delete=models.CASCADE, verbose_name='Диалог')
	requests_fill = models.ManyToManyField(
		'DynamicField', blank=True, verbose_name='Запрос на заполнение динамичного поля'
	)

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
		pattern_split = r'(\${.+?})'
		pattern_execute = r'\${(.+)}'
		data = split(pattern_split, self.text)

		return [
			{'type': BilletType.DYNAMIC_FIELD, 'text': search(pattern_execute, item).group(1)}
			if fullmatch(pattern_split, item) else
			{'type': BilletType.TEXT, 'text': item}
			for item in data
		]

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

	def __str__(self):
		return self.name

	class Meta:
		verbose_name = 'Динамичное поле'
		verbose_name_plural = 'Динамичные поля'
