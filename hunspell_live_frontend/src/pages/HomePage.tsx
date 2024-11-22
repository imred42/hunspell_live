import React, { useState, useRef, useEffect } from "react";
import Dropdown from "../components/Dropdown";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaTrashAlt,
  FaPaste,
  FaCopy,
  FaCut,
  FaCheck,
  FaQuestion,
  FaUser,
  FaGithub,
  FaMoon,
  FaSun,
  FaBan,
  FaBook,
  FaAt
} from "react-icons/fa";
import { useApi } from "../hooks/useApi";
import { styles as inlineStyles } from "../styles/HomePage.styles";
import { LanguageOption, SpellingResult } from "../types/spelling";
import styles from "../styles/HomePage.module.css";
import { useAuth } from "../hooks/useAuth";
import { LANGUAGE_OPTIONS, TEXT_DIRECTION_MAP } from "../constants/language";

const HomePage: React.FC = () => {
  const [selectedOption, setSelectedOption] = useState<LanguageOption>(() => {
    const savedLanguage = localStorage.getItem("selectedLanguage");
    return savedLanguage
      ? JSON.parse(savedLanguage)
      : { label: "English", value: "en" };
  });
  const [text, setText] = useState("");
  const [spellingResults, setSpellingResults] = useState<SpellingResult[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const { logout, isLoading, isAuthenticated, user } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme === "dark";
  });

  const { checkSpelling, getSuggestions, addWordToDictionary } = useApi(
    selectedOption.value
  );

  const options: LanguageOption[] = LANGUAGE_OPTIONS;

  // Add theme toggle handler
  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newTheme = !prev;
      localStorage.setItem("theme", newTheme ? "dark" : "light");
      return newTheme;
    });
  };

  // Add this near the top of your return statement, after the login button
  const themeToggle = (
    <div className={styles.buttonWrapper}>
      <button 
        onClick={toggleTheme} 
        className={`${styles.themeButton} ${isDarkMode ? styles.darkMode : ''}`}
      >
        {isDarkMode ? <FaSun /> : <FaMoon />}
      </button>
      <span className={styles.tooltip}>
        {isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      </span>
    </div>
  );

  const handleSelectChange = (
    option: LanguageOption,
    event?: React.MouseEvent
  ) => {
    event?.stopPropagation();
    localStorage.setItem("selectedLanguage", JSON.stringify(option));
    setSelectedOption(option);
    setText("");
    setSpellingResults([]);
    if (editorRef.current) {
      editorRef.current.innerHTML = "";
      // Update the text direction based on the selected language
      editorRef.current.style.direction =
        TEXT_DIRECTION_MAP[option.value] || "ltr";
      editorRef.current.style.textAlign =
        TEXT_DIRECTION_MAP[option.value] === "rtl" ? "right" : "left";
    }
  };

  const handleClearText = () => {
    if (editorRef.current) {
      editorRef.current.innerHTML = "";
      setText("");
      setSpellingResults([]);
      toast.success("Text cleared successfully");
    }
  };

  const handlePaste = async () => {
    try {
      const pastedText = await navigator.clipboard.readText();
      if (editorRef.current) {
        editorRef.current.innerHTML = pastedText;
        setText(pastedText);
        setSpellingResults([]);

        // Move cursor to end of text
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(editorRef.current);
        range.collapse(false); // false means collapse to end
        selection?.removeAllRanges();
        selection?.addRange(range);

        // Add success toast
        toast.success("Text pasted successfully");
      }
    } catch (error) {
      toast.error("Unable to access clipboard");
    }
  };

  const handleTextChange = (event: React.FormEvent<HTMLDivElement>) => {
    const newText = event.currentTarget.innerText;
    setText(newText);
    setSpellingResults([]);
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const parentSpan = range.startContainer.parentElement;
      if (
        parentSpan?.classList.contains("misspelled") ||
        range.startContainer.previousSibling?.nodeName === "SPAN" ||
        range.startContainer.nextSibling?.nodeName === "SPAN" ||
        newText.length === 0
      ) {
        const textNode = document.createTextNode(newText);
        if (editorRef.current) {
          editorRef.current.innerHTML = "";
          editorRef.current.appendChild(textNode);
          range.setStart(textNode, textNode.length);
          range.setEnd(textNode, textNode.length);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    }
  };

  const handleCheckSpelling = async () => {
    if (!text.trim()) {
      toast.warning("Please enter some text to check spelling");
      return;
    }

    // Show loading toast
    const loadingToast = toast.loading("Checking spelling...");

    try {
      const newResults = await checkSpelling(text);
      // Dismiss loading toast
      toast.dismiss(loadingToast);

      if (newResults.length > 0) {
        highlightMisspelledWords(newResults);
        toast.error(
          `Found ${newResults.length} spelling error${
            newResults.length === 1 ? "" : "s"
          }`
        );
      } else {
        toast.success("No spelling errors found!");
      }
    } catch (error) {
      // Dismiss loading toast and show error if something goes wrong
      toast.dismiss(loadingToast);
      toast.error("Error checking spelling");
    }
  };

  const highlightMisspelledWords = (results: SpellingResult[]) => {
    if (!editorRef.current) return;
    const textContent = editorRef.current.innerText;
    let html = "";
    let lastIndex = 0;
    results.forEach((result) => {
      const wordStart = result.index;
      const wordEnd = result.index + result.word.length;
      html += textContent.slice(lastIndex, wordStart);
      const misspelledWord = textContent.slice(wordStart, wordEnd);
      html += `<span class="misspelled" data-word="${misspelledWord}" data-start="${wordStart}" style="text-decoration: solid underline red 4px; text-underline-offset: 0.25em; cursor: help; font-style: italic;">${misspelledWord}</span>`;
      lastIndex = wordEnd;
    });
    html += textContent.slice(lastIndex);
    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);
    editorRef.current.innerHTML = html;
    setSpellingResults(results);
    const misspelledElements =
      editorRef.current.getElementsByClassName("misspelled");
    Array.from(misspelledElements).forEach((element) => {
      element.addEventListener("click", handleMisspelledWordClick);
    });
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
    const startPosition = parseInt(element.dataset.start || "0", 10);
    if (!word) return;

    // Preserve the original word case when getting suggestions
    const suggestions = await getSuggestions(word);

    // If no suggestions are returned for the exact case, try lowercase
    if (suggestions.suggestions.length === 0) {
      const lowercaseSuggestions = await getSuggestions(word.toLowerCase());
      // Filter suggestions to only include ones that differ from the original word
      suggestions.suggestions = lowercaseSuggestions.suggestions.filter(
        (suggestion) => suggestion.toLowerCase() !== word.toLowerCase()
      );
    }

    const rect = element.getBoundingClientRect();

    // Main popup container - allows tooltips to overflow
    const popup = document.createElement("div");
    popup.style.position = "fixed";
    popup.style.left = `${rect.left}px`;
    popup.style.top = `${rect.bottom + 8}px`;
    popup.style.backgroundColor = "#ffffff";
    popup.style.border = "2px solid #e2e8f0";
    popup.style.borderRadius = "12px";
    popup.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
    popup.style.zIndex = "1000";
    // Calculate minimum width based on word length
    const wordWidth = rect.width;
    const minWidth = Math.max(wordWidth + 160, 200); // Reduced from 300 to 200
    popup.style.minWidth = `${minWidth}px`;
    popup.style.overflow = "visible";

    // Inner scrollable container for suggestions
    const scrollContainer = document.createElement("div");
    scrollContainer.style.maxHeight = "300px";
    scrollContainer.style.overflowY = "auto";
    scrollContainer.style.padding = "12px 0 12px 0"; // Adjusted padding
    popup.appendChild(scrollContainer);

    if (suggestions.suggestions.length === 0) {
      const noSuggestionsElement = document.createElement("div");
      noSuggestionsElement.textContent = "No suggestions available";
      noSuggestionsElement.style.padding = "8px 16px";
      noSuggestionsElement.style.fontSize = "18px";
      noSuggestionsElement.style.fontWeight = "bold";
      noSuggestionsElement.style.color = "#6b7280";
      noSuggestionsElement.style.fontStyle = "italic";
      scrollContainer.appendChild(noSuggestionsElement);
    } else {
      // Create ignore button container
      const ignoreContainer = document.createElement("div");
      ignoreContainer.style.padding = "12px 16px";
      ignoreContainer.style.borderBottom = "1px solid #e5e7eb";
      ignoreContainer.style.display = "flex";
      ignoreContainer.style.alignItems = "center";
      ignoreContainer.style.justifyContent = "center";
      ignoreContainer.style.gap = "12px"; // Add gap between buttons

      // Create ignore button with icon
      const ignoreButton = document.createElement("button");
      ignoreButton.innerHTML = `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M256 8C119.034 8 8 119.033 8 256s111.034 248 248 248 248-111.034 248-248S392.967 8 256 8zm130.108 117.892c65.448 65.448 70 165.481 20.677 235.637L150.47 105.216c70.204-49.356 170.226-44.735 235.638 20.676zM125.892 386.108c-65.448-65.448-70-165.481-20.677-235.637L361.53 406.784c-70.203 49.356-170.226 44.736-235.638-20.676z"></path></svg>`;
      const buttonStyles = {
        border: "none",
        background: "none",
        cursor: "pointer",
        fontSize: "20px",
        color: "#6b7280",
        padding: "8px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "50%",
        transition: "color 0.2s, background-color 0.2s",
        borderRadius: "4px",
      };

      Object.assign(ignoreButton.style, buttonStyles);

      // Create dictionary button with icon
      const dictionaryButton = document.createElement("button");
      dictionaryButton.innerHTML = `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M448 360V24c0-13.3-10.7-24-24-24H96C43 0 0 43 0 96v320c0 53 43 96 96 96h328c13.3 0 24-10.7 24-24v-16c0-7.5-3.5-14.3-8.9-18.7-4.2-15.4-4.2-59.3 0-74.7 5.4-4.3 8.9-11.1 8.9-18.6zM128 134c0-3.3 2.7-6 6-6h212c3.3 0 6 2.7 6 6v20c0 3.3-2.7 6-6 6H134c-3.3 0-6-2.7-6-6v-20zm0 64c0-3.3 2.7-6 6-6h212c3.3 0 6 2.7 6 6v20c0 3.3-2.7 6-6 6H134c-3.3 0-6-2.7-6-6v-20zm253.4 250H96c-17.7 0-32-14.3-32-32 0-17.6 14.4-32 32-32h285.4c-1.9 17.1-1.9 46.9 0 64z"/></svg>`;
      Object.assign(dictionaryButton.style, buttonStyles);

      // Add hover effects
      const addButtonHoverEffect = (button: HTMLButtonElement) => {
        button.addEventListener("mouseover", () => {
          button.style.backgroundColor = "#f3f4f6";
          button.style.color = "#4b5563";
        });

        button.addEventListener("mouseout", () => {
          button.style.backgroundColor = "transparent";
          button.style.color = "#6b7280";
        });
      };

      addButtonHoverEffect(ignoreButton);
      addButtonHoverEffect(dictionaryButton);

      // Add tooltips
      const createTooltip = (text: string) => {
        const tooltip = document.createElement("span");
        tooltip.textContent = text;
        tooltip.style.visibility = "hidden";
        tooltip.style.backgroundColor = "#333";
        tooltip.style.color = "#fff";
        tooltip.style.textAlign = "center";
        tooltip.style.padding = "5px 10px";
        tooltip.style.borderRadius = "6px";
        tooltip.style.position = "absolute";
        tooltip.style.zIndex = "1002";
        tooltip.style.top = "calc(100% + 18px)";
        tooltip.style.left = "50%";
        tooltip.style.transform = "translateX(-50%)";
        tooltip.style.fontSize = "14px";
        tooltip.style.whiteSpace = "nowrap";
        tooltip.style.pointerEvents = "none";
        return tooltip;
      };

      const ignoreTooltip = createTooltip("Ignore this word");
      const dictionaryTooltip = createTooltip("Add to dictionary");

      ignoreButton.style.position = "relative";
      dictionaryButton.style.position = "relative";

      ignoreButton.appendChild(ignoreTooltip);
      dictionaryButton.appendChild(dictionaryTooltip);

      // Add tooltip visibility handlers
      const addTooltipHandlers = (button: HTMLButtonElement, tooltip: HTMLSpanElement) => {
        button.addEventListener("mouseover", () => {
          tooltip.style.visibility = "visible";
        });

        button.addEventListener("mouseout", () => {
          tooltip.style.visibility = "hidden";
        });
      };

      addTooltipHandlers(ignoreButton, ignoreTooltip);
      addTooltipHandlers(dictionaryButton, dictionaryTooltip);

      // Add click handlers
      ignoreButton.addEventListener("click", () => {
        if (element && editorRef.current) {
          element.outerHTML = word;
          setSpellingResults((prev) =>
            prev.filter(
              (result) =>
                !(
                  result.word.toLowerCase() === word.toLowerCase() &&
                  result.index === startPosition
                )
            )
          );
        }
        document.body.removeChild(popup);
      });

      dictionaryButton.addEventListener("click", async () => {
        try {
          const loadingToast = toast.loading("Adding word to dictionary...");
          const success = await addWordToDictionary(word);
          toast.dismiss(loadingToast);
          
          if (success) {
            if (element && editorRef.current) {
              element.outerHTML = word;
              setSpellingResults((prev) =>
                prev.filter(
                  (result) =>
                    !(
                      result.word.toLowerCase() === word.toLowerCase() &&
                      result.index === startPosition
                    )
                )
              );
            }
            toast.success("Word added to dictionary successfully");
            document.body.removeChild(popup);
          } else {
            throw new Error("Failed to add word");
          }
        } catch (error) {
          toast.error("Failed to add word to dictionary");
          console.error("Error adding word:", error);
        }
      });

      ignoreContainer.appendChild(ignoreButton);
      ignoreContainer.appendChild(dictionaryButton);
      scrollContainer.appendChild(ignoreContainer);

      // Style the popup more like a card
      popup.style.backgroundColor = "#ffffff";
      popup.style.border = "1px solid #e5e7eb";
      popup.style.borderRadius = "8px";
      popup.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
      
      // Add some spacing between sections
      scrollContainer.style.paddingTop = "0";
      scrollContainer.style.paddingBottom = "8px";

      suggestions.suggestions.forEach((suggestion) => {
        const suggestionContainer = document.createElement("div");
        suggestionContainer.style.display = "flex";
        suggestionContainer.style.justifyContent = "flex-start";
        suggestionContainer.style.alignItems = "center";
        suggestionContainer.style.padding = "8px 16px";
        suggestionContainer.style.margin = "0";
        suggestionContainer.style.cursor = "pointer";
        suggestionContainer.style.minWidth = "100px";
        suggestionContainer.style.gap = "12px";

        const addButton = document.createElement("button");
        addButton.textContent = "☆";
        addButton.style.marginRight = "0";
        addButton.style.padding = "2px 8px";
        addButton.style.borderRadius = "4px";
        addButton.style.backgroundColor = "#e5e7eb";
        addButton.style.border = "none";
        addButton.style.cursor = "pointer";
        addButton.style.fontSize = "18px";
        addButton.style.fontWeight = "normal";
        addButton.style.position = "relative";
        addButton.style.width = "28px";
        addButton.style.minWidth = "28px";
        addButton.style.color = "#666";
        addButton.style.display = "flex";
        addButton.style.alignItems = "center";
        addButton.style.justifyContent = "center";

        const tooltip = document.createElement("span");
        tooltip.textContent = "Add to your star list";
        tooltip.style.visibility = "hidden";
        tooltip.style.backgroundColor = "#333";
        tooltip.style.color = "#fff";
        tooltip.style.textAlign = "center";
        tooltip.style.padding = "5px 10px";
        tooltip.style.borderRadius = "6px";
        tooltip.style.position = "absolute";
        tooltip.style.zIndex = "1002";
        tooltip.style.left = "0";
        tooltip.style.top = "calc(100% + 8px)";
        tooltip.style.transform = "none";
        tooltip.style.fontSize = "14px";
        tooltip.style.whiteSpace = "nowrap";
        tooltip.style.fontWeight = "normal";
        tooltip.style.pointerEvents = "none";

        addButton.addEventListener("mouseover", () => {
          tooltip.style.visibility = "visible";
          addButton.style.backgroundColor = "#d1d5db";
          addButton.style.color = "#333";
        });

        addButton.addEventListener("mouseout", () => {
          tooltip.style.visibility = "hidden";
          addButton.style.backgroundColor = "#e5e7eb";
          addButton.style.color = "#666";
        });

        addButton.appendChild(tooltip);

        const suggestionElement = document.createElement("div");
        suggestionElement.textContent = suggestion;
        suggestionElement.style.fontSize = "20px";
        suggestionElement.style.fontWeight = "bold";
        suggestionElement.style.color = "#374151";

        suggestionContainer.appendChild(addButton);
        suggestionContainer.appendChild(suggestionElement);

        suggestionContainer.addEventListener("mouseover", () => {
          suggestionContainer.style.backgroundColor = "#f3f4f6";
          suggestionElement.style.color = "#000000";
        });
        suggestionContainer.addEventListener("mouseout", () => {
          suggestionContainer.style.backgroundColor = "transparent";
          suggestionElement.style.color = "#374151";
        });

        // Click handlers
        suggestionContainer.addEventListener("click", () => {
          handleSuggestionClick(suggestion, word, startPosition);
          document.body.removeChild(popup);
        });

        addButton.addEventListener("click", async (e) => {
          e.stopPropagation();

          try {
            // Show loading toast
            const loadingToast = toast.loading("Adding word to dictionary...");

            const success = await addWordToDictionary(suggestion);

            // Dismiss loading toast
            toast.dismiss(loadingToast);

            if (!success) {
              throw new Error("Failed to add word");
            }

            // Show success message
            toast.success("Word added to dictionary successfully");

            // Close the suggestions popup
            document.body.removeChild(popup);
          } catch (error) {
            toast.error("Failed to add word to dictionary");
            console.error("Error adding word:", error);
          }
        });

        scrollContainer.appendChild(suggestionContainer); // Append to scrollContainer instead of popup
      });
    }

    document.body.appendChild(popup);

    const handleClickOutside = (e: MouseEvent) => {
      if (!popup.contains(e.target as Node) && document.body.contains(popup)) {
        document.body.removeChild(popup);
        document.removeEventListener("click", handleClickOutside);
      }
    };
    setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 0);
  };

  const handleSuggestionClick = (
    suggestion: string,
    originalWord: string,
    startPosition: number
  ) => {
    if (!editorRef.current) return;
    const spans = editorRef.current.querySelectorAll(
      `span.misspelled[data-word="${originalWord}"]`
    );
    let targetSpan: Element | null = null;
    for (const span of spans) {
      const spanPosition = parseInt(span.getAttribute("data-start") || "0", 10);
      if (spanPosition === startPosition) {
        targetSpan = span;
        break;
      }
    }
    if (targetSpan) {
      // Create a text node with the suggestion
      const textNode = document.createTextNode(suggestion);
      // Replace the span with the text node
      targetSpan.parentNode?.replaceChild(textNode, targetSpan);

      // Update the text state with the current content
      setText(editorRef.current.innerText);

      // Update spelling results to remove the replaced word
      setSpellingResults((prev) =>
        prev.filter(
          (result) =>
            !(
              result.word.toLowerCase() === originalWord.toLowerCase() &&
              result.index === startPosition
            )
        )
      );

      // Reattach click handlers to remaining misspelled words
      const misspelledElements =
        editorRef.current.getElementsByClassName("misspelled");
      Array.from(misspelledElements).forEach((element) => {
        element.addEventListener("click", handleMisspelledWordClick);
      });
    }
  };

  const handleCharacterInsert = (character: string) => {
    if (!editorRef.current) return;
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    const textNode = document.createTextNode(character);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    selection.removeAllRanges();
    selection.addRange(range);
    setText(editorRef.current.innerText);
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const focusEditor = (event: React.MouseEvent) => {
    if (
      event.target instanceof Node &&
      (event.target.closest(".custom-dropdown") ||
        event.target.closest(".loginCard") ||
        event.target.closest(".ant-select-dropdown"))
    ) {
      return;
    }
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const handleCopy = async () => {
    if (editorRef.current) {
      try {
        await navigator.clipboard.writeText(editorRef.current.innerText);
        toast.success("Text copied to clipboard");
      } catch (error) {
        toast.error("Failed to copy text");
      }
    }
  };

  const handleCut = async () => {
    if (editorRef.current) {
      try {
        await navigator.clipboard.writeText(editorRef.current.innerText);
        editorRef.current.innerHTML = "";
        setText("");
        setSpellingResults([]);
        toast.success("Text cut to clipboard");
      } catch (error) {
        toast.error("Failed to cut text");
      }
    }
  };

  const handleLoginClick = () => {
    window.location.href = "/login";
  };

  const userControls = (
    <div className={styles.userControls}>
      <div className={styles.buttonWrapper}>
        <FaUser className={styles.profileIcon} />
        {isLoading ? (
          <div className={styles.profileCard}>Loading...</div>
        ) : (
          user && (
            <div className={styles.profileCard}>
              <div className={styles.profileInfo}>
                <p>
                  <span>Username:</span>
                  <span>{user.username}</span>
                </p>
                <p>
                  <span>Email:</span>
                  <span>{user.email}</span>
                </p>
              </div>
            </div>
          )
        )}
      </div>
      <button className={styles.logoutButton} onClick={logout}>
        Logout
      </button>
    </div>
  );

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  return (
    <div
      ref={containerRef}
      style={inlineStyles.container}
      onClick={focusEditor}
      className={isDarkMode ? styles.darkMode : ''}
    >
      <div className={styles.topControls}>
        {isAuthenticated ? (
          <>
            {userControls}
            {themeToggle}
          </>
        ) : (
          <>
            {themeToggle}
            <button className={styles.loginButton} onClick={handleLoginClick}>
              <FaUser /> Login
            </button>
          </>
        )}
      </div>
      <div style={inlineStyles.content}>
        <div className={styles.titleContainer}>
          <h1 className={styles.title} style={inlineStyles.title}>
            Hunspell Live
          </h1>
        </div>
        <div
          style={{
            backgroundColor: isDarkMode ? '#25272b' : 'white',
            borderRadius: "8px",
            padding: "24px",
          }}
        >
          <div style={inlineStyles.controlsContainer}>
            <div style={inlineStyles.buttonGroup}>
              <div className={styles.buttonWrapper}>
                <button
                  onClick={handleCheckSpelling}
                  className={styles.checkButton}
                >
                  <FaCheck />
                </button>
                <span className={styles.tooltip}>Check Spelling</span>
              </div>
              <div className={styles.buttonWrapper}>
                <button
                  onClick={handleClearText}
                  className={styles.clearButton}
                >
                  <FaTrashAlt />
                </button>
                <span className={styles.tooltip}>Clear</span>
              </div>
              <div className={styles.buttonWrapper}>
                <button onClick={handlePaste} className={styles.pasteButton}>
                  <FaPaste />
                </button>
                <span className={styles.tooltip}>Paste</span>
              </div>
              <div className={styles.buttonWrapper}>
                <button onClick={handleCopy} className={styles.copyButton}>
                  <FaCopy />
                </button>
                <span className={styles.tooltip}>Copy</span>
              </div>
              <div className={styles.buttonWrapper}>
                <button onClick={handleCut} className={styles.cutButton}>
                  <FaCut />
                </button>
                <span className={styles.tooltip}>Cut</span>
              </div>
              <div className={styles.buttonWrapper}>
                <button className={styles.helpButton}>
                  <FaQuestion />
                </button>
                <div className={styles.helpCard}>
                  <h3>Instructions</h3>
                  <ul>
                    <li>Select your language from the dropdown menu</li>
                    <li>Type or paste your text in the editor</li>
                    <li>Click the check (✓) button to check spelling</li>
                    <li>Click on underlined words to see suggestions</li>
                    <li>Click suggested word to replace</li>
                  </ul>
                </div>
              </div>
            </div>
            <div style={inlineStyles.dropdownContainer}>
              <Dropdown
                options={options}
                value={selectedOption}
                onChange={handleSelectChange}
              />
            </div>
          </div>

          <div
            ref={editorRef}
            contentEditable
            onInput={handleTextChange}
            style={{
              ...inlineStyles.editor,
              direction: TEXT_DIRECTION_MAP[selectedOption.value] || "ltr",
              textAlign:
                TEXT_DIRECTION_MAP[selectedOption.value] === "rtl"
                  ? "right"
                  : "left",
            }}
            data-placeholder="Enter or paste your text here to check spelling"
          />
        </div>
      </div>
      <footer className={styles.footer}>
        <div className={styles.footerLeft}>
          <a
            href="https://github.com/imred42/hunspell_live"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.githubLink}
          >
            <FaGithub />
          </a>
          {/* <span className={styles.versionTag}>v1.0.0</span> */}
          {/* <span className={styles.footerLink}>
            Built by <a href="https://chenfeixiong.com">Chenfei Xiong</a>
          </span> */}
          <a
            href="https://chenfeixiong.com"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.githubLink}
          >
            <FaAt />
          </a>
        </div>

        <div className={styles.footerRight}>
          <span className={styles.copyright}>
            © {new Date().getFullYear()} Chenfei Xiong
          </span>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
