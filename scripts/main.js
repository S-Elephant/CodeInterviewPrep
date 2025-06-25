/**
 * -----------------
 * Constants and caching.
 * -----------------
 */

/**
 * @type {Array<Object>} quizData - Master list of all quiz questions loaded from JSON.
 * This value should never be changed after being set.
 */
let quizData = [];

/**
 * @type {Array<Object>} filteredQuestions - Subset of questions after applying filters
 * @description Contains the same structure as quizData, but only includes questions
 * that match the current tag, difficulty, and importance filters.
 * Used as the source for rendering the visible questions.
 * It's order isn't randomized.
 */
let filteredQuestions = [];

/**
 * Contains info regarding the quiz state such as which questions are answered and how many
 * are answered correctly.
 * @type {{totalQuestions: number, correctAnswers: number, answeredQuestions: Set<any>}}
 */
let quizState = {
    totalQuestions: 0,
    correctAnswers: 0,
    answeredQuestions: new Set() // Tracks which questions have been answered.
};

/**
 * @constant {Object} DIFFICULTY_LEVELS - Maps difficulty levels to numerical values.
 * @property {number} easy - Level 1 difficulty.
 * @property {number} medium - Level 2 difficulty.
 * @property {number} hard - Level 3 difficulty.
 */
const DIFFICULTY_LEVELS = {
    'easy': 1,
    'medium': 2,
    'hard': 3
};

/**
 * @constant {Object} IMPORTANCE_LEVELS - Maps importance levels to numerical values.
 * @property {number} essential - Level 5 importance.
 * @property {number} important - Level 4 importance.
 * @property {number} standard - Level 3 importance.
 * @property {number} rare - Level 2 importance.
 * @property {number} very rare - Level 1 importance.
 */
const IMPORTANCE_LEVELS = {
    'essential': 5,
    'important': 4,
    'standard': 3,
    'rare': 2,
    'very rare': 1
};

/**
 * @type {Object} domElements - Cached DOM elements for better performance.
 * @property {HTMLElement|null} container - Main quiz container.
 * @property {HTMLElement|null} questionsContainer - Where questions are rendered.
 * @property {HTMLInputElement|null} tagsInput - Tags filter input.
 * @property {HTMLSelectElement|null} difficultySelect - Difficulty dropdown.
 * @property {HTMLSelectElement|null} importanceSelect - Importance dropdown.
 * @property {HTMLButtonElement|null} filterButton - Apply filters button.
 * @property {HTMLElement|null} shownCount - Display for shown questions count.
 * @property {HTMLElement|null} totalCount - Display for total questions count.
 */
const domElements = {
    container: null,
    questionsContainer: null,
    includedTagsInput: null,
    excludedTagsInput: null,
    difficultySelect: null,
    filterButton: null,
    shownCount: null,
    totalCount: null,
	shuffleQuestionsCheckbox: null,
	shuffleAnswersCheckbox: null,
    scoreDisplay: null,
	showDifficultyCheckbox: null,
	showImportanceCheckbox: null,
	showTagsCheckbox: null
};

/**
 * -----------------
 * Main logic.
 * -----------------
 */

/**
 * Initialize this website.
 * - Caches DOM elements.
 * - Sets up event listeners.
 * - Loads questions.
 */
function init() {
    cacheDomElements();
    setupEventListeners();
	loadSettings();
    void loadQuestions();
}

/**
 * Cache frequently used DOM elements.
 */
function cacheDomElements() {
    domElements.container = document.querySelector('.quiz-container');
    domElements.questionsContainer = document.getElementById('questions-container');
    
	// Filters.
	domElements.includedTagsInput = document.getElementById('included-tags');
    domElements.excludedTagsInput = document.getElementById('excluded-tags');
    domElements.difficultySelect = document.getElementById('difficulty');
	domElements.importanceSelect = document.getElementById('importance');
    domElements.filterButton = document.getElementById('apply-filters');
    
	// Question count.
	domElements.shownCount = document.getElementById('shown-count');
    domElements.totalCount = document.getElementById('total-count');
	
	// Settings.
	domElements.shuffleQuestionsCheckbox = document.getElementById('shuffle-questions');
    domElements.shuffleAnswersCheckbox = document.getElementById('shuffle-answers');
    domElements.showDifficultyCheckbox = document.getElementById('show-difficulty');
    domElements.showImportanceCheckbox = document.getElementById('show-importance');
    domElements.showTagsCheckbox = document.getElementById('show-tags');

    // Score.
    domElements.scoreDisplay = document.getElementById('scoreDisplay');
}

/**
 * Setup event listeners for user interactions.
 */
