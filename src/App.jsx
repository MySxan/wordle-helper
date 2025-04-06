import React, { useState, useEffect } from 'react';
import dictionary from './assets/words.json';

const colorCycle = [
  { bg: 'bg-gray-200', border: 'border-gray-500', text: 'text-gray-700' },
  { bg: 'bg-green-200', border: 'border-green-600', text: 'text-green-800' },
  { bg: 'bg-yellow-200', border: 'border-yellow-600', text: 'text-yellow-800' },
];

function App() {
  const [rows, setRows] = useState([
    Array(5).fill({ letter: '', cycleIndex: -1}),
  ]);
  const [selectedRowIndex, setSelectedRowIndex] = useState(0);
  const [selectedCellIndex, setSelectedCellIndex] = useState(0);
  const [shifted, setShifted] = useState(false);

  // listen to user input
  useEffect(() => {
    const handleKeyDown = (e) => {
      setRows((prev) => {
        const updated = [...prev];
        const row = [...updated[selectedRowIndex]];

        // backspace：delete if current cell is not empty, or back to the previous cell
        if (e.key === 'Backspace') {
          if (row[selectedCellIndex].letter !== '') {
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
            if (selectedCellIndex < 4) {
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
    const target = word.toUpperCase().split(''); // 确保目标词是大写
    const guess = row.map((c) => c.letter.toUpperCase()); // 确保用户输入是大写
    const result = Array(5).fill(-1); // 对应 cycleIndex

    const used = Array(5).fill(false); // 标记已匹配的位置

    // Step 1: Match green
    for (let i = 0; i < 5; i++) {
      if (guess[i] === target[i]) {
        result[i] = 1; // Green
        used[i] = true;
      }
    }

    // Step 2: Match yellow
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

    // Step 3: Others are gray
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

  return (
    <div
      className='justify-start flex flex-col items-center transition-all duration-1000 space-y-8'
      style={{ marginTop: shifted ? '5rem' : 'calc(50vh - 15rem)' }}
    >
      <h1 className='text-6xl font-serif font-medium mb-4 text-gray-700'>
        Wordle Helper
      </h1>

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
          <p className='text-gray-600 pt-0.5 font-serif text-center'>
            Type letters in order and use Backspace to delete. <br />
            Click a cell to cycle through filter rules: <br />
            <span className='font-bold text-green-600'>Green</span> - Letter is
            correct and in the right spot. <br />
            <span className='font-bold text-yellow-600'>Yellow</span> - Letter
            is correct but in the wrong spot. <br />
            <span className='font-bold text-gray-600'>Gray</span> - Letter
            should not appear in the word.
          </p>
        ) : filteredWords.length === 1 ? (
          <div className='text-4xl text-gray-800 font-serif font-medium text-center space-y-2 -mt-2'>
            {filteredWords.map((word, idx) => (
              <p key={idx}>{word}</p>
            ))}{' '}
            <div className='max-w-lg px-12 text-center text-lg text-gray-800 font-serif italic font-normal'>
              {definition}
            </div>
          </div>
        ) : (
          <div className='text-lg text-gray-700 -mt-2'>
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
              <p className='text-gray-600 pt-0.5 font-serif flex justify-center'>
                No matching word, please check your input.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
