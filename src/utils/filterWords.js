const filterWords = (guess, feedback, wordList) => {
  return wordList.filter(word => {
    for (let i = 0; i < 5; i++) {
      const guessedLetter = guess[i];
      const feedbackColor = feedback[i];

      // G - 字母在正确位置
      if (feedbackColor === 'G' && word[i] !== guessedLetter) {
        return false;
      }

      // Y - 字母在单词中，但位置不对
      if (feedbackColor === 'Y' && word[i] === guessedLetter) {
        return false;
      }

      // B - 字母不在单词中
      if (feedbackColor === 'B' && word.includes(guessedLetter)) {
        return false;
      }
    }
    return true;
  });
};

export default filterWords;
