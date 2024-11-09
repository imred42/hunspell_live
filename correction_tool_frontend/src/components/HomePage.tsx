import React, { useState, useRef, useEffect } from "react";
import {
  Editor,
  EditorState,
  CompositeDecorator,
  Modifier,
  SelectionState,
} from "draft-js";
import "draft-js/dist/Draft.css";
import CustomDropdown from "./CustomDropdown";
import VisualKeyboard from "./VisualKeyboard";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import { FaTrashAlt } from 'react-icons/fa';
import { useSpellChecker } from '../hooks/useSpellChecker';
import { styles } from '../styles/HomePage.styles';
import * as HoverCard from "@radix-ui/react-hover-card";

const HomePage: React.FC = () => {
  const [selectedOption, setSelectedOption] = useState<LanguageOption>(() => {
    const savedLanguage = localStorage.getItem('selectedLanguage');
    if (savedLanguage) {
      const parsed = JSON.parse(savedLanguage);
      return parsed;
    }
    return {
      label: "English",
      value: "en",
    };
  });
  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const [spellingResults, setSpellingResults] = useState<SpellingResult[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Editor>(null);

  const { 
    checkSpelling,
    getSuggestions,
    currentSuggestions: spellSuggestions, 
    replaceWord,
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

  const handleClear = () => {
    const currentLanguage = localStorage.getItem('selectedLanguage');
    window.location.reload();
    if (currentLanguage) {
      localStorage.setItem('selectedLanguage', currentLanguage);
    }
  };

  const handleTextChange = (newEditorState: EditorState) => {
    const oldContent = editorState.getCurrentContent();
    const newContent = newEditorState.getCurrentContent();

    if (oldContent !== newContent) {
      setSpellingResults([]);
    }

    setEditorState(newEditorState);
  };

  const handleCheckSpelling = async () => {
    const contentState = editorState.getCurrentContent();
    const text = contentState.getPlainText();
    
    const newResults = await checkSpelling(text);
    if (newResults.length > 0) {
      updateEditorWithSpellingResults(newResults);
      toast.error(`Found ${newResults.length} spelling error${newResults.length === 1 ? '' : 's'}`);
    } else {
      toast.success('No spelling errors found!');
    }
  };

  const handleSuggestionClick = (suggestion: string, decoratedText: string, start: number) => {
    const newEditorState = replaceWord(editorState, decoratedText, suggestion, start);
    setEditorState(newEditorState);
    
    // Remove the replaced word from spelling results
    setSpellingResults(prev => 
      prev.filter(result => !(result.word === decoratedText && result.index === start))
    );
  };

  const updateEditorWithSpellingResults = (
    results: SpellingResult[],
    selection?: SelectionState
  ) => {
    const currentSelection = editorState.getSelection();

    const decorator = new CompositeDecorator([
      {
        strategy: (contentBlock, callback) => {
          const text = contentBlock.getText();
          results.forEach((result) => {
            let start = 0;
            const searchWord = result.word;
            
            while (true) {
              const index = text.slice(start).indexOf(searchWord);
              if (index === -1) break;
              
              const absoluteStart = start + index;
              const absoluteEnd = absoluteStart + searchWord.length;
              
              const beforeChar = absoluteStart > 0 ? text[absoluteStart - 1] : ' ';
              const afterChar = absoluteEnd < text.length ? text[absoluteEnd] : ' ';
              
              if (!/\p{L}/u.test(beforeChar) && !/\p{L}/u.test(afterChar)) {
                callback(absoluteStart, absoluteEnd);
              }
              
              start = absoluteStart + 1;
            }
          });
        },
        component: ({
          children,
          decoratedText,
          offsetKey,
        }) => {
          const [suggestions, setSuggestions] = useState<string[]>([]);
          const startPosition = parseInt(offsetKey.split('-')[0], 10);
          
          const handleHover = async () => {
            const result = await getSuggestions(decoratedText);
            setSuggestions(result.suggestions);
          };
          
          return (
            <HoverCard.Root onOpenChange={(open) => {
              if (open) handleHover();
            }}>
              <HoverCard.Trigger asChild>
                <span
                  style={{
                    textDecoration: "underline dashed",
                    textDecorationColor: "red",
                    cursor: "pointer",
                    fontStyle: "italic",
                    color: "red"
                  }}
                >
                  {children}
                </span>
              </HoverCard.Trigger>
              <HoverCard.Portal>
                <HoverCard.Content className="HoverCardContent" sideOffset={5}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7, padding: "10px" }}>
                    {suggestions.map((suggestion, index) => (
                      <div 
                        key={index} 
                        className="Text"
                        onClick={() => handleSuggestionClick(suggestion, decoratedText, startPosition)}
                        style={{ cursor: 'pointer', padding: '4px' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                  <HoverCard.Arrow className="HoverCardArrow" />
                </HoverCard.Content>
              </HoverCard.Portal>
            </HoverCard.Root>
          );
        },
      },
    ]);

    let newEditorState = EditorState.set(editorState, { decorator });
    newEditorState = EditorState.forceSelection(newEditorState, currentSelection);
    setEditorState(newEditorState);
  };

  const handleCharacterInsert = (character: string) => {
    const contentState = editorState.getCurrentContent();
    const selectionState = editorState.getSelection();
    const newContentState = Modifier.insertText(
      contentState,
      selectionState,
      character
    );
    const newEditorState = EditorState.push(
      editorState,
      newContentState,
      "insert-characters"
    );
    setEditorState(newEditorState);
  };

  // Disable scrolling on the entire page
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto"; // Re-enable scrolling when component unmounts
    };
  }, []);

  const focusEditor = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const languageSpecialCharacters: { [key: string]: string[] } = {
    en: [], // English has no special characters
    es: ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü'],
    fr: ['à', 'â', 'ç', 'é', 'è', 'ê', 'ë', 'î', 'ï', 'ô', 'ù', 'û', 'ü', 'ÿ'],
    de: ['ä', 'ö', 'ü', 'ß'],
    it: ['à', 'è', 'é', 'ì', 'î', 'ò', 'ù'],
    pt: ['á', 'â', 'ã', 'ç', 'é', 'ê', 'í', 'ó', 'ô', 'õ', 'ú'],
    // Add more languages and their special characters as needed
  };

  const currentSpecialCharacters =
    languageSpecialCharacters[selectedOption.value] || [];

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
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-start',
            marginTop: '16px',
            marginBottom: '16px'
          }}>
            <button
              onClick={handleClear}
              onMouseEnter={(e) => {
                const target = e.currentTarget;
                target.style.backgroundColor = "#dc3545";
                target.style.color = "white";
              }}
              onMouseLeave={(e) => {
                const target = e.currentTarget;
                target.style.backgroundColor = "white";
                target.style.color = "#dc3545";
              }}
              style={styles.clearButton}
            >
              <FaTrashAlt size={12} />
            </button>
          </div>
          <VisualKeyboard
            onCharacterClick={handleCharacterInsert}
            characters={currentSpecialCharacters}
          />
          <div style={styles.editor}>
            <Editor
              ref={editorRef}
              editorState={editorState}
              onChange={handleTextChange}
              placeholder="Enter or paste your text here to check spelling"
            />
          </div>
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
