from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .services.spell_checker_service import spell_checker_service

class SpellCheckerView(APIView):
    def post(self, request):
        word = request.data.get('word')
        if not word:
            return Response({"error": "Word is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        is_correct = spell_checker_service.check_spelling(word)
        
        return Response({"is_correct": is_correct}, status=status.HTTP_200_OK)

class SpellCorrectionView(APIView):
    def post(self, request):
        word = request.data.get('word')
        if not word:
            return Response({"error": "Word is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        suggestions = spell_checker_service.get_suggestions(word)
        
        return Response({"suggestions": suggestions}, status=status.HTTP_200_OK)
