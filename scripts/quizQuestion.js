/**
 * QuizQuestion class represents a quiz question with various types and answers.
 */
class QuizQuestion {
    /**
     * Question types.
     */
    static TYPES = {
        TEXT_INPUT: 'text_input',
        MULTI_CHOICE: 'multiple_choice',
        MULTI_SELECT: 'multi_select',
        INFO: 'info'
    };

    /**
     * Static counter to generate unique IDs for each question instance.
     */
    static #idCounter = 0;

    /**
     * All possible user answers (including wrong ones).
     * For some question types (i.e. text_input) any answer is possible.
     */
    answers = [];

    /**
     * if true, allows its answers to be shuffled.
     */
    allowAnswerShuffling = true;

    /**
     * Constructor to create a QuizQuestion instance from given data.
     * @param {object} data - The question data (from JSON).
     */
    constructor(data) {
        this.id = this.#generateId();

        this.type = data.type; // text_input/multiple_choice/multi_select
        this.question = data.question;
        this.explanation = data.explanation || '';
        this.allowAnswerShuffling = data.allowAnswerShuffling ?? true;

        if (this.type === QuizQuestion.TYPES.TEXT_INPUT) {
            if (!Array.isArray(data.correctAnswers))
                throw new Error(`Missing "correctAnswers" array for question: "${data.question}".`);

            for (let i = 0; i < data.correctAnswers.length; i++) {
                const answerText = data.correctAnswers[i];
                this.answers.push(new QuizQuestionAnswer(answerText, i, true));
            }
        }
        else if (this.type !== QuizQuestion.TYPES.INFO) {
            if (!Array.isArray(data.answers))
                throw new Error(`Missing "answers" array for question: "${data.question}".`);

            for (let i = 0; i < data.answers.length; i++) {
                const answerText = data.answers[i];
                const isCorrectAnswer = data.correctIndices.includes(i);
                this.answers.push(new QuizQuestionAnswer(answerText, i, isCorrectAnswer));
            }
        }

        this.tags = (data.tags || []).slice().sort((a, b) => a.localeCompare(b));
        this.difficulty = data.difficulty || 'medium';
        this.importance = data.importance || 'standard';
    }

    /**
     * Generate a unique identifier and return it.
     * @returns {string} A unique incrementing identifier.
     */
    #generateId()
    {
        const current = QuizQuestion.#idCounter;
        QuizQuestion.#idCounter++;

        return String(current);
    }

    /**
     * Returns all correct answer objects.
     * @returns {Array} Array of answers marked as correct.
     */
    correctAnswers() {
        return this.answers.filter(answer => answer.isCorrect);
    }

    /**
     * Validate the provided user answer(s) against the correct answers.
     * @param {string|Array|number} userAnswers - The user's answer(s).
     * @returns {boolean} True if the answer(s) are correct.
     */
    validateAnswer(userAnswers) {
        switch (this.type) {
            case QuizQuestion.TYPES.MULTI_CHOICE:
                // User must have selected one of the correct answer(s).
                return this.correctAnswers().some(correctAnswer => correctAnswer.index === userAnswers[0]);
            case QuizQuestion.TYPES.TEXT_INPUT:
                // Text comparison (case-insensitive and ignores leading and trailing whitespaces).
                return this.answers.filter(answer => answer.isCorrect).some(answer => userAnswers.toString().trim().toLowerCase() === answer.text.trim().toLowerCase()
                );
            case QuizQuestion.TYPES.MULTI_SELECT:
                // Must match ALL correct indices (order doesn't matter).
                const correctAnswers = this.correctAnswers();
                return correctAnswers.length === userAnswers.length &&
                    correctAnswers.every(correctAnswer => userAnswers.includes(correctAnswer.index));
            case QuizQuestion.TYPES.INFO:
                // Info is always correct.
                return true;
            default:
                console.error(`Unknown question type: ${this.type}`);
                return false;
        }
    }
}