function setupEventListeners() {
    if (domElements.filterButton) {
        domElements.filterButton.addEventListener('click', applyFilters);
    }
	
	// Add change listeners to all settings checkboxes.
    const settingsCheckboxes = [
        domElements.shuffleQuestionsCheckbox,
        domElements.shuffleAnswersCheckbox,
        domElements.showDifficultyCheckbox,
        domElements.showImportanceCheckbox,
        domElements.showTagsCheckbox
    ];
    
    settingsCheckboxes.forEach(checkbox => {
        if (checkbox) {
            checkbox.addEventListener('change', onSettingsChanged);
        } else {
            console.error('Checkbox not found:', checkbox);
        }
    });

    // Filter inputs.
    domElements.includedTagsInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            applyFilters();
        }
    });
    domElements.excludedTagsInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            applyFilters();
        }
    });

    // Initialize floating button scrollToTop.
    document.getElementById('scrollToTop').addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

/**
 * Reset quizState.
 * Note: does not update the score display.
 */
function resetQuizState(){
    quizState = {
        totalQuestions: 0,
        correctAnswers: 0,
        answeredQuestions: new Set() // Tracks which questions have been answered.
    };
}

/**
 * Asynchronously loads all questions from the JSON file.
 * @async
 */
async function loadQuestions() {

    quizData = await loadQuestionData();
    filteredQuestions = [...quizData];
    renderQuiz();
    updateQuestionCount();
}

/**
 * Called when the settings are changed by the user.
 * Saves the updated settings and re-renders the quiz accordingly.
 */
function onSettingsChanged() {
    saveSettings();
    renderQuiz();
}

/**
 * Reset filter data.
 */
function resetFilterData() {
    filteredQuestions = [...quizData];
}

/**
 * Filter the questions to be shown.
*/
function applyFilters() {
    try {
        resetFilterData();

        const includedTagsInput = domElements.includedTagsInput.value.trim();
        const excludedTagsInput = domElements.excludedTagsInput.value.trim();
        const difficultyFilter = domElements.difficultySelect.value;
		const importanceFilter = domElements.importanceSelect.value;
        
        // Filter by included tags.
        if (includedTagsInput) {
            filteredQuestions = includedTagsInput
                ? quizData.filter(q =>
                    q.tags.some(tag =>
                        includedTagsInput.split(',').map(t => t.trim().toLowerCase())
                            .includes(tag.toLowerCase())
                    ))
                : [...quizData];
        }

        // Filter by excluded tags.
        if (excludedTagsInput) {
            const excludedTags = excludedTagsInput.split(',').map(t => t.trim().toLowerCase());
            filteredQuestions = filteredQuestions.filter(q =>
                !q.tags.some(tag => excludedTags.includes(tag.toLowerCase()))
            );
        }

        // Filter by difficulty.
        if (difficultyFilter !== 'all') {
            filteredQuestions = filteredQuestions.filter(q => {
                const questionLevel = DIFFICULTY_LEVELS[q.difficulty];
                const baseDiff = difficultyFilter.replace(/[+-]/, '');
                
                return difficultyFilter.endsWith('+') ? questionLevel >= DIFFICULTY_LEVELS[baseDiff]
                     : difficultyFilter.endsWith('-') ? questionLevel <= DIFFICULTY_LEVELS[baseDiff]
                     : q.difficulty === difficultyFilter;
            });
        }
        
		// Filter by importance.
		if (importanceFilter !== 'all') {
			filteredQuestions = filteredQuestions.filter(q => {
				const questionImportance = IMPORTANCE_LEVELS[q.importance];
				const baseImportance = importanceFilter.replace(/[+-]/, '');
				
				return importanceFilter.endsWith('+') ? questionImportance >= IMPORTANCE_LEVELS[baseImportance]
					 : importanceFilter.endsWith('-') ? questionImportance <= IMPORTANCE_LEVELS[baseImportance]
					 : q.importance === importanceFilter;
			});
		}
		
        renderQuiz();
        updateQuestionCount();
    } catch (error) {
        console.error('Filter error:', error);
        showError('Failed to apply filters');
    }
}

/**
 * Update the question counter ("Showing x of y questions").
 */
function updateQuestionCount() {
    if (domElements.shownCount && domElements.totalCount) {
        domElements.shownCount.textContent = filteredQuestions.length.toString();
        domElements.totalCount.textContent = quizData.length.toString();
    }
}

/**
 * Render questions to the DOM.
 */
