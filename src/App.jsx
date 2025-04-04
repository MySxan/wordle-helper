import { useState } from 'react';
import WordInput from './components/WordInput';
import WordFilter from './components/WordFilter';
import filterWords from './utils/filterWords';

const wordsList = ['apple', 'grape', 'table', 'blaze', 'plant'];

const App = () => {
  const [guessedWords, setGuessedWords] = useState([]);
  const [filteredWords, setFilteredWords] = useState(wordsList);

  const handleSubmit = (word, feedback) => {
    const newGuess = { word, feedback };
    setGuessedWords([...guessedWords, newGuess]);

    const newFilteredWords = filterWords(word, feedback, wordsList);
    setFilteredWords(newFilteredWords);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold">Wordle Helper</h1>
      <WordInput onSubmit={handleSubmit} />
      <WordFilter filteredWords={filteredWords} />
    </div>
  );
};

export default App;
