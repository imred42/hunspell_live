import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../utils/config';

function Dashboard() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState([]);
  const navigate = useNavigate();
  const textRef = useRef(null);

  useEffect(() => {
    if (result && !result.is_correct) {
      highlightErrors();
    } else {
      setErrors([]);
    }
  }, [result]);

  useEffect(() => {
    if (textRef.current) {
      textRef.current.innerText = text;
    }
  }, [text]);

  const handleCheck = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/check-grammar/`, { text });
      setResult(response.data);
    } catch (error) {
      console.error('Error checking grammar:', error);
    }
  };

  const highlightErrors = () => {
    if (!result) return;
    
    const originalWords = result.original_text.split(' ');
    const correctedWords = result.corrected_text.split(' ');
    
    const newErrors = originalWords.map((word, index) => {
      if (word !== correctedWords[index]) {
        return { index, word, suggestion: correctedWords[index] };
      }
      return null;
    }).filter(Boolean);

    setErrors(newErrors);
  };

  const handleTextChange = (e: React.FormEvent<HTMLDivElement>) => {
    const newText = e.currentTarget.innerText;
    setText(newText);
    setResult(null);
    setErrors([]);

    // Fix cursor position issue
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="auth-buttons">
        <button 
          onClick={() => navigate('/login')}
        >
          Login
        </button>
      </div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Grammar Checker</h1>
      </div>
      <div className="mb-6 relative">
        <div 
          ref={textRef}
          contentEditable
          className="text-field" // Updated class name
          onInput={handleTextChange}
          suppressContentEditableWarning={true}
        />
        {errors.length > 0 && (
          <div 
            className="absolute right-2 bottom-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center cursor-pointer"
            title={`Found ${errors.length} errors in text`}
          >
            <AlertCircle size={16} />
          </div>
        )}
      </div>
      <button 
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        onClick={handleCheck}
      >
        Check Grammar
      </button>
      {result && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Result:</h2>
          <p>Is Correct: {result.is_correct ? 'Yes' : 'No'}</p>
          {!result.is_correct && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Suggested Corrections:</h3>
              <div 
                className="border border-gray-300 rounded p-3 min-h-[150px]"
                dangerouslySetInnerHTML={{ __html: result.corrected_text }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Dashboard;