function renderQuiz() {
    if (!domElements.questionsContainer)
		return;
    
    // Get current settings.
    const shuffleQuestions = domElements.shuffleQuestionsCheckbox.checked;

    // Reset quiz state.
    resetQuizState();
    updateScoreDisplay();

    // Create a copy of filteredQuestions to avoid modifying the original array.
    let questionsToRender = [...filteredQuestions];
    
    // Shuffle questions if enabled.
    if (shuffleQuestions) {
        questionsToRender = shuffleArray(questionsToRender);
    }
    
    // Render questions.
    domElements.questionsContainer.innerHTML = 
        questionsToRender.length === 0 
            ? '<p class="no-questions">No questions match your filters.</p>'
            : questionsToRender.map((q, index) => createQuestionElement(q, index)).join('');

    setupAnswerCheckHandlers();
}

/**
 * Create DOM element for a single question.
 * @param {Object} question - Question data.
 * @param {number} index - Question index.
 * @returns {string} HTML string for the question.
 */
function createQuestionElement(question, index) {
    // Get current settings from DOM elements.
    const showDifficulty = domElements.showDifficultyCheckbox.checked;
    const showImportance = domElements.showImportanceCheckbox.checked;
    const showTags = domElements.showTagsCheckbox.checked;
	const shuffleAnswers = domElements.shuffleAnswersCheckbox.checked;
	const answers = getQuestionAnswers(question, shuffleAnswers);

    // Build difficulty badges if applicable.
    const difficultyBadge = showDifficulty 
        ? `<span class="difficulty-badge ${question.difficulty}">
              ${capitalizeFirstLetter(question.difficulty)}
           </span>`
        : '';

    // Build importance badges if applicable.
    const importanceBadge = showImportance 
        ? `<span class="importance-badge ${question.importance.replace(' ', '-')}">
              ${capitalizeFirstLetter(question.importance)}
           </span>`
        : '';

    // Only include badges container if at least one badge is shown.
    const badgesContainer = (showDifficulty || showImportance)
        ? `<div class="question-badges-container">
              ${difficultyBadge}
              ${importanceBadge}
           </div>`
        : '';

    // Conditionally include tags.
    const tagsHtml = showTags && question.tags.length > 0
        ? `<span class="tags">
              ${question.tags.map(tag => capitalizeFirstLetter(tag)).join(', ')}
           </span>`
        : '';

    // Combine metadata only if there's something to show.
    const metadataHtml = (badgesContainer || tagsHtml)
        ? `<div class="metadata">
              ${badgesContainer}
              ${tagsHtml}
           </div>`
        : '';

    return `
        <div class="question ${question.difficulty}">
            <div class="question-header">
                ${metadataHtml}
                <p class="question-text">${question.question}</p>
            </div>
            ${createQuestionAnswers(question, index, answers)}
            ${createAnswerSection(question, index)}
        </div>
    `;
}

/**
 * Generate HTML for question answers based on question type.
 * Supports:
 * - multiple_choice (radio buttons, single answer).
 * - multi_select (checkboxes, multiple answers).
 * - text_input (text field).
 */
function createQuestionAnswers(question, index, answers) {
	
	// Ensure that the parameter answers is an array.
	if (!Array.isArray(answers)) {
		console.error('Invalid answers format - expected array but got:', {
			receivedType: typeof answers,
			receivedValue: answers,
			questionIndex: index,
			questionType: question?.type,
			fullQuestion: question
		});
		return '<div class="error-message">[Error: Invalid question format]</div>';
	}

    switch (question.type) {
        case QuizQuestion.TYPES.MULTI_CHOICE:
            // Single-answer (radio buttons).
            return answers.map(answer => `
                <label class="option">
                    <input type="radio" name="q${index}" value="${answer.index}">
                    <span class="option-text">${answer.text}</span>
                </label>
            `).join('');
        case QuizQuestion.TYPES.MULTI_SELECT:
            // Multi-answer (checkboxes).
            return answers.map(answer => `
                <label class="option">
                    <input type="checkbox" name="q${index}" value="${answer.index}">
                    <span class="option-text">${answer.text}</span>
                </label>
            `).join('');
        case QuizQuestion.TYPES.TEXT_INPUT:
            // Text input field.
            return `
        <input type="text" id="q${index}-answer" placeholder="Type your answer..." 
               onkeydown="if(event.key === 'Enter') { 
                   document.querySelector('button.check-btn[data-index=\\'${index}\\']').click(); 
                   return false;
               }">
    `;
        case QuizQuestion.TYPES.INFO:
            return '';
        default:
            console.error(`Unknown question type: ${question.type}`);
            return '';
    }
}

