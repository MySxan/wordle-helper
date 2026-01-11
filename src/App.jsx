import React, { useState, useEffect, useRef, useCallback } from 'react';
import dictionary from './assets/words.json';

const colorCycle = [
  { bg: 'bg-gray-200', border: 'border-gray-500', text: 'text-gray-700' },
  { bg: 'bg-green-200', border: 'border-green-600', text: 'text-green-800' },
  { bg: 'bg-yellow-200', border: 'border-yellow-600', text: 'text-yellow-800' },
];

function App() {
  const [rows, setRows] = useState([
    Array(5).fill({ letter: '', cycleIndex: -1 }),
  ]);
  const [selectedRowIndex, setSelectedRowIndex] = useState(0);
  const [selectedCellIndex, setSelectedCellIndex] = useState(0);
  const [shifted, setShifted] = useState(false);

  const handleKeyInput = useCallback(
    (key) => {
      setRows((prev) => {
        const updated = [...prev];
        const row = [...updated[selectedRowIndex]];

        // arrows: move around
        if (key === 'ArrowLeft' && selectedCellIndex > 0) {
          setSelectedCellIndex(selectedCellIndex - 1);
          return prev;
        }
        if (key === 'ArrowRight' && selectedCellIndex < row.length - 1) {
          setSelectedCellIndex(selectedCellIndex + 1);
          return prev;
        }

        // whitespace & Enter: move to next cell
        if (key === ' ' || key === 'Enter') {
          if (
            selectedRowIndex === prev.length - 1 &&
            selectedCellIndex === 4 &&
            prev.length < 5
          ) {
            updated.push(Array(5).fill({ letter: '', cycleIndex: -1 }));
            setSelectedRowIndex(prev.length);
            setSelectedCellIndex(0);
            return updated;
          }
          const nextEmpty = row.findIndex(
            (cell, idx) => idx > selectedCellIndex && cell.letter === ''
          );
          if (nextEmpty !== -1) {
            setSelectedCellIndex(nextEmpty);
          }
          return prev;
        }

        // backspace：delete if current cell is not empty, or back to the previous cell
        if (key === 'Backspace') {
          const isRowEmpty = row.every((cell) => cell.letter === '');

          // Delete the entire row if it is empty and not the first row
          if (isRowEmpty && selectedRowIndex > 0) {
            const newRows = updated.filter(
              (_, idx) => idx !== selectedRowIndex
            );

            // Updete selected row and cell indices
            const newRowIndex = Math.min(selectedRowIndex, newRows.length - 1);
            setSelectedRowIndex(newRowIndex);
            setSelectedCellIndex(row.length - 1);

            return newRows;
          } else if (row[selectedCellIndex].letter !== '') {
            row[selectedCellIndex] = { letter: '', cycleIndex: -1 };
          } else if (selectedCellIndex > 0) {
            row[selectedCellIndex - 1] = { letter: '', cycleIndex: -1 };
            setSelectedCellIndex(selectedCellIndex - 1);
          }
          updated[selectedRowIndex] = row;
          return updated;
        }

        // letters
        if (/^[a-zA-Z]$/.test(key)) {
          if (row[selectedCellIndex].letter === '') {
            row[selectedCellIndex] = {
              letter: key.toUpperCase(),
              cycleIndex: 0,
            };
            if (selectedCellIndex < row.length - 1) {
              setSelectedCellIndex(selectedCellIndex + 1);
            } else if (
              selectedRowIndex === rows.length - 1 &&
              rows.length < 5
            ) {
              updated.push(Array(5).fill({ letter: '', cycleIndex: -1 }));
              setSelectedRowIndex(rows.length);
              setSelectedCellIndex(0);
            }
          }
          updated[selectedRowIndex] = row;
          return updated;
        }
        return updated;
      });
    },
    [rows.length, selectedCellIndex, selectedRowIndex]
  );

  // listen to user input
  useEffect(() => {
    const handleKeyDown = (e) => {
      //prevent default actions for certain keys
      if (
        [' ', 'Enter', 'ArrowLeft', 'ArrowRight', 'Backspace'].includes(e.key)
      ) {
        e.preventDefault();
      }

      handleKeyInput(e.key);
    };

    // shift if has input
    if (rows.flat().every((cell) => cell.letter === '')) {
      setShifted(false);
    } else if (!shifted) {
      setShifted(true);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyInput, selectedRowIndex, selectedCellIndex, shifted, rows]);

  // cycle through colors and focus on the cell if it is not empty
  const handleCellClick = (rowIdx, colIdx) => {
    const cell = rows[rowIdx][colIdx];
    if (cell.letter !== '') {
      setRows((prev) => {
        const updated = [...prev];
        const row = [...updated[rowIdx]];
        row[colIdx] = {
          ...cell,
          cycleIndex: (cell.cycleIndex + 1) % colorCycle.length,
        };
        updated[rowIdx] = row;
        return updated;
      });
    }
    setSelectedRowIndex(rowIdx);
    setSelectedCellIndex(colIdx);
  };

  // filter rules
  function matchesFeedback(word, row) {
    const target = word.toUpperCase().split('');
    const guess = row.map((c) => c.letter.toUpperCase());
    const result = Array(5).fill(-1);
    const used = Array(5).fill(false);

    // Match green
    for (let i = 0; i < 5; i++) {
      if (guess[i] === target[i]) {
        result[i] = 1; // Green
        used[i] = true;
      }
    }

    // Match yellow
    for (let i = 0; i < 5; i++) {
      if (result[i] !== -1 || guess[i] === '') continue;
      for (let j = 0; j < 5; j++) {
        if (!used[j] && guess[i] === target[j]) {
          result[i] = 2; // Yellow
          used[j] = true;
          break;
        }
      }
    }

    // Others are gray
    for (let i = 0; i < 5; i++) {
      if (result[i] === -1 && guess[i] !== '') result[i] = 0;
    }

    // Compare with user's marked colors
    for (let i = 0; i < 5; i++) {
      if (row[i].letter === '') continue;
      if (row[i].cycleIndex !== result[i]) return false;
    }

    return true;
  }

  // filter words base on the rules
  const filteredWords = dictionary.filter((word) => {
    return rows.every((row) => matchesFeedback(word.toUpperCase(), row));
  });

  // join filtered words
  const displayedWords = filteredWords.slice(0, 70);
  const wordRows = [];
  for (let i = 0; i < displayedWords.length; i += 5) {
    wordRows.push(displayedWords.slice(i, i + 5));
  }

  // pull definition
  const [definition, setDefinition] = useState('');
  useEffect(() => {
    if (filteredWords.length === 1) {
      const fetchDefinition = async () => {
        try {
          const res = await fetch(
            `https://api.dictionaryapi.dev/api/v2/entries/en/${filteredWords[0].toLowerCase()}`
          );
          const data = await res.json();
          const firstMeaning = data[0]?.meanings?.[0];
          const partOfSpeech = firstMeaning?.partOfSpeech || '';
          const definitionText =
            firstMeaning?.definitions?.[0]?.definition || '';
          setDefinition(
            `${partOfSpeech ? `(${partOfSpeech}) ` : ''} ${definitionText}`
          );
        } catch {
          setDefinition('No definition found.');
        }
      };
      fetchDefinition();
    } else {
      setDefinition('');
    }
  }, [filteredWords]);

  // dark mode
  const [darkMode, setDarkMode] = useState(false);
  const [showLinks, setShowLinks] = useState(false);
  const linksRef = useRef(null);
  const keyboardRef = useRef(null);
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    if (!showLinks) return;
    const handleOutsideClick = (event) => {
      if (linksRef.current && !linksRef.current.contains(event.target)) {
        setShowLinks(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [showLinks]);

  useEffect(() => {
    const updateLinksOffset = () => {
      const viewport = window.visualViewport;
      const keyboardOffset = viewport
        ? Math.max(0, window.innerHeight - viewport.height)
        : 0;
      const keyboardHeight = keyboardRef.current?.offsetHeight || 0;
      const isStandalone =
        window.matchMedia?.('(display-mode: standalone)').matches ||
        window.navigator.standalone;
      const gap = isStandalone ? '-1.1rem' : '1rem';
      const value = `calc(${keyboardHeight}px + ${keyboardOffset}px + env(safe-area-inset-bottom) + ${gap})`;
      document.documentElement.style.setProperty(
        '--links-bottom-mobile',
        value
      );
    };

    updateLinksOffset();
    window.addEventListener('resize', updateLinksOffset);
    window.visualViewport?.addEventListener('resize', updateLinksOffset);

    return () => {
      window.removeEventListener('resize', updateLinksOffset);
      window.visualViewport?.removeEventListener('resize', updateLinksOffset);
    };
  }, []);

  const topbarButtonClass =
    'p-2 rounded-full text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors';
  const linkButtonClass = `${topbarButtonClass} bg-white/90 dark:bg-gray-800/90`;

  const contentStyle = {
    paddingTop: shifted
      ? 'calc(var(--topbar-height) + var(--topbar-gap))'
      : 'max(calc(50vh - 22rem + (var(--topbar-height) / 2) + var(--topbar-gap)), calc(var(--topbar-height) + var(--topbar-gap)))',
    minHeight: 'calc(100vh - var(--topbar-height))',
  };

  return (
    <div className='min-h-screen bg-white dark:bg-gray-800 transition-colors duration-300'>
      <nav className='fixed top-0 left-0 right-0 z-50 w-full h-16 sm:h-20 px-4 sm:px-6 flex justify-between items-center border-b border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 backdrop-blur'>
        <div className='flex items-center space-x-3'>
          <img
            src={`${import.meta.env.BASE_URL}icon-192.png`}
            alt='Wordle Helper logo'
            className='h-9 w-9 sm:h-10 sm:w-10'
          />
          <span className='text-xl sm:text-3xl font-serif font-semibold text-gray-700 dark:text-gray-200'>
            Wordle Helper
          </span>
        </div>

        <div className='flex items-center space-x-3'>
          {/* Reset button */}
          <button
            onClick={() => window.location.reload()}
            className={topbarButtonClass}
            aria-label='Reset page'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
              strokeWidth='2'
              stroke='currentColor'
              className='size-6'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99'
              />
            </svg>
          </button>
          {/* Dark mode switch */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={topbarButtonClass}
            aria-label='Toggle dark mode'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
              strokeWidth='2'
              stroke='currentColor'
              className='size-6'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z'
              />
            </svg>
          </button>
        </div>
      </nav>
      <div
        ref={linksRef}
        className='fixed right-4 bottom-[var(--links-bottom-mobile)] lg:bottom-4 z-50 flex flex-col items-end space-y-2'
      >
        <div
          className={`flex flex-col items-end space-y-2 transition-all duration-200 ${
            showLinks
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-2 pointer-events-none'
          }`}
        >
          <a
            href='https://github.com/mysxan/wordle-helper'
            target='_blank'
            rel='noopener noreferrer'
            className={`${linkButtonClass} relative group`}
            aria-label='GitHub Repository'
          >
            <span className='pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-2 hidden sm:inline-flex items-center rounded-md border border-gray-200 dark:border-gray-600 bg-white/95 dark:bg-gray-800/95 px-2 py-1 text-sm text-gray-700 dark:text-gray-200 shadow-sm opacity-0 transition-opacity duration-150 group-hover:opacity-100'>
              GitHub
            </span>
            <svg className='w-6 h-6' fill='currentColor' viewBox='0 0 24 24'>
              <path
                fillRule='evenodd'
                clipRule='evenodd'
                d='M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z'
              />
            </svg>
          </a>
          <a
            href='https://mysxan.com/'
            target='_blank'
            rel='noopener noreferrer'
            className={`${linkButtonClass} relative group`}
            aria-label='Main site'
          >
            <span className='pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-2 hidden sm:inline-flex items-center rounded-md border border-gray-200 dark:border-gray-600 bg-white/95 dark:bg-gray-800/95 px-2 py-1 text-sm text-gray-700 dark:text-gray-200 shadow-sm opacity-0 transition-opacity duration-150 group-hover:opacity-100 whitespace-nowrap'>
              Main site
            </span>
            <img
              src='https://mysxan.com/favicon.ico'
              alt='Main site'
              className='w-6 h-6'
            />
          </a>
        </div>
        <button
          type='button'
          onClick={() => setShowLinks((prev) => !prev)}
          className={`${linkButtonClass} relative group`}
          aria-label='Links'
          aria-expanded={showLinks}
        >
          <span className='pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-2 hidden sm:inline-flex items-center rounded-md border border-gray-200 dark:border-gray-600 bg-white/95 dark:bg-gray-800/95 px-2 py-1 text-sm text-gray-700 dark:text-gray-200 shadow-sm opacity-0 transition-opacity duration-150 group-hover:opacity-100'>
            Links
          </span>
          <svg className='w-6 h-6' viewBox='0 0 24 24' fill='none'>
            <path
              d='M10 13a5 5 0 0 1 0-7l2-2a5 5 0 1 1 7 7l-2 2'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
            <path
              d='M14 11a5 5 0 0 1 0 7l-2 2a5 5 0 0 1-7-7l2-2'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </svg>
        </button>
      </div>
      <div
        className='flex flex-col items-center transition-[padding-top] duration-700 ease-out space-y-8 px-4 pb-28 lg:pb-0'
        style={contentStyle}
      >
        <h1 className='text-5xl sm:text-6xl lg:text-7xl font-serif font-bold -mb-4 text-gray-700 dark:text-gray-300'>
          Wordle Helper
        </h1>
        <a
          href='https://www.nytimes.com/games/wordle/index.html'
          target='_blank'
          rel='noopener noreferrer'
          className='text-base sm:text-lg font-serif text-gray-500 dark:text-gray-400 hover:text-blue-500  dark:hover:text-blue-400 -mt-4 mb-4 space-y-8 transition-colors'
        >
          The New York Times Wordle
        </a>

        <div className='space-y-3 sm:space-y-4'>
          {rows.map((row, rowIdx) => (
            <div
              key={rowIdx}
              className='flex space-x-2 sm:space-x-4 font-mono select-none'
            >
              {row.map((cell, colIdx) => {
                let bgClass = 'bg-white dark:bg-gray-600';
                let borderColorClass = 'border-gray-600 dark:border-gray-300';
                let textColorClass = 'text-black';
                if (cell.letter !== '' && cell.cycleIndex !== -1) {
                  bgClass = colorCycle[cell.cycleIndex].bg;
                  borderColorClass = colorCycle[cell.cycleIndex].border;
                  textColorClass = colorCycle[cell.cycleIndex].text;
                }
                const isSelected =
                  rowIdx === selectedRowIndex && colIdx === selectedCellIndex;
                return (
                  <div
                    key={colIdx}
                    onClick={() => handleCellClick(rowIdx, colIdx)}
                    className={`w-12 h-12 sm:w-16 sm:h-16 flex justify-center items-center cursor-pointer transition-all ${
                      isSelected ? 'border-4' : 'border-2'
                    } ${bgClass} ${borderColorClass}`}
                  >
                    <span
                      className={`text-xl sm:text-2xl font-black ${textColorClass}`}
                    >
                      {cell.letter}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <hr className='w-full max-w-md sm:max-w-lg border-gray-400' />

        <div className='w-full flex justify-center px-2 sm:px-4'>
          {rows.flat().every((cell) => cell.letter === '') ? (
            <p className='text-sm sm:text-base text-gray-600 dark:text-gray-400 pt-0.5 font-serif text-center'>
              Type letters in order and use Backspace to delete. <br />
              Click a cell to cycle through filter rules: <br />
              <span className='font-black text-green-600'>Green</span> - Letter
              is correct and in the right spot. <br />
              <span className='font-black text-yellow-600'>Yellow</span> -
              Letter is correct but in the wrong spot. <br />
              <span className='font-black text-gray-600'>Gray</span> - Letter
              should not appear in the word.
            </p>
          ) : filteredWords.length === 1 ? (
            <div className='text-3xl sm:text-4xl text-gray-800 dark:text-gray-300 font-serif font-bold text-center space-y-2 -mt-2'>
              {filteredWords.map((word, idx) => (
                <p key={idx}>{word}</p>
              ))}{' '}
              <div className='max-w-lg px-4 sm:px-12 text-center text-base sm:text-lg text-gray-800 dark:text-gray-400 font-serif font-semibold'>
                {definition ? (
                  <>
                    <span className='block font-bold'>
                      {definition.replace(/\s*([^)]+\))\s*(.*)/, '$1')}
                    </span>
                    <span className='block font-medium'>
                      {definition.replace(/\s*([^)]+\))\s*(.*)/, '$2')}
                    </span>
                  </>
                ) : null}
              </div>
            </div>
          ) : (
            <div className='text-base sm:text-lg text-gray-700 dark:text-gray-300 -mt-2'>
              {wordRows.length > 0 ? (
                wordRows.map((group, idx) => (
                  <p key={idx} className='space-x-2 sm:space-x-4'>
                    {group.map((word, wIdx) => (
                      <span
                        key={wIdx}
                        className='font-mono inline-block w-12 sm:w-16 text-center'
                      >
                        {word}
                      </span>
                    ))}
                  </p>
                ))
              ) : (
                <p className='text-sm sm:text-base text-gray-600 dark:text-gray-400 pt-0.5 font-serif flex justify-center'>
                  No matching word, please check your input.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      <div
        ref={keyboardRef}
        className='fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 dark:bg-gray-800/95 border-t border-gray-200 dark:border-gray-700 backdrop-blur safe-area-bottom'
      >
        <div className='max-w-xl mx-auto px-3 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] space-y-2'>
          <div className='flex justify-center space-x-1'>
            {'QWERTYUIOP'.split('').map((key) => (
              <button
                key={key}
                type='button'
                onClick={() => handleKeyInput(key)}
                className='flex-1 h-10 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 font-semibold'
                aria-label={`Letter ${key}`}
              >
                {key}
              </button>
            ))}
          </div>
          <div className='flex justify-center space-x-1'>
            {'ASDFGHJKL'.split('').map((key) => (
              <button
                key={key}
                type='button'
                onClick={() => handleKeyInput(key)}
                className='flex-1 h-10 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 font-semibold'
                aria-label={`Letter ${key}`}
              >
                {key}
              </button>
            ))}
          </div>
          <div className='flex justify-center space-x-1'>
            <button
              type='button'
              onClick={() => handleKeyInput('Enter')}
              className='flex-[1.3] h-10 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 font-semibold'
              aria-label='Enter'
            >
              Next
            </button>
            {'ZXCVBNM'.split('').map((key) => (
              <button
                key={key}
                type='button'
                onClick={() => handleKeyInput(key)}
                className='flex-1 h-10 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 font-semibold'
                aria-label={`Letter ${key}`}
              >
                {key}
              </button>
            ))}
            <button
              type='button'
              onClick={() => handleKeyInput('Backspace')}
              className='flex-[1.3] h-10 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 font-semibold'
              aria-label='Backspace'
            >
              Del
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
