from django.urls import path
from .views import DefaultDialog, DialogView

urlpatterns = [
	path('', DefaultDialog.as_view(), name='main'),
	path('dialog/<str:slug>', DialogView.as_view(), name='dialog_detail')
]
