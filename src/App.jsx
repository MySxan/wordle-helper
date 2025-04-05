import React, { useState, useEffect, useRef } from 'react';

// 定义颜色循环，包含背景、描边和文字的颜色类名
const colorCycle = [
  { bg: 'bg-gray-200', border: 'border-gray-500', text: 'text-gray-700' },
  { bg: 'bg-green-200', border: 'border-green-600', text: 'text-green-800' },
  { bg: 'bg-yellow-200', border: 'border-yellow-600', text: 'text-yellow-800' },
];

// 预设词库
const dictionary = [
  "APPLE",
  "GRAPE",
  "BANJO",
  "CHAIR",
  "BRAVE",
  "CRANE",
  "SLATE",
  "PLATE",
  "GRACE",
  "FLARE",
  "TRAIN",
  "STARE",
  "PLATE",
  "BLAST",
  "BLACK",
  "GRIPT",
  "LEAPT",
  "STORM",
  "CROWN",
  "THUMP",
  "STUMP",
  "VANES",
  "GROWN",
  "ROAST",
  "TURIN",
  "TARES",
];

function App() {
  // cells 数组保存 5 个格子的状态，每个对象包含 letter 和 cycleIndex（-1 表示还未填写）
  const [cells, setCells] = useState(Array(5).fill({ letter: '', cycleIndex: -1 }));
  // 当前选中的格子索引，初始默认选中第一个格子
  const [selectedIndex, setSelectedIndex] = useState(0);
  const hasInput = cells.some(cell => cell.letter !== '');

  // 监听全局键盘事件处理字母输入和退格键删除
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 退格键：如果当前格子有字母则删除，否则退回到前一个格子并删除
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

      // 输入单个字母时（忽略大小写）
      if (/^[a-zA-Z]$/.test(e.key)) {
        setCells((prev) => {
          const newCells = [...prev];
          // 仅在当前选中格子为空时填入字母，并设置颜色循环起始为 0（灰色）
          if (newCells[selectedIndex].letter === '') {
            newCells[selectedIndex] = { letter: e.key.toUpperCase(), cycleIndex: 0 };
            // 若还有后续格子，则自动聚焦下一个空格
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

  // 点击格子时：若格子已填写字母则循环切换颜色，同时设为当前选中
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

  // 根据 cells 当前状态过滤出符合条件的单词
  const filteredWords = dictionary.filter((word) => {
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      if (cell.letter !== '') {
        // 根据颜色状态进行判断
        if (cell.cycleIndex === 1) {
          // 绿色：该位置必须匹配
          if (word[i] !== cell.letter) return false;
        } else if (cell.cycleIndex === 2) {
          // 黄色：该字母必须存在于单词中，但不能在该位置
          if (word[i] === cell.letter) return false;
          if (!word.includes(cell.letter)) return false;
        } else if (cell.cycleIndex === 0) {
          // 灰色：该字母不应出现在单词中
          if (word.includes(cell.letter)) return false;
        }
      }
    }
    return true;
  });

  // 截取前 60 个符合条件的单词并按 5 个词一行显示
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
          // 如果格子已填写字母，则根据 cycleIndex 获取对应的背景、边框和文字颜色
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


      {/* Wordle helper 提示区域 */}
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
