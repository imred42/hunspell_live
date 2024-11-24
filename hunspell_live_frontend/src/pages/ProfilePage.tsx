import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useUserData } from '../hooks/useUserData';
import { FaBook, FaStar, FaUser, FaLanguage, FaHome } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import styles from '../styles/ProfilePage.module.css';

const ProfilePage: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<'info' | 'dictionary' | 'starlist'>('info');
  const [selectedDictLanguage, setSelectedDictLanguage] = useState<string>('');
  const [selectedStarLanguage, setSelectedStarLanguage] = useState<string>('');
  
  const {
    dictionaryWords,
    starListWords,
    dictionaryLanguages,
    starListLanguages,
    isLoading: dataLoading,
    fetchDictionaryWords,
    fetchStarListWords,
    removeFromDictionary,
    removeFromStarList
  } = useUserData();

  useEffect(() => {
    if (dictionaryLanguages.length > 0 && !selectedDictLanguage) {
      setSelectedDictLanguage(dictionaryLanguages[0]);
      fetchDictionaryWords(dictionaryLanguages[0]);
    }
  }, [dictionaryLanguages]);

  useEffect(() => {
    if (starListLanguages.length > 0 && !selectedStarLanguage) {
      setSelectedStarLanguage(starListLanguages[0]);
      fetchStarListWords(starListLanguages[0]);
    }
  }, [starListLanguages]);

  const handleDictionaryLanguageChange = (language: string) => {
    setSelectedDictLanguage(language);
    fetchDictionaryWords(language);
  };

  const handleStarListLanguageChange = (language: string) => {
    setSelectedStarLanguage(language);
    fetchStarListWords(language);
  };

  if (authLoading || dataLoading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={`${styles.container} ${isDarkMode ? styles.darkMode : ''}`}>
      {/* Header Section */}
      <div className={styles.header}>
        <Link to="/" className={styles.homeButton}>
          <FaHome className={styles.buttonIcon} />
          Return to Home
        </Link>
        <h1 className={styles.title}>Profile</h1>
      </div>

      {/* Main Content */}
      <div className={styles.content}>
        {/* Sidebar Navigation */}
        <div className={styles.sidebar}>
          <button 
            className={`${styles.tabButton} ${activeTab === 'info' ? styles.active : ''}`}
            onClick={() => setActiveTab('info')}
          >
            <FaUser /> User Info
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'dictionary' ? styles.active : ''}`}
            onClick={() => setActiveTab('dictionary')}
          >
            <FaBook /> Personal Dictionary
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'starlist' ? styles.active : ''}`}
            onClick={() => setActiveTab('starlist')}
          >
            <FaStar /> Star List
          </button>
        </div>

        {/* Main Panel */}
        <div className={styles.mainPanel}>
          {activeTab === 'info' && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>User Information</h2>
              <div className={styles.userInfo}>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Username:</span>
                  <span className={styles.value}>{user?.username}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Email:</span>
                  <span className={styles.value}>{user?.email}</span>
                </div>
                {/* Add more user info fields as needed */}
              </div>
            </div>
          )}

          {activeTab === 'dictionary' && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Personal Dictionary</h2>
              <div className={styles.languageTabs}>
                {dictionaryLanguages.map(language => (
                  <button 
                    key={language}
                    className={`${styles.languageTab} ${selectedDictLanguage === language ? styles.active : ''}`}
                    onClick={() => handleDictionaryLanguageChange(language)}
                  >
                    <FaLanguage /> {language}
                  </button>
                ))}
              </div>
              <div className={styles.wordList}>
                {dictionaryWords[selectedDictLanguage]?.map(word => (
                  <div key={word} className={styles.wordItem}>
                    <span className={styles.word}>{word}</span>
                    <button 
                      className={styles.deleteButton}
                      onClick={() => removeFromDictionary(word, selectedDictLanguage)}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'starlist' && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Star List</h2>
              <div className={styles.languageTabs}>
                {starListLanguages.map(language => (
                  <button 
                    key={language}
                    className={`${styles.languageTab} ${selectedStarLanguage === language ? styles.active : ''}`}
                    onClick={() => handleStarListLanguageChange(language)}
                  >
                    <FaLanguage /> {language}
                  </button>
                ))}
              </div>
              <div className={styles.wordList}>
                {starListWords[selectedStarLanguage]?.map(word => (
                  <div key={word} className={styles.wordItem}>
                    <span className={styles.word}>{word}</span>
                    <button 
                      className={styles.unstarButton}
                      onClick={() => removeFromStarList(word, selectedStarLanguage)}
                    >
                      Unstar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 