/**
 * Gets and processes question answers, always returning an array.
 * @param {object} question - The question object.
 * @param {boolean} shuffleAnswers - Whether to shuffle answer order (if allowed by question).
 * @returns {Array} Always returns an array of answer objects or at least an empty array.
 */
function getQuestionAnswers(question, shuffleAnswers) {
    try {
        // Handle missing or invalid answers.
        if (!question || !Array.isArray(question.answers)) {
            if (question.type !== QuizQuestion.TYPES.TEXT_INPUT) {
                console.warn('Missing or invalid answers for question:', question);
            }
            return [];
        }

        const answers = question.answers;

        // Apply shuffling if requested and there are answers.
        if (shuffleAnswers && question.allowAnswerShuffling && answers.length > 1) {
            return shuffleArray(answers);
        }

        return answers;
    } catch (error) {
        console.error('Error processing question answers:', error, question);
        return [];
    }
}
/**
 * Create answer checking section HTML.
 * Handles multiple correct answers for text_input and multi_select questions.
 */
function createAnswerSection(question, index) {
    const correctAnswers = question.correctAnswers();
    const isMultiple = correctAnswers.length > 1;
    
    let correctAnswerDisplay;

    if (correctAnswers.length === 0) {
        if (question.type !== QuizQuestion.TYPES.INFO)
            correctAnswerDisplay = '<span class="error-badge">Error: No correct answer defined.</span>';
    }
    else if (isMultiple) {
        correctAnswerDisplay = `
            <div class="multi-correct-answers-container">
                ${correctAnswers.map(answer => 
                    `<span class="multi-correct-answer-badge">${answer.text}</span>`
                ).join('')}
            </div>
        `;
    } else {
        correctAnswerDisplay = `<span class="correct-answer-badge">${correctAnswers[0].text}</span>`;
    }

    return `
    <button class="check-btn" data-index="${index}" data-question-id="${question.id}">
        ${question.type === QuizQuestion.TYPES.INFO ? 'Show Answer' : 'Check Answer'}
    </button>
    <div id="q${index}-feedback" class="feedback hidden"></div>
    <div id="q${index}-spoiler" class="spoiler hidden">
        ${
        question.type !== QuizQuestion.TYPES.INFO
            ? `<p><strong>Correct answer${isMultiple ? 's' : ''}:</strong> ${correctAnswerDisplay}</p>`
            : ''
    }
        ${question.explanation === '' ? '' : `<p><strong>Explanation:</strong> ${question.explanation || 'No explanation provided.'}</p>`}
    </div>
`;
}

/**
 * Setup event delegation for answer checking.
 */
function setupAnswerCheckHandlers() {
    domElements.questionsContainer?.addEventListener('click', (e) => {
        const checkBtn = e.target.closest('.check-btn');
        if (checkBtn) {
            const index = parseInt(checkBtn.dataset.index);
            const questionIdToCheck = checkBtn.dataset.questionId;
            checkAnswerAndShowResult(filteredQuestions.find(q => q.id === questionIdToCheck), index);
        }
    });
}

/**
 * Check if the answer is correct and show the result.
 */
function checkAnswerAndShowResult(question, index) {
    if (question === undefined || question === null) {
        console.log('Error: no question received. Aborting.');
        return;
    }

    const feedback = document.getElementById(`q${index}-feedback`);

    try {
        const spoiler = document.getElementById(`q${index}-spoiler`);

        let isCorrect = false;
        let userAnswerAsText = '';

        // Handle different question types.
        switch (question.type) {
            case QuizQuestion.TYPES.MULTI_CHOICE:
                // Single-answer (radio buttons).
                const selectedRadio = document.querySelector(`input[name="q${index}"]:checked`);
                if (!selectedRadio) {
                    showFeedback(feedback, '❌ Please select an answer!', false);
                    spoiler.classList.remove('hidden');
                    updateQuizState(question.id, false);
                    return;
                }
                userAnswerAsText = selectedRadio.parentNode.textContent.trim();
                isCorrect = question.validateAnswer([Number(selectedRadio.value)]);
                break;
            case QuizQuestion.TYPES.MULTI_SELECT:
                // Multi-answer (checkboxes).
                const selectedCheckboxes = document.querySelectorAll(`input[name="q${index}"]:checked`);
                if (selectedCheckboxes.length === 0) {
                    showFeedback(feedback, '❌ Please select at least one answer!', false);
                    spoiler.classList.remove('hidden');
                    updateQuizState(question.id, false);
                    return;
                }
                userAnswerAsText = Array.from(selectedCheckboxes).map(cb => cb.parentNode.textContent.trim()).join(', ');
                
                // Check if ALL correct answers are selected.
                const selectedValues = Array.from(selectedCheckboxes).map(cb => Number(cb.value));
                isCorrect = question.validateAnswer(selectedValues);
                break;
            case QuizQuestion.TYPES.TEXT_INPUT:
                // Text input (with multiple possible correct answers).
                userAnswerAsText = document.getElementById(`q${index}-answer`).value.trim();
                if (!userAnswerAsText) {
                    showFeedback(feedback, '❌ Please enter an answer!', false);
                    spoiler.classList.remove('hidden');
                    updateQuizState(question.id, false);
                    return;
                }
                isCorrect = question.validateAnswer(userAnswerAsText);
                break;
            case QuizQuestion.TYPES.INFO:
                userAnswerAsText = '';
                isCorrect = true;
                break;
            default:
                console.error(`Unknown question type: ${question.type}. Aborting.`);
                return;
        }

        if (question.type !== QuizQuestion.TYPES.INFO) {
            // Show result.
            showFeedback(
                feedback,
                isCorrect ? '✅ Correct!' : `❌ Incorrect! You answered: '${userAnswerAsText}'`,
                isCorrect
            );
        }

        spoiler.classList.remove('hidden');

        updateQuizState(question.id, isCorrect);

    } catch (error) {
        console.error('Error checking answer:', error);
        showFeedback(feedback, '⚠️ An error occurred. See the console for more details.', false);
    }
}

