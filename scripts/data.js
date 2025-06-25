/**
 * Asynchronously loads all questions from the JSON file and returns that data.
 * @async
 */
async function loadQuestionData() {
    try {
        const response = await fetch('questions.json');

        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);

        const rawData = await response.json();
        return rawData.map(questionData => new QuizQuestion(questionData));

    } catch (error) {
        handleDataLoadError(error);
    }
}

/**
 * Handles errors during question loading.
 * @param {Error} error - The error object.
 */
function handleDataLoadError(error) {
    console.error('Question loading failed:', error);
    showError(`Failed to load questions: ${error.message}`);
}