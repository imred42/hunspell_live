from django.urls import path
from .views import GrammarCheckerView

urlpatterns = [
    path('api/check-grammar/', GrammarCheckerView.as_view(), name='check_grammar'),
]