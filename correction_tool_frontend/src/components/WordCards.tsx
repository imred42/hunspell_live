import React from 'react';

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

export default WordCards;