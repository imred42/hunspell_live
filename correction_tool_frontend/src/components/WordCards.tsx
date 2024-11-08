import React from 'react';

interface WordCardsProps {
  suggestions: string[];
  language: string;
  onWordClick: (word: string) => void;
}

const WordCards: React.FC<WordCardsProps> = ({ suggestions, language, onWordClick }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {suggestions.map((word, index) => (
        <button
          key={index}
          onClick={() => onWordClick(word)}
          style={{
            padding: "4px 8px",
            backgroundColor: "#2d2d2d",
            border: "1px solid #404040",
            borderRadius: "4px",
            color: "white",
            cursor: "pointer",
            fontSize: "0.9rem",
            transition: "background-color 0.2s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = "#404040";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = "#2d2d2d";
          }}
        >
          {word}
        </button>
      ))}
    </div>
  );
};

export default WordCards;