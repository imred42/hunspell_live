import React, { useState, useRef, useEffect } from "react";
import CustomDropdown from "./CustomDropdown";
import VisualKeyboard from "./VisualKeyboard";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import { FaTrashAlt } from 'react-icons/fa';
import { useSpellChecker } from '../hooks/useSpellChecker';
import { styles } from '../styles/HomePage.styles';
import * as HoverCard from "@radix-ui/react-hover-card";
import { LanguageOption, SpellingResult } from '../types/spelling';
import { SPECIAL_CHARACTERS } from '../constants/language';

const HomePage: React.FC = () => {
  const [selectedOption, setSelectedOption] = useState<LanguageOption>(() => {
    const savedLanguage = localStorage.getItem('selectedLanguage');
    if (savedLanguage) {
      return JSON.parse(savedLanguage);
    }
    return {
      label: "English",
      value: "en",
    };
  });
  
  const [text, setText] = useState('');
  const [spellingResults, setSpellingResults] = useState<SpellingResult[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const { 
    checkSpelling,
    getSuggestions,
  } = useSpellChecker(selectedOption.value);

  const options: LanguageOption[] = [
    { label: "English", value: "en" },
    { label: "Español", value: "es" },
    { label: "Français", value: "fr" },
    { label: "Deutsch", value: "de" },
    { label: "Italiano", value: "it" },
    { label: "Português", value: "pt" },
  ];

  const handleSelectChange = (option: LanguageOption) => {
    localStorage.setItem('selectedLanguage', JSON.stringify(option));
    setSelectedOption(option);
    window.location.reload();
  };

  const handleTextChange = (event: React.FormEvent<HTMLDivElement>) => {
    const newText = event.currentTarget.innerText;
    setText(newText);
    setSpellingResults([]);
    
    // Ensure cursor stays at the end of content
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const lastChild = event.currentTarget.lastChild;
      if (lastChild) {
        range.setStartAfter(lastChild);
        range.setEndAfter(lastChild);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  };

  const handleCheckSpelling = async () => {
    if (!text.trim()) {
      toast.warning('Please enter some text to check spelling');
      return;
    }
    
    const newResults = await checkSpelling(text);
    if (newResults.length > 0) {
      highlightMisspelledWords(newResults);
      toast.error(`Found ${newResults.length} spelling error${newResults.length === 1 ? '' : 's'}`);
    } else {
      toast.success('No spelling errors found!');
    }
  };

  const highlightMisspelledWords = (results: SpellingResult[]) => {
    if (!editorRef.current) return;

    const textContent = editorRef.current.innerText;
    let html = '';
    let lastIndex = 0;

    results.forEach((result) => {
      const wordStart = result.index;
      const wordEnd = result.index + result.word.length;
      
      // Add text before the misspelled word
      html += textContent.slice(lastIndex, wordStart);
      
      // Add the misspelled word with highlighting
      const misspelledWord = textContent.slice(wordStart, wordEnd);
      html += `<span 
        class="misspelled" 
        data-word="${misspelledWord}"
        data-start="${wordStart}"
        style="text-decoration: underline dashed red; color: red; cursor: text;"
      >${misspelledWord}</span>`;
      
      lastIndex = wordEnd;
    });

    // Add any remaining text
    html += textContent.slice(lastIndex);
    
    // Save current cursor position
    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);
    const cursorOffset = range?.endOffset || 0;
    
    // Update content
    editorRef.current.innerHTML = html;
    setSpellingResults(results);

    // Add click handlers to misspelled words
    const misspelledElements = editorRef.current.getElementsByClassName('misspelled');
    Array.from(misspelledElements).forEach(element => {
      element.addEventListener('click', handleMisspelledWordClick);
    });

    // Restore cursor position at the end of the content
    if (editorRef.current) {
      const newRange = document.createRange();
      const lastChild = editorRef.current.lastChild;
      if (lastChild) {
        newRange.setStartAfter(lastChild);
        newRange.setEndAfter(lastChild);
        selection?.removeAllRanges();
        selection?.addRange(newRange);
      }
    }
  };

  const handleMisspelledWordClick = async (event: Event) => {
    const element = event.target as HTMLSpanElement;
    const word = element.dataset.word;
    const startPosition = parseInt(element.dataset.start || '0', 10);
    
    if (!word) return;

    const suggestions = await getSuggestions(word);
    
    // Create and show suggestions popup
    const popup = document.createElement('div');
    
    // Calculate position relative to the clicked word
    const rect = element.getBoundingClientRect();
    popup.style.position = 'fixed';
    popup.style.left = `${rect.left}px`;
    popup.style.top = `${rect.bottom + 8}px`;
    popup.style.backgroundColor = '#ffffff';
    popup.style.border = '2px solid #e2e8f0';
    popup.style.borderRadius = '12px';
    popup.style.padding = '12px 0';
    popup.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    popup.style.zIndex = '1000';
    popup.style.maxHeight = '300px';
    popup.style.overflowY = 'auto';
    popup.style.minWidth = `${Math.max(rect.width, 150)}px`;

    if (suggestions.suggestions.length === 0) {
      // Add message for no suggestions
      const noSuggestionsElement = document.createElement('div');
      noSuggestionsElement.textContent = 'No suggestions available';
      noSuggestionsElement.style.padding = '8px 16px';
      noSuggestionsElement.style.fontSize = '18px';
      noSuggestionsElement.style.fontWeight = 'bold';
      noSuggestionsElement.style.color = '#6b7280';
      noSuggestionsElement.style.fontStyle = 'italic';
      popup.appendChild(noSuggestionsElement);
    } else {
      suggestions.suggestions.forEach(suggestion => {
        const suggestionElement = document.createElement('div');
        suggestionElement.textContent = suggestion;
        suggestionElement.style.padding = '8px 16px';
        suggestionElement.style.cursor = 'pointer';
        suggestionElement.style.fontSize = '18px';
        suggestionElement.style.fontWeight = 'bold';
        suggestionElement.style.color = '#374151';
        suggestionElement.style.margin = '0';
        
        suggestionElement.addEventListener('mouseover', () => {
          suggestionElement.style.backgroundColor = '#f3f4f6';
          suggestionElement.style.color = '#000000';
        });
        suggestionElement.addEventListener('mouseout', () => {
          suggestionElement.style.backgroundColor = 'transparent';
          suggestionElement.style.color = '#374151';
        });
        suggestionElement.addEventListener('click', () => {
          handleSuggestionClick(suggestion, word, startPosition);
          document.body.removeChild(popup);
        });
        popup.appendChild(suggestionElement);
      });
    }

    document.body.appendChild(popup);

    // Remove popup when clicking outside
    const handleClickOutside = (e: MouseEvent) => {
      if (!popup.contains(e.target as Node) && document.body.contains(popup)) {
        document.body.removeChild(popup);
        document.removeEventListener('click', handleClickOutside);
      }
    };
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);
  };

  const handleSuggestionClick = (suggestion: string, originalWord: string, startPosition: number) => {
    if (!editorRef.current) return;

    const content = editorRef.current.innerHTML;
    const regex = new RegExp(`<span[^>]*data-word="${originalWord}"[^>]*>${originalWord}</span>`);
    const newContent = content.replace(regex, suggestion);
    editorRef.current.innerHTML = newContent;
    
    // Update text state
    setText(editorRef.current.innerText);
    
    // Remove the replaced word from spelling results
    setSpellingResults(prev => 
      prev.filter(result => !(result.word === originalWord && result.index === startPosition))
    );

    // Reattach click handlers to remaining misspelled words
    const misspelledElements = editorRef.current.getElementsByClassName('misspelled');
    Array.from(misspelledElements).forEach(element => {
      element.addEventListener('click', handleMisspelledWordClick);
    });
  };

  const handleCharacterInsert = (character: string) => {
    if (!editorRef.current) return;
    
    // Get the current selection
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    const textNode = document.createTextNode(character);
    range.insertNode(textNode);
    
    // Move cursor after inserted character
    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    selection.removeAllRanges();
    selection.addRange(range);
    
    // Update text state
    setText(editorRef.current.innerText);
  };

  // Disable scrolling on the entire page
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const focusEditor = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const currentSpecialCharacters = SPECIAL_CHARACTERS[selectedOption.value] || [];

  return (
    <div
      ref={containerRef}
      style={styles.container}
      onClick={focusEditor}
    >
      <div style={styles.content}>
        <h1 style={styles.title}>
          Spell Checking Tool
        </h1>

        <div style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "24px",
        }}>
          <CustomDropdown
            options={options}
            value={selectedOption}
            onChange={handleSelectChange}
          />
          <VisualKeyboard
            onCharacterClick={handleCharacterInsert}
            characters={currentSpecialCharacters}
          />
          <div
            ref={editorRef}
            contentEditable
            onInput={handleTextChange}
            style={{
              ...styles.editor,
              textAlign: 'left',
              caretColor: 'auto',
            }}
            data-placeholder="Enter or paste your text here to check spelling"
          />
          <button
            onClick={handleCheckSpelling}
            style={styles.checkButton}
          >
            Check Spelling
          </button>
        </div>
      </div>
      <ToastContainer
        position="top-center"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

export default HomePage;