import React, { useState, useEffect, useRef } from 'react';

const colorCycle = [
  { bg: 'bg-gray-200', border: 'border-gray-500', text: 'text-gray-700' },
  { bg: 'bg-green-200', border: 'border-green-600', text: 'text-green-800' },
  { bg: 'bg-yellow-200', border: 'border-yellow-600', text: 'text-yellow-800' },
];

const dictionary = [
  "APPLE", "GRAPE", "BANJO", "CHAIR", "BRAVE", "CRANE", "SLATE", "PLATE", "GRACE", "FLARE",
  "TRAIN", "STARE", "PLATE", "BLAST", "BLACK", "GRIPT", "LEAPT", "STORM", "CROWN", "THUMP",
  "STUMP", "VANES", "GROWN", "ROAST", "TURIN", "TARES", "REACT", "STATE", "SALER", "TEARS",
];

function App() {
  // array of cells
  const [cells, setCells] = useState(Array(5).fill({ letter: '', cycleIndex: -1 }));
  // index of selected cell
  const [selectedIndex, setSelectedIndex] = useState(0);
  const hasInput = cells.some(cell => cell.letter !== '');

  // listen to user input
  useEffect(() => {
    const handleKeyDown = (e) => {

      // backspace：delete if current cell is not empty, or back to the previous cell
      if (e.key === 'Backspace') {
        setCells((prev) => {
          const newCells = [...prev];
          if (newCells[selectedIndex].letter !== '') {
            newCells[selectedIndex] = { letter: '', cycleIndex: -1 };
          } else if (selectedIndex > 0) {
            newCells[selectedIndex - 1] = { letter: '', cycleIndex: -1 };
            setSelectedIndex(selectedIndex - 1);
          }
          return newCells;
        });
        return;
      }

      // letters
      if (/^[a-zA-Z]$/.test(e.key)) {
        setCells((prev) => {
          const newCells = [...prev];
          // fill in the cell and initialize color if empty 
          if (newCells[selectedIndex].letter === '') {
            newCells[selectedIndex] = { letter: e.key.toUpperCase(), cycleIndex: 0 };
            // focus on the next cell if exist
            if (selectedIndex < newCells.length - 1) {
              setSelectedIndex(selectedIndex + 1);
            }
          }
          return newCells;
        });
      }

    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex]);

  // cycle through colors and focus on the cell if it is not empty
  const handleCellClick = (index) => {
    if (cells[index].letter !== '') {
      setCells((prev) => {
        const newCells = [...prev];
        const currentIndex = newCells[index].cycleIndex;
        const nextIndex = (currentIndex + 1) % colorCycle.length;
        newCells[index] = { ...newCells[index], cycleIndex: nextIndex };
        return newCells;
      });
    }
    setSelectedIndex(index);
  };

  // filter words base on the rules
  const filteredWords = dictionary.filter((word) => {
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      if (cell.letter !== '') {
        if (cell.cycleIndex === 1) {
          // green
          if (word[i] !== cell.letter) return false;
        } else if (cell.cycleIndex === 2) {
          // yellow
          if (word[i] === cell.letter) return false;
          if (!word.includes(cell.letter)) return false;
        } else if (cell.cycleIndex === 0) {
          // gray
          if (word.includes(cell.letter)) return false;
        }
      }
    }
    return true;
  });

  // join filtered words
  const displayedWords = filteredWords.slice(0, 60);
  const rows = [];
  for (let i = 0; i < displayedWords.length; i += 5) {
    rows.push(displayedWords.slice(i, i + 5).join(' '));
  }

  return (
    <div className={`justify-start min-h-screen flex flex-col items-center transition-all duration-1000 space-y-8 
      ${hasInput ? 'pt-40' : 'pt-72'}`}>
      <h1 className="text-6xl font-serif font-medium mb-4 text-gray-700">Wordle Helper</h1>
      <div className="flex space-x-4 font-mono select-none">
        {cells.map((cell, index) => {
          // fetch style base on cycleIndex
          let bgClass = 'bg-white';
          let borderColorClass = 'border-gray-600';
          let textColorClass = 'text-black';
          if (cell.letter !== '' && cell.cycleIndex !== -1) {
            bgClass = colorCycle[cell.cycleIndex].bg;
            borderColorClass = colorCycle[cell.cycleIndex].border;
            textColorClass = colorCycle[cell.cycleIndex].text;
          }
          return (
            <div
              key={index}
              onClick={() => handleCellClick(index)}
              className={`w-16 h-16 flex justify-center items-center cursor-pointer transition-all 
                ${selectedIndex === index ? 'border-4' : 'border-2'} ${bgClass} ${borderColorClass}`}
            >
              <span className={`text-2xl font-bold ${textColorClass}`}>
                {cell.letter}
              </span>
            </div>
          );
        })}
      </div>

      <hr className="min-w-96 border-gray-400" />

      <div className="min-w-96 ">
        {cells.every(cell => cell.letter === '') ? (
          <p className="text-gray-600 pt-0.5 font-serif">
            Type letters in order and use Backspace to delete. <br></br>
            Click a cell to cycle through filter rules:<br></br>
            <text className='font-bold text-green-600'>Green</text> - The letter is at this position.<br></br>
            <text className='font-bold text-yellow-600'>Yellow</text> - The letter is in wrong position.<br></br>
            <text className='font-bold text-gray-600'>Gray</text> - The letter must not appear in the word.</p>
        ) : (
          <div className="text-lg text-gray-700 -mt-2">
            {rows.length > 0 ? (
              rows.map((row, idx) => (
                <p key={idx} className="space-x-4">
                  {row.split(' ').map((word, wordIdx) => (
                    <span key={wordIdx} className="font-mono inline-block w-16 text-center">
                      {word}
                    </span>
                  ))}
                </p>
              ))
            ) : (
              <p className="text-gray-600 pt-0.5 font-serif flex justify-center">No matching word, please check your input.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
