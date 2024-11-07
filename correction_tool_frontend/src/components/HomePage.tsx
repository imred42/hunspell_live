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
import DraggableWindow from "./DraggableWindow";
import WordCards from "./WordCards";
import { apiRequest } from "../utils/config";
import VisualKeyboard from "./VisualKeyboard";

// Types for the main component
interface SpellingSuggestion {
  suggestions: string[];
  language: string;
}

interface SpellingResult {
  index: number;
  word: string;
  length: number;
}

interface LanguageOption {
  label: string;
  value: string;
}

const HomePage: React.FC = () => {
  const [selectedOption, setSelectedOption] = useState<LanguageOption>({
    label: "English",
    value: "en",
  });
  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const [spellingResults, setSpellingResults] = useState<SpellingResult[]>([]);
  const [isWindowOpen, setIsWindowOpen] = useState(false);
  const [windowPosition, setWindowPosition] = useState({ x: 0, y: 0 });
  const [currentSuggestions, setCurrentSuggestions] =
    useState<SpellingSuggestion | null>(null);
  const [selectedWordInfo, setSelectedWordInfo] = useState<{
    word: string;
    start: number;
    end: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Editor>(null);

  const options: LanguageOption[] = [
    { label: "English", value: "en" },
    { label: "Español", value: "es" },
    { label: "Français", value: "fr" },
    { label: "Deutsch", value: "de" },
    { label: "Italiano", value: "it" },
    { label: "Português", value: "pt" },
  ];

  const handleSelectChange = (option: LanguageOption) => {
    setSelectedOption(option);
    setSpellingResults([]);
    setEditorState(EditorState.createEmpty());
  };

  const handleTextChange = (newEditorState: EditorState) => {
    setEditorState(newEditorState);
    setSpellingResults([]);
  };

  const handleCheckSpelling = async () => {
    const text = editorState.getCurrentContent().getPlainText();
    const words = text.split(/\s+/).filter((word) => word.length > 0);
    const results: SpellingResult[] = [];

    // Store the current selection state
    const currentSelection = editorState.getSelection();

    try {
      for (let i = 0; i < words.length; i++) {
        const response = await apiRequest("/api/check-spelling/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            word: words[i],
            language: selectedOption.value,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to check spelling");
        }

        const result = await response.json();
        if (!result.is_correct) {
          results.push({
            index: text.indexOf(words[i]),
            word: words[i],
            length: words[i].length,
          });
        }
      }

      setSpellingResults(results);
      // Pass the current selection to maintain cursor position
      updateEditorWithSpellingResults(results, currentSelection);
    } catch (error) {
      console.error("Error checking spelling:", error);
    }
  };

  const handleWordClick = async (
    word: string,
    start: number,
    end: number,
    event: React.MouseEvent
  ) => {
    // Calculate position based on mouse cursor
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    
    setSelectedWordInfo({ word, start, end });
    setWindowPosition({ 
      x: mouseX, 
      y: mouseY 
    });
    setIsWindowOpen(true);
    setCurrentSuggestions(null);

    try {
      const response = await apiRequest("/api/suggest-corrections/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          word: word,
          language: selectedOption.value,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get suggestions");
      }

      const result: SpellingSuggestion = await response.json();
      setCurrentSuggestions(result);
    } catch (error) {
      console.error("Error getting suggestions:", error);
    }
  };

  const replaceWord = (replacement: string) => {
    if (!selectedWordInfo) return;

    const { start, end } = selectedWordInfo;
    const contentState = editorState.getCurrentContent();
    const blockMap = contentState.getBlockMap();

    let targetBlock = null;
    let blockStart = 0;

    blockMap.forEach((block) => {
      if (!block) return;
      const length = block.getLength();
      if (blockStart <= start && start < blockStart + length) {
        targetBlock = block;
      }
      blockStart += length + 1;
    });

    if (!targetBlock) return;

    const blockKey = targetBlock.getKey();
    const selection = SelectionState.createEmpty(blockKey).merge({
      anchorOffset: start,
      focusOffset: end,
      hasFocus: true,
    });

    const newContentState = Modifier.replaceText(
      contentState,
      selection,
      replacement
    );

    const newEditorState = EditorState.push(
      editorState,
      newContentState,
      "replace-text"
    );

    setEditorState(newEditorState);
    setIsWindowOpen(false);

    // Remove the replaced word from spelling results
    const updatedResults = spellingResults.filter(
      (result) =>
        result.index !== start || result.word !== selectedWordInfo.word
    );
    setSpellingResults(updatedResults);
    updateEditorWithSpellingResults(updatedResults);
  };

  const updateEditorWithSpellingResults = (
    results: SpellingResult[],
    selection?: SelectionState
  ) => {
    const decorator = new CompositeDecorator([
      {
        strategy: (contentBlock, callback) => {
          results.forEach((result) => {
            const text = contentBlock.getText();
            const start = text.indexOf(result.word);
            if (start >= 0) {
              callback(start, start + result.length);
            }
          });
        },
        component: ({
          children,
          decoratedText,
          contentState,
          entityKey,
          blockKey,
          start,
          end,
        }) => (
          <span
            style={{
              textDecoration: "underline",
              textDecorationColor: "red",
              cursor: "pointer",
            }}
            onClick={(e) => handleWordClick(decoratedText, start, end, e)}
          >
            {children}
          </span>
        ),
      },
    ]);

    let newEditorState = EditorState.set(editorState, { decorator });
    
    // Restore the selection if provided
    if (selection) {
      newEditorState = EditorState.forceSelection(newEditorState, selection);
    }
    
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

  return (
    <div
      ref={containerRef}
      style={{
        height: "100vh",
        minHeight: "100vh",
        width: "900px",
        padding: "48px 0",
        position: "relative", // Ensure the container is positioned relative for absolute children
      }}
      onClick={focusEditor}
    >
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 16px" }}>
        <h1
          style={{
            fontSize: "38px",
            fontWeight: "bold",
            textAlign: "center",
            marginBottom: "32px",
          }}
        >
          Spell Checker Tool
        </h1>

        <div
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "24px",
          }}
        >
          <CustomDropdown
            options={options}
            value={selectedOption}
            onChange={handleSelectChange}
          />
          <VisualKeyboard onCharacterClick={handleCharacterInsert} />
          <div
            style={{
              border: "1px solid #008fee",
              borderRadius: "4px",
              marginTop: "16px",
              marginBottom: "16px",
              padding: "8px",
              fontSize: "24px",
              minHeight: "300px",
            }}
          >
            <Editor
              ref={editorRef}
              editorState={editorState}
              onChange={handleTextChange}
              placeholder="Enter or paste your text here to check spelling"
            />
          </div>
          <button
            onClick={handleCheckSpelling}
            style={{
              backgroundColor: "#008fee",
              color: "white",
              padding: "12px 24px",
              fontSize: "18px",
              fontWeight: "bold",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Check Spelling
          </button>
        </div>
      </div>
      <DraggableWindow
        isOpen={isWindowOpen}
        onClose={() => setIsWindowOpen(false)}
        initialPosition={windowPosition}
        parentRef={containerRef}
        content={
          <div>
            {currentSuggestions ? (
              currentSuggestions.suggestions.length > 0 ? (
                <WordCards
                  suggestions={currentSuggestions.suggestions}
                  language={currentSuggestions.language}
                  onWordClick={replaceWord}
                />
              ) : (
                <p className="text-center text-white text-sm">
                  No suggestions available
                </p>
              )
            ) : (
              <p className="text-center text-white text-sm">
                Loading suggestions...
              </p>
            )}
          </div>
        }
      />
    </div>
  );
};

export default HomePage;
