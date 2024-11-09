import { useState } from 'react';
import { apiRequest } from '../utils/config';
import { SpellingResult, SpellingSuggestion } from '../types/spelling';
import { LANGUAGE_CODE_MAP } from '../constants/language';
import { toast } from 'react-toastify';

export const useSpellChecker = (selectedLanguage: string) => {
  const [spellingResults, setSpellingResults] = useState<SpellingResult[]>([]);
  const [currentSuggestions, setCurrentSuggestions] = useState<SpellingSuggestion | null>(null);

  const checkSpelling = async (text: string) => {
    if (!text.trim()) {
      toast.warning('Please enter some text to check spelling');
      return [];
    }

    const wordRegex = /[\p{L}\p{M}]+/gu;
    let match;
    const wordsWithIndices: { word: string; index: number }[] = [];

    while ((match = wordRegex.exec(text)) !== null) {
      wordsWithIndices.push({ 
        word: match[0],
        index: match.index 
      });
    }

    const uniqueWords = [...new Set(wordsWithIndices.map(item => item.word))];

    try {
      const response = await apiRequest("/api/check/", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          words: uniqueWords,
          language: LANGUAGE_CODE_MAP[selectedLanguage] || 'en_US',
        })
      });

      if (!response.ok) throw new Error("Failed to check spelling");
      
      const result = await response.json();
      const incorrectWords = result.results
        .filter((res: { word: string; is_correct: boolean }) => !res.is_correct)
        .map((res: { word: string; is_correct: boolean }) => res.word);

      const newResults = wordsWithIndices
        .filter(({ word }) => 
          incorrectWords.some(incorrect => 
            incorrect.localeCompare(word, selectedLanguage, { sensitivity: 'base' }) === 0))
        .map(({ word, index }) => ({
          index,
          word,
          length: word.length,
        }));

      setSpellingResults(newResults);
      return newResults;
    } catch (error) {
      console.error("Error checking spelling:", error);
      toast.error('Failed to check spelling. Please try again.');
      return [];
    }
  };

  const getSuggestions = async (word: string) => {
    try {
      const response = await apiRequest("/api/get-list/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          words: [word],
          language: LANGUAGE_CODE_MAP[selectedLanguage] || 'en_US',
        }),
      });

      if (!response.ok) throw new Error("Failed to get suggestions");

      const result = await response.json();
      const suggestions = {
        suggestions: result.suggestions[word] || [],
        language: result.language
      };
      
      setCurrentSuggestions(suggestions);
      return suggestions;
    } catch (error) {
      console.error("Error getting suggestions:", error);
      toast.error('Failed to get suggestions. Please try again.');
      const fallback = {
        suggestions: [],
        language: selectedLanguage
      };
      setCurrentSuggestions(fallback);
      return fallback;
    }
  };

  return {
    spellingResults,
    currentSuggestions,
    checkSpelling,
    getSuggestions,
  };
}