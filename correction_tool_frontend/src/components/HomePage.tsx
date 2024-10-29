import React, { useState, useEffect, useRef } from 'react';
import { Editor, EditorState, CompositeDecorator, ContentState } from 'draft-js';
import 'draft-js/dist/Draft.css';
import CustomDropdown from './CustomDropdown';
import { apiRequest } from '../utils/config';
import Draggable from "react-draggable";

// WordCards Component
interface WordCardsProps {
  suggestions: string[];
  language: string;
  onWordClick: (word: string) => void;
}

const WordCards: React.FC<WordCardsProps> = ({
  suggestions,
  language,
  onWordClick
}) => {
  return (
    <div className="flex flex-wrap gap-2">
      {suggestions.map((word, index) => (
        <div
          key={`${word}-${index}`}
          className="px-3 py-1.5 rounded-lg shadow-sm flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer"
          style={{ backgroundColor: '#2d2d2d' }}
          onClick={() => onWordClick(word)}
        >
          <span className="text-white text-sm font-medium">{word}</span>
        </div>
      ))}
    </div>
  );
};

// DraggableWindow Component
interface DraggableWindowProps {
  isOpen: boolean;
  onClose: () => void;
  initialPosition: { x: number; y: number };
  parentRef: React.RefObject<HTMLDivElement>;
  content: React.ReactNode;
}

const DraggableWindow: React.FC<DraggableWindowProps> = ({
  isOpen,
  onClose,
  initialPosition,
  parentRef,
  content,
}) => {
  const nodeRef = useRef(null);
  const [position, setPosition] = useState(initialPosition);

  useEffect(() => {
    if (parentRef.current) {
      const parentRect = parentRef.current.getBoundingClientRect();
      setPosition({
        x: initialPosition.x - parentRect.left,
        y: initialPosition.y - parentRect.top,
      });
    }
  }, [initialPosition, parentRef]);

  const miniWindowStyle: React.CSSProperties = {
    position: "absolute",
    left: position.x,
    top: position.y,
    backgroundColor: "#1e1e1e",
    border: "1px solid #000000",
    borderRadius: "8px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)",
    width: "300px",
    maxHeight: "300px",
    overflow: "auto",
    cursor: "move",
    zIndex: 1000,
    color: "#fff",
    fontSize: "20px",
    fontFamily: "'Inter', sans-serif",
  };

  const handleStyle: React.CSSProperties = {
    padding: "4px",
    backgroundColor: "rgba(57, 3, 207, 0.683)",
    marginBottom: "2px",
    cursor: "move",
    borderTopLeftRadius: "8px",
    borderTopRightRadius: "8px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

  const closeButtonStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    color: "#fff",
    fontSize: "20px",
    cursor: "pointer",
    padding: "0",
  };

  const contentStyle: React.CSSProperties = {
    padding: "12px",
  };

  if (!isOpen) return null;

  return (
    <Draggable nodeRef={nodeRef} handle=".handle" defaultPosition={position}>
      <div ref={nodeRef} style={miniWindowStyle}>
        <div className="handle" style={handleStyle}>
          <span></span>
          <button onClick={onClose} style={closeButtonStyle}>
            ×
          </button>
        </div>
        <div style={contentStyle}>
          {content}
        </div>
      </div>
    </Draggable>
  );
};

// Main HomePage Component
interface SpellingSuggestion {
  suggestions: string[];
  language: string;
}