/**
 * Display feedback for the answered question, regardless of whether the answer was correct or incorrect.
 */
function showFeedback(element, message, isCorrect) {
    if (element) {
        element.textContent = message;
        element.className = `feedback ${isCorrect ? 'correct' : 'incorrect'}`;
        element.classList.remove('hidden');
    }
}

/**
 * Initialize collapsible sections functionality for all elements with class 'collapse-toggle'
 * When clicked, toggles the 'collapsed' class on the target element specified by data-target attribute.
 */
document.querySelectorAll('.collapse-toggle').forEach(button => {
    button.addEventListener('click', function() {
        // Get the target container class from data-target attribute
        const target = this.getAttribute('data-target');
        // Find the target container element
        const container = document.querySelector(`.${target}`);
        // Toggle the 'collapsed' class to show/hide content
        container.classList.toggle('collapsed');
    });
});

/**
 * Saves all current settings to a cookie.
 * Collects values from all settings checkboxes and stores them as JSON.
 */
function saveSettings() {
    // Create settings object with current checkbox states
    const settings = {
        shuffleQuestions: domElements.shuffleQuestionsCheckbox.checked,
        shuffleAnswers: domElements.shuffleAnswersCheckbox.checked,
        showDifficulty: domElements.showDifficultyCheckbox.checked,
        showImportance: domElements.showImportanceCheckbox.checked,
        showTags: domElements.showTagsCheckbox.checked
    };
    // Store settings as JSON string in cookie
    setCookie('quizSettings', JSON.stringify(settings));
}

/**
 * Loads settings from cookie and applies them to the UI.
 * If no settings are found, defaults remain unchanged.
 */
function loadSettings() {
    // Get settings cookie if it exists
    const settingsCookie = getCookie('quizSettings');

    if (settingsCookie) {
        // Parse the JSON string back to an object
        const settings = JSON.parse(settingsCookie);
        // Apply each setting to its corresponding checkbox
        domElements.shuffleQuestionsCheckbox.checked = settings.shuffleQuestions;
        domElements.shuffleAnswersCheckbox.checked = settings.shuffleAnswers;
        domElements.showDifficultyCheckbox.checked = settings.showDifficulty;
        domElements.showImportanceCheckbox.checked = settings.showImportance;
        domElements.showTagsCheckbox.checked = settings.showTags;
    }
}

/**
 * Initialize event listeners when DOM is fully loaded.
 */
document.addEventListener('DOMContentLoaded', function() {
    // Load saved settings from cookies
    loadSettings();
    
    // Add change event listeners to all settings checkboxes
    // This will save settings automatically when any checkbox is toggled
    document.querySelectorAll('.settings-row input').forEach(input => {
        input.addEventListener('change', function() {
            // Save the new settings to cookie
            saveSettings();
        });
    });
});

/**
 * Display an error message to the user.
 * @param {string} message - The error message to display.
 */
function showError(message) {
    const errorContainer = document.getElementById('questions-container') || document.querySelector('.quiz-container');
    if (errorContainer) {
        errorContainer.innerHTML = `<p class="error">${message}</p>`;
    }
}

/**
 * Start the app when the DOM is ready.
 */
document.addEventListener('DOMContentLoaded', init);