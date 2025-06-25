
/**
 * Update the score display which should show the wrong/correct answers given.
 */
function updateScoreDisplay() {
    const percentage = quizState.totalQuestions > 0
        ? Math.round((quizState.correctAnswers / quizState.totalQuestions) * 100)
        : 0;
    domElements.scoreDisplay.textContent =
        `${quizState.correctAnswers}/${quizState.totalQuestions} (${percentage}%, ${filteredQuestions.length} total)`;

    // Update background color based on performance.
    if (quizState.totalQuestions === 0) {
        domElements.scoreDisplay.style.backgroundColor = '#808080';
    }
    else {
        domElements.scoreDisplay.style.backgroundColor = scoreColor(percentage);
    }
}

/**
 * Returns an RGB color string transitioning from red → yellow → green.
 * @param {number} percentage - A number from 0 to 100.
 */
function scoreColor(percentage) {
    const RED_TO_YELLOW_START = { r: 244, g: 0,   b: 0 };
    const RED_TO_YELLOW_END   = { r: 244, g: 193, b: 0 };

    const YELLOW_TO_GREEN_START = { r: 244, g: 193, b: 0 };
    const YELLOW_TO_GREEN_END   = { r: 76,  g: 180, b: 0 };

    let r, g, b = 0;

    if (percentage <= 50) {
        // Interpolate red to yellow
        const t = percentage / 50;
        r = lerp(RED_TO_YELLOW_START.r, RED_TO_YELLOW_END.r, t);
        g = lerp(RED_TO_YELLOW_START.g, RED_TO_YELLOW_END.g, t);
        b = lerp(RED_TO_YELLOW_START.b, RED_TO_YELLOW_END.b, t);
    } else {
        // Interpolate yellow to green
        const t = (percentage - 50) / 50;
        r = lerp(YELLOW_TO_GREEN_START.r, YELLOW_TO_GREEN_END.r, t);
        g = lerp(YELLOW_TO_GREEN_START.g, YELLOW_TO_GREEN_END.g, t);
        b = lerp(YELLOW_TO_GREEN_START.b, YELLOW_TO_GREEN_END.b, t);
    }

    return `rgb(${r},${g},${b})`;
}

/**
 * Updates the quizState when a question is answered.
 * @param questionId
 * @param isCorrect
 */
function updateQuizState(questionId, isCorrect) {
    // Only count if this question hasn't been answered before in this session.
    if (!quizState.answeredQuestions.has(questionId)) {
        quizState.answeredQuestions.add(questionId);
        quizState.totalQuestions++;
        if (isCorrect) {
            quizState.correctAnswers++;
        }
        updateScoreDisplay();
    }
}