const HomePage: React.FC = () => {
  const [selectedOption, setSelectedOption] = useState({ label: 'English', value: 'en' });
  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const [spellingResults, setSpellingResults] = useState<Array<{ index: number; word: string }>>([]);
  const [isWindowOpen, setIsWindowOpen] = useState(false);
  const [windowPosition, setWindowPosition] = useState({ x: 0, y: 0 });
  const [currentSuggestions, setCurrentSuggestions] = useState<SpellingSuggestion | null>(null);
  const [selectedWord, setSelectedWord] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const options = [
    { label: 'English', value: 'en' },
    { label: 'Español', value: 'es' },
    { label: 'Français', value: 'fr' },
    { label: 'Deutsch', value: 'de' },
    { label: 'Italiano', value: 'it' },
    { label: 'Português', value: 'pt' },
  ];

  const handleSelectChange = (option: { label: string; value: string }) => {
    setSelectedOption(option);
  };

  const handleTextChange = (newEditorState: EditorState) => {
    setEditorState(newEditorState);
    setSpellingResults([]);
  };

  const handleCheckSpelling = async () => {
    const text = editorState.getCurrentContent().getPlainText();
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const results = [];

    try {
      for (let i = 0; i < words.length; i++) {
        const response = await apiRequest('/api/check-spelling/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            word: words[i],
            language: selectedOption.value 
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to check spelling');
        }

        const result = await response.json();
        if (!result.is_correct) {
          results.push({
            index: text.indexOf(words[i]),
            word: words[i],
          });
        }
      }

      setSpellingResults(results);
      updateEditorWithSpellingResults(results);
    } catch (error) {
      console.error('Error checking spelling:', error);
    }
  };

  const handleWordClick = async (word: string, event: React.MouseEvent) => {
    setSelectedWord(word);
    setWindowPosition({ x: event.clientX, y: event.clientY });
    setIsWindowOpen(true);
    setCurrentSuggestions(null); // Reset suggestions while loading

    try {
      const response = await apiRequest('/api/suggest-corrections/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          word: word,
          language: selectedOption.value 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get suggestions');
      }

      const result: SpellingSuggestion = await response.json();
      setCurrentSuggestions(result);
    } catch (error) {
      console.error('Error getting suggestions:', error);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    // Here you can implement the logic to replace the word in the editor
    console.log('Selected suggestion:', suggestion);
    setIsWindowOpen(false);
  };

  const updateEditorWithSpellingResults = (results: Array<{ index: number; word: string }>) => {
    const decorator = new CompositeDecorator([
      {
        strategy: (contentBlock, callback) => {
          results.forEach(result => {
            const start = result.index;
            const end = start + result.word.length;
            callback(start, end);
          });
        },
        component: ({ children, decoratedText }) => (
          <span 
            style={{ textDecoration: 'underline', textDecorationColor: 'red', cursor: 'pointer' }}
            onClick={(e) => handleWordClick(decoratedText, e)}
          >
            {children}
          </span>
        ),
      },
    ]);

    const newEditorState = EditorState.set(editorState, { decorator });
    setEditorState(newEditorState);
  };

  return (
    <div ref={containerRef} style={{ minHeight: '100vh', width: '900px', padding: '48px 0' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 16px' }}>
        <h1 style={{ fontSize: '38px', fontWeight: 'bold', textAlign: 'center', marginBottom: '32px' }}>
          Spell Checker Tool
        </h1>
        <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '24px'}}>
          <CustomDropdown
            options={options}
            value={selectedOption}
            onChange={handleSelectChange}
          />
          <div
            style={{ 
              border: '1px solid #008fee',
              borderRadius: '4px',
              marginTop: '16px',
              marginBottom: '16px',
              padding: '8px',
              fontSize: '24px',
              minHeight: '300px',
            }}
          >
            <Editor
              editorState={editorState}
              onChange={handleTextChange}
              placeholder="Enter or paste your text here to check spelling"
            />
          </div>
          <button
            onClick={handleCheckSpelling}
            style={{
              backgroundColor: '#008fee',
              color: 'white',
              padding: '12px 24px',
              fontSize: '18px',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
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
              <WordCards
                suggestions={currentSuggestions.suggestions}
                language={currentSuggestions.language}
                onWordClick={handleSuggestionClick}
              />
            ) : (
              <p className="text-center text-white text-sm">Loading suggestions...</p>
            )}
          </div>
        }
      />
    </div>
  );
};

export default HomePage;