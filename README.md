# Wordle Helper

A React-based Wordle helper tool that helps players refine their guesses by providing feedback on their guesses and filtering possible words accordingly.

## Features

- **Real-Time Input**: Type letters in order and use the backspace key to delete.
- **Color-Coded Feedback**: Click on any guessed letter to cycle through:
  - **Green**: The letter is correct and in the right spot.
  - **Yellow**: The letter is correct but in the wrong spot.
  - **Gray**: The letter should not appear in the word.
- **Word Filtering**: Based on user feedback, the app filters possible words and only shows the ones that match the provided clues.
- **Word Definition**: If only one word matches the filter, its definition will be fetched from an API and displayed.

## Live Demo

You can try the app live here:  
[https://mysxan.github.io/wordle-helper/](https://mysxan.github.io/wordle-helper/)

## Installation

To run the app locally, follow these steps:

1. Clone the repository:

   ```bash
   git clone https://github.com/mysxan/wordle-helper.git
   ```

2. Navigate to the project directory:

   ```bash
   cd wordle-helper
   ```

3. Install the dependencies:

   ```bash
   npm install
   ```

4. Run the app:

   ```bash
   npm run dev
   ```

5. Your app will be running at http://localhost:xxxx/ displayed in the terminal.

## How to Use

1. Type letters in the input grid to make guesses.
2. Use Backspace to delete letters and adjust your guesses.
3. Click on any cell to cycle its color between:
   - **Green**: Letter is in the right place.
   - **Yellow**: Letter is in the word but in the wrong place.
   - **Gray**: Letter doesn't exist in the word.
4. The possible matching words will be shown based on your inputs.
5. If only one word matches, its definition will be displayed below.

## Contributing

Feel free to fork this project, submit issues, or open pull requests for new features and improvements!

## License

This project is licensed under the MIT License - see the LICENSE file for details.
