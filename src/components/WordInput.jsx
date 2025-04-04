import { useState } from 'react';

const WordInput = ({ onSubmit }) => {
  const [word, setWord] = useState('');
  const [feedback, setFeedback] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // 确保用户输入的是5字母的单词，且反馈也是5个字符
    if (word.length === 5 && feedback.length === 5) {
      const feedbackArray = feedback.split('');  // 将反馈字符串转换为数组
      onSubmit(word, feedbackArray);  // 调用父组件的onSubmit函数，传递单词和反馈
      setWord("");  // 提交后清空输入框
      setFeedback("");  // 清空反馈框
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <input
          type="text"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          className="p-2 border rounded"
          maxLength={5}
          placeholder="Input guess word"
        />
        <input
          type="text"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          className="p-2 border rounded"
          maxLength={5}
          placeholder="Input feedback（G/Y/B）"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">Submit</button>
      </form>
    </div>
  );
};

export default WordInput;
