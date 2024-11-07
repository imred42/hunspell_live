import React from 'react';

interface VisualKeyboardProps {
  onCharacterClick: (character: string) => void;
}

const VisualKeyboard: React.FC<VisualKeyboardProps> = ({ onCharacterClick }) => {
  const characters = ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü', 'ç', 'ß', 'ø', 'å', 'œ', 'æ', 'ê', 'ô', 'û', 'à', 'è', 'ì', 'ò', 'ù'];

  return (
    <div
      style={{
        display: 'flex',
        // justifyContent: 'center',
        marginBottom: '16px',
        flexWrap: 'wrap',
        maxWidth: '100%',
      }}
    >
      {characters.map((char) => (
        <button
          key={char}
          onClick={() => onCharacterClick(char)}
          style={{
            margin: '0 4px',
            padding: '8px 12px',
            fontSize: '18px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: '8px',
          }}
        >
          {char}
        </button>
      ))}
    </div>
  );
};

export default VisualKeyboard; 