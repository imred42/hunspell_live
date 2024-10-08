import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../utils/config';

function Dashboard() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<null | {
    is_correct: boolean;
    original_text: string;
    corrected_text: string;
  }>(null);
  const [showCorrectedField, setShowCorrectedField] = useState(false);
  const navigate = useNavigate();

  const handleCheck = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/check-grammar/`, { text });
      setResult(response.data);
      setShowCorrectedField(true);
    } catch (error) {
      console.error('Error checking grammar:', error);
    }
  };

  const handleCorrectedTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (result) {
      setResult({ ...result, corrected_text: e.target.value });
    }
  };

  return (
    <div className="Dashboard">
      <div className="header">
        <h1>Grammar Checker</h1>
        <button className="login-button" onClick={() => navigate('/login')}>Login</button>
      </div>
      <div className="content">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text to check grammar..."
          rows={5}
          cols={50}
        />
        <br />
        <button onClick={handleCheck}>Check Grammar</button>
        {showCorrectedField && result && (
          <div className="corrected-field">
            <h2>Corrected Text:</h2>
            <textarea
              value={result.corrected_text}
              onChange={handleCorrectedTextChange}
              rows={5}
              cols={50}
            />
          </div>
        )}
        {result && (
          <div className="result">
            <h2>Result:</h2>
            <p>Is Correct: {result.is_correct ? 'Yes' : 'No'}</p>
            <p>Original Text: {result.original_text}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;