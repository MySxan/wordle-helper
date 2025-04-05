import React, { useState, useEffect, useRef } from 'react';

const Square = () => {
  const [selected, setSelected] = useState(false);
  const [color, setColor] = useState('bg-gray-200'); // 初始底色为灰色
  const [letter, setLetter] = useState('');
  const squareRef = useRef(null);

  // 点击正方形内部处理
  const handleClick = (event) => {
    // 阻止事件冒泡，避免触发全局点击取消选中
    event.stopPropagation();
    // 如果未选中，则先选中；选中状态下再点击则切换底色
    if (!selected) {
      setSelected(true);
    } else {
      switch (color) {
        case 'bg-gray-200':
          setColor('bg-green-200');
          break;
        case 'bg-green-200':
          setColor('bg-yellow-200');
          break;
        case 'bg-yellow-200':
          setColor('bg-gray-200');
          break;
        default:
          setColor('bg-gray-200');
      }
    }
  };

  // 输入框限制单个字母
  const handleInputChange = (event) => {
    const value = event.target.value;
    // 只允许 a-z 或 A-Z 的单个字母
    if (/^[a-zA-Z]$/.test(value)) {
      setLetter(value);
    } else if (value === '') {
      setLetter('');
    }
  };

  // 点击正方形外部取消选中
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (squareRef.current && !squareRef.current.contains(event.target)) {
        setSelected(false);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => {
      window.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  return (
    <div
      ref={squareRef}
      onClick={handleClick}
      className={`w-48 h-48 border-black ${selected ? 'border-8' : 'border-4'} ${color} transition-all cursor-pointer flex justify-center items-center`}
    >
      <input
        type="text"
        maxLength={1}
        value={letter}
        onChange={handleInputChange}
        className={`text-center text-2xl ${selected ? 'font-bold' : 'font-normal'} bg-transparent outline-none`}
      />
    </div>
  );
};

export default Square;
