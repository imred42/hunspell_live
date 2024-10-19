from django.urls import path
from .views import SpellCheckerView, SpellCorrectionView

urlpatterns = [
    path('api/check-spelling/', SpellCheckerView.as_view(), name='check_spelling'),
    path('api/suggest-corrections/', SpellCorrectionView.as_view(), name='suggest_corrections'),
]

