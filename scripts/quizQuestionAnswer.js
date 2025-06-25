/**
 * An answer option for a quiz question.
 */
class QuizQuestionAnswer {

    /**
     * Create a QuizQuestionAnswer instance.
     * @param {string} text - The answer text.
     * @param {number} index - The index of this answer option.
     * @param {boolean} isCorrect - Indicates if this option is a correct answer.
     */
    constructor(text, index, isCorrect) {
        this.text = text;
        this.index = index;
        this.isCorrect = isCorrect;
    }
}