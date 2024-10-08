from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .services.grammar_checker import grammar_checker

class GrammarCheckerView(APIView):
    def post(self, request):
        text = request.data.get('text')
        if not text:
            return Response({"error": "Text is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        result = grammar_checker.check_grammar(text)
        
        return Response(result, status=status.HTTP_200_OK)