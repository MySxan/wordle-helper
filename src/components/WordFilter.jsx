const WordFilter = ({ filteredWords }) => {
    return (
      <div>
        <h2 className="mt-4 text-xl">Possible matching words：</h2>
        <ul>
          {filteredWords.length > 0 ? (
            filteredWords.map((word, index) => (
              <li key={index}>{word}</li>
            ))
          ) : (
            <p>No matching word.</p>
          )}
        </ul>
      </div>
    );
  };
  
  export default WordFilter;
  