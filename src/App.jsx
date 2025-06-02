import React, { useState, useEffect } from 'react';
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

  // listen to user input
  useEffect(() => {
    const handleKeyDown = (e) => {
      //prevent default actions for certain keys
      if (
        [' ', 'Enter', 'ArrowLeft', 'ArrowRight', 'Backspace'].includes(e.key)
      ) {
        e.preventDefault();
      }

      setRows((prev) => {
        const updated = [...prev];
        const row = [...updated[selectedRowIndex]];

        // arrows: move around
        if (e.key === 'ArrowLeft' && selectedCellIndex > 0) {
          setSelectedCellIndex(selectedCellIndex - 1);
          return prev;
        }
        if (e.key === 'ArrowRight' && selectedCellIndex < row.length - 1) {
          setSelectedCellIndex(selectedCellIndex + 1);
          return prev;
        }

        // whitespace & Enter: move to next cell
        if (e.key === ' ' || e.key === 'Enter') {
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
        if (e.key === 'Backspace') {
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
        if (/^[a-zA-Z]$/.test(e.key)) {
          if (row[selectedCellIndex].letter === '') {
            row[selectedCellIndex] = {
              letter: e.key.toUpperCase(),
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
    };

    // shift if more than one row
    if (rows.length > 1 && !shifted) {
      setShifted(true);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRowIndex, selectedCellIndex, rows.length, shifted]);

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
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className='min-h-screen bg-white dark:bg-gray-800 transition-colors duration-300'>
      <nav className='w-full py-4 px-6 flex justify-between items-center border-b border-gray-200 dark:border-gray-700'>
        {/* Github link */}
        <div className='flex items-center space-x-4'>
          <a
            href='https://github.com/mysxan/wordle-helper'
            target='_blank'
            rel='noopener noreferrer'
            className='text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors'
            aria-label='GitHub Repository'
          >
            <svg className='w-6 h-6' fill='currentColor' viewBox='0 0 24 24'>
              <path
                fillRule='evenodd'
                clipRule='evenodd'
                d='M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z'
              />
            </svg>
          </a>
        </div>

        <div className='flex items-center space-x-2'>
          {/* Reset button */}
          <button
            onClick={() => window.location.reload()}
            className='p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors'
            aria-label='Reset page'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
              stroke-width='2'
              stroke='currentColor'
              class='size-6'
            >
              <path
                stroke-linecap='round'
                stroke-linejoin='round'
                d='M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99'
              />
            </svg>
          </button>
          {/* Dark mode switch */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className='p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors'
            aria-label='Toggle dark mode'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
              stroke-width='2'
              stroke='currentColor'
              class='size-6'
            >
              <path
                stroke-linecap='round'
                stroke-linejoin='round'
                d='M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z'
              />
            </svg>
          </button>
        </div>
      </nav>
      <div
        className='justify-start flex flex-col items-center transition-all duration-1000 space-y-8'
        style={{ marginTop: shifted ? '5rem' : 'calc(50vh - 15rem)' }}
      >
        <h1 className='text-6xl font-serif font-medium -mb-4 text-gray-700 dark:text-gray-300'>
          Wordle Helper
        </h1>
        <a
          href='https://www.nytimes.com/games/wordle/index.html'
          target='_blank'
          rel='noopener noreferrer'
          className='text-l font-serif text-gray-500 dark:text-gray-400 hover:text-blue-500  dark:hover:text-blue-400 -mt-4 mb-4 space-y-8 transition-colors'
        >
          The New York Times Wordle
        </a>

        <div className='space-y-4'>
          {rows.map((row, rowIdx) => (
            <div key={rowIdx} className='flex space-x-4 font-mono select-none'>
              {row.map((cell, colIdx) => {
                let bgClass = 'bg-white';
                let borderColorClass = 'border-gray-600';
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
                    className={`w-16 h-16 flex justify-center items-center cursor-pointer transition-all ${
                      isSelected ? 'border-4' : 'border-2'
                    } ${bgClass} ${borderColorClass}`}
                  >
                    <span className={`text-2xl font-bold ${textColorClass}`}>
                      {cell.letter}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <hr className='min-w-96 border-gray-400' />

        <div className='min-w-96 w-full flex justify-center'>
          {rows.flat().every((cell) => cell.letter === '') ? (
            <p className='text-gray-600 dark:text-gray-400 pt-0.5 font-serif text-center'>
              Type letters in order and use Backspace to delete. <br />
              Click a cell to cycle through filter rules: <br />
              <span className='font-bold text-green-600'>Green</span> - Letter
              is correct and in the right spot. <br />
              <span className='font-bold text-yellow-600'>Yellow</span> - Letter
              is correct but in the wrong spot. <br />
              <span className='font-bold text-gray-600'>Gray</span> - Letter
              should not appear in the word.
            </p>
          ) : filteredWords.length === 1 ? (
            <div className='text-4xl text-gray-800 dark:text-gray-300 font-serif font-medium text-center space-y-2 -mt-2'>
              {filteredWords.map((word, idx) => (
                <p key={idx}>{word}</p>
              ))}{' '}
              <div className='max-w-lg px-12 text-center text-lg text-gray-800 dark:text-gray-400 font-serif italic font-normal'>
                {definition}
              </div>
            </div>
          ) : (
            <div className='text-lg text-gray-700 dark:text-gray-300 -mt-2'>
              {wordRows.length > 0 ? (
                wordRows.map((group, idx) => (
                  <p key={idx} className='space-x-4'>
                    {group.map((word, wIdx) => (
                      <span
                        key={wIdx}
                        className='font-mono inline-block w-16 text-center'
                      >
                        {word}
                      </span>
                    ))}
                  </p>
                ))
              ) : (
                <p className='text-gray-600 dark:text-gray-400 pt-0.5 font-serif flex justify-center'>
                  No matching word, please check your input.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
