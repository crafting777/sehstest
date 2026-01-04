// Quiz Application State
let allQuestions = [];
let currentQuestions = [];
let currentQuestionIndex = 0;
let userAnswers = {};
let score = { correct: 0, total: 0 };
let examNames = [];
let currentMode = 'all';
let currentExamIndex = 0;
let answerMappings = {}; // Maps questionId to { shuffledAnswers, originalToShuffled, shuffledToOriginal }
let isRapidFire = false;
let rapidFireQuestions = []; // Pool of questions for rapid fire
let rapidFireAnswered = new Set(); // Track which questions have been shown
let incorrectQuestions = []; // Track incorrect questions with details

// DOM Elements
const fileInput = document.getElementById('file-input');
const uploadSection = document.getElementById('upload-section');
const quizSection = document.getElementById('quiz-section');
const resultsSection = document.getElementById('results-section');
const modeRadios = document.querySelectorAll('input[name="mode"]');
const examSelector = document.getElementById('exam-selector');
const examDropdown = document.getElementById('exam-dropdown');
const questionText = document.getElementById('question-text');
const questionImageContainer = document.getElementById('question-image-container');
const questionImage = document.getElementById('question-image');
const answerButtons = document.querySelectorAll('.answer-button');
const feedback = document.getElementById('feedback');
const prevButton = document.getElementById('prev-button');
const nextButton = document.getElementById('next-button');
const finishButton = document.getElementById('finish-button');
const questionNumber = document.getElementById('question-number');
const scoreDisplay = document.getElementById('score-display');
const progressFill = document.getElementById('progress-fill');
const resumeSection = document.getElementById('resume-section');
const resumeButton = document.getElementById('resume-button');
const clearSavedButton = document.getElementById('clear-saved-button');
const saveProgressButton = document.getElementById('save-progress-button');
const storedExamsSection = document.getElementById('stored-exams-section');
const examsList = document.getElementById('exams-list');
const backToHomeButton = document.getElementById('back-to-home-button');
const backToHomeResultsButton = document.getElementById('back-to-home-results-button');
const randomizeCheckbox = document.getElementById('randomize-checkbox');
const randomizeAnswersCheckbox = document.getElementById('randomize-answers-checkbox');
const endRapidFireButton = document.getElementById('end-rapidfire-button');
const incorrectQuestionsSection = document.getElementById('incorrect-questions-section');
const incorrectQuestionsList = document.getElementById('incorrect-questions-list');

// Event Listeners
fileInput.addEventListener('change', handleFileUpload);
modeRadios.forEach(radio => {
    radio.addEventListener('change', handleModeChange);
});
examDropdown.addEventListener('change', handleExamChange);
answerButtons.forEach(button => {
    button.addEventListener('click', handleAnswerClick);
});
prevButton.addEventListener('click', goToPreviousQuestion);
nextButton.addEventListener('click', goToNextQuestion);
finishButton.addEventListener('click', finishQuiz);
document.getElementById('restart-button').addEventListener('click', restartQuiz);
document.getElementById('review-button').addEventListener('click', reviewAnswers);
resumeButton.addEventListener('click', resumeSavedQuiz);
clearSavedButton.addEventListener('click', clearSavedData);
saveProgressButton.addEventListener('click', saveProgress);
backToHomeButton.addEventListener('click', goBackToHome);
backToHomeResultsButton.addEventListener('click', goBackToHome);
endRapidFireButton.addEventListener('click', endRapidFire);

// Check for saved data on page load
window.addEventListener('load', checkForSavedData);
window.addEventListener('beforeunload', saveProgress);

// Storage Functions
function saveQuestionsToStorage() {
    try {
        localStorage.setItem('quizQuestions', JSON.stringify({
            allQuestions: allQuestions,
            examNames: examNames
        }));
    } catch (error) {
        console.error('Error saving questions:', error);
    }
}

function loadQuestionsFromStorage() {
    try {
        const saved = localStorage.getItem('quizQuestions');
        if (saved) {
            const data = JSON.parse(saved);
            allQuestions = data.allQuestions || [];
            examNames = data.examNames || [];
            return true;
        }
    } catch (error) {
        console.error('Error loading questions:', error);
    }
    return false;
}

function saveProgress() {
    try {
        const progressData = {
            currentQuestionIndex: currentQuestionIndex,
            userAnswers: userAnswers,
            score: score,
            currentMode: currentMode,
            currentExamIndex: currentExamIndex,
            currentQuestions: currentQuestions.map(q => q.id),
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('quizProgress', JSON.stringify(progressData));
    } catch (error) {
        console.error('Error saving progress:', error);
    }
}

function loadProgress() {
    try {
        const saved = localStorage.getItem('quizProgress');
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (error) {
        console.error('Error loading progress:', error);
    }
    return null;
}

function clearSavedData() {
    if (confirm('Are you sure you want to clear all saved questions and progress?')) {
        localStorage.removeItem('quizQuestions');
        localStorage.removeItem('quizProgress');
        allQuestions = [];
        examNames = [];
        resumeSection.style.display = 'none';
        storedExamsSection.style.display = 'none';
        location.reload();
    }
}

function checkForSavedData() {
    const hasQuestions = loadQuestionsFromStorage();
    const hasProgress = loadProgress();
    
    if (hasQuestions) {
        populateExamDropdown();
        displayStoredExams();
        if (hasProgress) {
            resumeSection.style.display = 'block';
        }
    }
}

function displayStoredExams() {
    if (examNames.length === 0) {
        storedExamsSection.style.display = 'none';
        return;
    }
    
    storedExamsSection.style.display = 'block';
    examsList.innerHTML = '';
    
    // Group questions by exam name
    const examStats = {};
    examNames.forEach(examName => {
        const examQuestions = allQuestions.filter(q => q.examName === examName);
        examStats[examName] = {
            count: examQuestions.length,
            examName: examName
        };
    });
    
    if (Object.keys(examStats).length === 0) {
        examsList.innerHTML = '<div class="empty-exams-message">No exams stored yet. Load a questions file to get started!</div>';
        return;
    }
    
    // Create list items for each exam
    Object.values(examStats).forEach((exam, index) => {
        const examItem = document.createElement('div');
        examItem.className = 'exam-item';
        
        examItem.innerHTML = `
            <div class="exam-info">
                <div class="exam-name">${exam.examName}</div>
                <div class="exam-details">${exam.count} question${exam.count !== 1 ? 's' : ''}</div>
            </div>
            <div class="exam-actions">
                <button class="start-exam-button" data-exam-name="${exam.examName}">
                    ▶️ Start Exam
                </button>
                <button class="delete-exam-button" data-exam-name="${exam.examName}">
                    🗑️ Delete
                </button>
            </div>
        `;
        
        // Add event listeners
        const startButton = examItem.querySelector('.start-exam-button');
        const deleteButton = examItem.querySelector('.delete-exam-button');
        startButton.addEventListener('click', () => startExamFromList(exam.examName));
        deleteButton.addEventListener('click', () => deleteExam(exam.examName));
        
        examsList.appendChild(examItem);
    });
}

function startExamFromList(examName) {
    // Set mode to exam
    document.querySelector('input[name="mode"][value="exam"]').checked = true;
    currentMode = 'exam';
    
    // Find exam index
    const examIndex = examNames.indexOf(examName);
    if (examIndex === -1) {
        alert('Exam not found.');
        return;
    }
    
    currentExamIndex = examIndex;
    
    // Set dropdown to this exam
    examDropdown.value = examIndex;
    
    isRapidFire = false;
    
    // Filter questions for this exam
    currentQuestions = allQuestions.filter(q => q.examName === examName);
    
    // Randomize questions if checkbox is checked
    if (randomizeCheckbox.checked) {
        currentQuestions = shuffleArray(currentQuestions);
    }
    
    // Reset quiz state
    currentQuestionIndex = 0;
    userAnswers = {};
    score = { correct: 0, total: 0 };
    answerMappings = {}; // Reset answer mappings for new quiz
    incorrectQuestions = []; // Reset incorrect questions tracking
    
    // Show quiz section
    uploadSection.style.display = 'none';
    quizSection.style.display = 'block';
    resultsSection.style.display = 'none';
    examSelector.style.display = 'block';
    
    // Display first question
    displayQuestion();
    updateNavigationButtons();
    updateScoreDisplay();
    
    // Save progress
    saveProgress();
}

function deleteExam(examName) {
    if (!confirm(`Are you sure you want to delete "${examName}" and all its ${allQuestions.filter(q => q.examName === examName).length} questions? This cannot be undone.`)) {
        return;
    }
    
    // Remove questions for this exam
    allQuestions = allQuestions.filter(q => q.examName !== examName);
    
    // Remove exam name from list
    examNames = examNames.filter(name => name !== examName);
    
    // Update storage
    saveQuestionsToStorage();
    
    // Clear progress if it was for this exam
    const progress = loadProgress();
    if (progress && progress.currentMode === 'exam') {
        const progressExamName = examNames[progress.currentExamIndex];
        if (!progressExamName || progressExamName !== examName) {
            // Progress is for a different exam, keep it
        } else {
            // Progress was for deleted exam, clear it
            localStorage.removeItem('quizProgress');
        }
    }
    
    // Update UI
    populateExamDropdown();
    displayStoredExams();
    
    // If we're in quiz mode and viewing this exam, go back to upload
    if (quizSection.style.display !== 'none') {
        const selectedMode = document.querySelector('input[name="mode"]:checked').value;
        if (selectedMode === 'exam') {
            const selectedExamName = examNames[parseInt(examDropdown.value)];
            if (!selectedExamName || selectedExamName === examName) {
                // We were viewing the deleted exam, go back
                quizSection.style.display = 'none';
                uploadSection.style.display = 'block';
            }
        }
    }
    
    // Update resume section
    const hasProgress = loadProgress();
    if (hasProgress) {
        resumeSection.style.display = 'block';
    } else {
        resumeSection.style.display = 'none';
    }
    
    alert(`"${examName}" has been deleted.`);
}

function resumeSavedQuiz() {
    const progress = loadProgress();
    
    if (!progress) {
        alert('No saved progress found.');
        return;
    }
    
    // Restore state
    currentQuestionIndex = progress.currentQuestionIndex || 0;
    userAnswers = progress.userAnswers || {};
    score = progress.score || { correct: 0, total: 0 };
    currentMode = progress.currentMode || 'all';
    currentExamIndex = progress.currentExamIndex || 0;
    
    // Restore mode selection
    document.querySelector(`input[name="mode"][value="${currentMode}"]`).checked = true;
    
    if (currentMode === 'exam' && examNames.length > 0) {
        examSelector.style.display = 'block';
        examDropdown.value = currentExamIndex;
        const selectedExamName = examNames[currentExamIndex];
        currentQuestions = allQuestions.filter(q => q.examName === selectedExamName);
    } else {
        examSelector.style.display = 'none';
        currentQuestions = [...allQuestions];
    }
    
    // Show quiz
    uploadSection.style.display = 'none';
    quizSection.style.display = 'block';
    resultsSection.style.display = 'none';
    
    displayQuestion();
    updateNavigationButtons();
    updateScoreDisplay();
    
    resumeSection.style.display = 'none';
}

// Handle file upload
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // Validate JSON structure
            if (!Array.isArray(data) && !data.exams) {
                throw new Error('Invalid format. Expected array of questions or object with "exams" property.');
            }

            // Load existing questions first (to merge, not replace)
            const existingQuestions = [...allQuestions];
            const existingExamNames = [...examNames];
            
            let newQuestions = [];
            let newExamNames = [];

            // Handle different formats
            if (Array.isArray(data)) {
                // Simple array format - treat as single exam
                const examName = 'All Questions';
                newQuestions = data.map((q, idx) => ({
                    ...q,
                    examName: examName,
                    id: `${examName}-${Date.now()}-${idx}`
                }));
                newExamNames = [examName];
            } else if (data.exams) {
                // Structured format with exams
                data.exams.forEach(exam => {
                    const examName = exam.name || 'Unnamed Exam';
                    
                    // Check if exam already exists
                    if (existingExamNames.includes(examName)) {
                        // Ask user if they want to replace or skip
                        if (!confirm(`An exam named "${examName}" already exists. Do you want to replace it with the new one? (Click Cancel to skip this exam)`)) {
                            return; // Skip this exam
                        }
                        // Remove existing exam
                        allQuestions = allQuestions.filter(q => q.examName !== examName);
                        examNames = examNames.filter(name => name !== examName);
                    }
                    
                    newExamNames.push(examName);
                    
                    exam.questions.forEach((q, idx) => {
                        newQuestions.push({
                            ...q,
                            examName: examName,
                            id: `${examName}-${Date.now()}-${idx}`
                        });
                    });
                });
            }

            // Validate questions have required fields
            newQuestions.forEach((q, idx) => {
                if (!q.question || !q.answers || q.answers.length !== 4 || q.correctAnswer === undefined) {
                    throw new Error(`Question ${idx + 1} is missing required fields (question, answers array with 4 items, correctAnswer)`);
                }
            });

            // Merge new questions with existing ones
            allQuestions = [...allQuestions, ...newQuestions];
            
            // Merge exam names (avoid duplicates)
            newExamNames.forEach(name => {
                if (!examNames.includes(name)) {
                    examNames.push(name);
                }
            });

            // Save questions to storage
            saveQuestionsToStorage();
            
            // Populate exam dropdown
            populateExamDropdown();
            
            // Display stored exams list
            displayStoredExams();
            
            // Initialize quiz based on current mode
            handleModeChange();
            
            const totalQuestions = allQuestions.length;
            const totalExams = examNames.length;
            const newQuestionsCount = newQuestions.length;
            alert(`Successfully loaded ${newQuestionsCount} new question(s) from ${newExamNames.length} exam(s)!\n\nTotal: ${totalQuestions} questions across ${totalExams} exam(s).\nQuestions are now saved.`);
        } catch (error) {
            alert('Error loading file: ' + error.message);
            console.error(error);
        }
    };
    reader.readAsText(file);
}

function goBackToHome() {
    // Save current progress before going back
    saveProgress();
    
    // Show upload section
    uploadSection.style.display = 'block';
    quizSection.style.display = 'none';
    resultsSection.style.display = 'none';
    
    // Refresh the stored exams list
    displayStoredExams();
    
    // Check for resume option
    const hasProgress = loadProgress();
    if (hasProgress && examNames.length > 0) {
        resumeSection.style.display = 'block';
    } else {
        resumeSection.style.display = 'none';
    }
}

// Handle mode change
function handleModeChange() {
    const selectedMode = document.querySelector('input[name="mode"]:checked').value;
    currentMode = selectedMode;
    
    if (selectedMode === 'all') {
        examSelector.style.display = 'none';
        currentQuestions = [...allQuestions];
        startQuiz();
    } else if (selectedMode === 'rapidfire') {
        examSelector.style.display = 'none';
        startRapidFire();
    } else {
        examSelector.style.display = 'block';
        if (examNames.length > 0) {
            handleExamChange();
        }
    }
}

// Populate exam dropdown
function populateExamDropdown() {
    examDropdown.innerHTML = '';
    examNames.forEach((name, idx) => {
        const option = document.createElement('option');
        option.value = idx;
        option.textContent = name;
        examDropdown.appendChild(option);
    });
}

// Handle exam selection
function handleExamChange() {
    const selectedIndex = parseInt(examDropdown.value);
    currentExamIndex = selectedIndex;
    const selectedExamName = examNames[selectedIndex];
    
    currentQuestions = allQuestions.filter(q => q.examName === selectedExamName);
    startQuiz();
}

// Shuffle array function (Fisher-Yates algorithm)
function shuffleArray(array) {
    const shuffled = [...array]; // Create a copy to avoid modifying original
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Start quiz
function startQuiz() {
    if (currentQuestions.length === 0) {
        alert('No questions available. Please load a questions file.');
        return;
    }

    isRapidFire = false;
    
    // Randomize questions if checkbox is checked
    if (randomizeCheckbox.checked) {
        currentQuestions = shuffleArray(currentQuestions);
    }

    currentQuestionIndex = 0;
    userAnswers = {};
    score = { correct: 0, total: 0 };
    answerMappings = {}; // Reset answer mappings for new quiz
    incorrectQuestions = []; // Reset incorrect questions tracking
    
    uploadSection.style.display = 'none';
    quizSection.style.display = 'block';
    resultsSection.style.display = 'none';
    
    displayQuestion();
    updateNavigationButtons();
}

// Display current question
function displayQuestion() {
    const question = currentQuestions[currentQuestionIndex];
    const questionId = question.id || currentQuestionIndex;
    
    // Update question text
    questionText.textContent = question.question;
    
    // Handle image
    if (question.image) {
        questionImageContainer.style.display = 'block';
        // Handle both URL strings and base64 data
        if (question.image.startsWith('data:') || question.image.startsWith('http')) {
            questionImage.src = question.image;
        } else {
            // Assume it's a relative path
            questionImage.src = question.image;
        }
    } else {
        questionImageContainer.style.display = 'none';
    }
    
    // Handle answer randomization
    let answersToDisplay = question.answers;
    let correctAnswerIndex = question.correctAnswer;
    let mapping = null;
    
    if (randomizeAnswersCheckbox.checked) {
        // Check if we already have a mapping for this question (to maintain consistency)
        if (!answerMappings[questionId]) {
            // Create shuffled answers and mapping
            const indices = [0, 1, 2, 3];
            const shuffledIndices = shuffleArray(indices);
            
            // Create shuffled answers array
            answersToDisplay = shuffledIndices.map(origIdx => question.answers[origIdx]);
            
            // Create mapping: original index -> shuffled index
            const originalToShuffled = {};
            const shuffledToOriginal = {};
            shuffledIndices.forEach((origIdx, shuffledIdx) => {
                originalToShuffled[origIdx] = shuffledIdx;
                shuffledToOriginal[shuffledIdx] = origIdx;
            });
            
            // Update correct answer index to shuffled position
            correctAnswerIndex = originalToShuffled[question.correctAnswer];
            
            // Store mapping
            answerMappings[questionId] = {
                shuffledAnswers: answersToDisplay,
                originalToShuffled: originalToShuffled,
                shuffledToOriginal: shuffledToOriginal,
                correctAnswerShuffled: correctAnswerIndex
            };
        } else {
            // Use existing mapping
            mapping = answerMappings[questionId];
            answersToDisplay = mapping.shuffledAnswers;
            correctAnswerIndex = mapping.correctAnswerShuffled;
        }
    } else {
        // Clear mapping if randomization is disabled
        if (answerMappings[questionId]) {
            delete answerMappings[questionId];
        }
    }
    
    // Update answer buttons
    answerButtons.forEach((button, idx) => {
        const answerText = button.querySelector('.answer-text');
        answerText.textContent = answersToDisplay[idx];
        
        // Reset button state
        button.classList.remove('correct', 'incorrect', 'selected');
        button.disabled = false;
        
        // Show previous answer if exists
        if (userAnswers[questionId] !== undefined) {
            const userAnswerShuffled = userAnswers[questionId];
            const isCorrect = userAnswerShuffled === correctAnswerIndex;
            
            if (idx === userAnswerShuffled) {
                button.classList.add('selected');
                button.classList.add(isCorrect ? 'correct' : 'incorrect');
            }
            if (idx === correctAnswerIndex && !isCorrect) {
                button.classList.add('correct');
            }
            button.disabled = true;
        }
    });
    
    // Hide feedback initially
    feedback.style.display = 'none';
    
    // Update progress
    updateProgress();
}

// Handle answer click
function handleAnswerClick(event) {
    const button = event.currentTarget;
    const selectedIndex = parseInt(button.dataset.index);
    const question = currentQuestions[currentQuestionIndex];
    const questionId = question.id || currentQuestionIndex;
    
    // Don't allow changing answer if already answered
    if (userAnswers[questionId] !== undefined) {
        return;
    }
    
    // Get the correct answer index (may be shuffled)
    let correctAnswerIndex = question.correctAnswer;
    if (randomizeAnswersCheckbox.checked && answerMappings[questionId]) {
        correctAnswerIndex = answerMappings[questionId].correctAnswerShuffled;
    }
    
    // Store answer (in shuffled position if randomized)
    userAnswers[questionId] = selectedIndex;
    
    // Check if correct
    const isCorrect = selectedIndex === correctAnswerIndex;
    
    // Update score
    if (isCorrect) {
        score.correct++;
    } else {
        // Track incorrect question
        const labels = ['A', 'B', 'C', 'D'];
        let correctAnswerLabel = labels[correctAnswerIndex];
        let userAnswerLabel = labels[selectedIndex];
        
        // Get original answer text if shuffled
        let correctAnswerText = question.answers[question.correctAnswer];
        let userAnswerText = question.answers[selectedIndex];
        
        if (randomizeAnswersCheckbox.checked && answerMappings[questionId]) {
            const mapping = answerMappings[questionId];
            const originalCorrectIdx = mapping.shuffledToOriginal[correctAnswerIndex];
            const originalUserIdx = mapping.shuffledToOriginal[selectedIndex];
            correctAnswerText = question.answers[originalCorrectIdx];
            userAnswerText = question.answers[originalUserIdx];
        }
        
        incorrectQuestions.push({
            question: question.question,
            questionId: questionId,
            userAnswer: userAnswerLabel,
            userAnswerText: userAnswerText,
            correctAnswer: correctAnswerLabel,
            correctAnswerText: correctAnswerText,
            allAnswers: question.answers,
            image: question.image
        });
    }
    score.total++;
    
    // Auto-save progress
    saveProgress();
    
    // Show feedback (use shuffled index for display)
    showFeedback(isCorrect, correctAnswerIndex);
    
    // Update button styles
    answerButtons.forEach((btn, idx) => {
        btn.disabled = true;
        if (idx === selectedIndex) {
            btn.classList.add('selected');
            btn.classList.add(isCorrect ? 'correct' : 'incorrect');
        }
        if (idx === correctAnswerIndex && !isCorrect) {
            btn.classList.add('correct');
        }
    });
    
    updateScoreDisplay();
    
    // In rapid fire mode, automatically move to next question after a short delay
    if (isRapidFire) {
        setTimeout(() => {
            getNextRapidFireQuestion();
        }, 1500); // 1.5 second delay to see feedback
    } else {
        updateNavigationButtons();
    }
}

// Show feedback
function showFeedback(isCorrect, correctAnswerIndex) {
    feedback.style.display = 'block';
    feedback.className = 'feedback ' + (isCorrect ? 'correct' : 'incorrect');
    
    const labels = ['A', 'B', 'C', 'D'];
    if (isCorrect) {
        feedback.textContent = '✓ Correct!';
    } else {
        feedback.textContent = `✗ Incorrect. The correct answer is ${labels[correctAnswerIndex]}.`;
    }
}

// Update progress
function updateProgress() {
    if (isRapidFire) {
        progressFill.style.width = '100%';
        questionNumber.textContent = `Rapid Fire - Question ${score.total + 1}`;
    } else {
        const progress = ((currentQuestionIndex + 1) / currentQuestions.length) * 100;
        progressFill.style.width = progress + '%';
        questionNumber.textContent = `Question ${currentQuestionIndex + 1} of ${currentQuestions.length}`;
    }
}

// Update score display
function updateScoreDisplay() {
    scoreDisplay.textContent = `Score: ${score.correct}/${score.total}`;
}

// Update navigation buttons
function updateNavigationButtons() {
    if (isRapidFire) {
        prevButton.style.display = 'none';
        nextButton.style.display = 'none';
        finishButton.style.display = 'none';
        endRapidFireButton.style.display = 'inline-block';
        return;
    }
    
    prevButton.style.display = 'inline-block';
    nextButton.style.display = 'inline-block';
    endRapidFireButton.style.display = 'none';
    prevButton.disabled = currentQuestionIndex === 0;
    
    const question = currentQuestions[currentQuestionIndex];
    const questionId = question.id || currentQuestionIndex;
    const isAnswered = userAnswers[questionId] !== undefined;
    
    if (currentQuestionIndex === currentQuestions.length - 1) {
        nextButton.style.display = 'none';
        finishButton.style.display = isAnswered ? 'inline-block' : 'none';
    } else {
        nextButton.style.display = 'inline-block';
        finishButton.style.display = 'none';
    }
}

// Go to previous question
function goToPreviousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
        updateNavigationButtons();
        saveProgress();
    }
}

// Go to next question
function goToNextQuestion() {
    const question = currentQuestions[currentQuestionIndex];
    const questionId = question.id || currentQuestionIndex;
    
    // Check if current question is answered
    if (userAnswers[questionId] === undefined) {
        alert('Please select an answer before proceeding.');
        return;
    }
    
    if (currentQuestionIndex < currentQuestions.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
        updateNavigationButtons();
        saveProgress();
    }
}

// Finish quiz
function finishQuiz() {
    // Check if all questions are answered
    const unanswered = currentQuestions.filter((q, idx) => {
        const questionId = q.id || idx;
        return userAnswers[questionId] === undefined;
    });
    
    if (unanswered.length > 0) {
        if (!confirm(`You have ${unanswered.length} unanswered question(s). Finish anyway?`)) {
            return;
        }
    }
    
    showResults();
}

// Show results
function showResults() {
    quizSection.style.display = 'none';
    resultsSection.style.display = 'block';
    
    const total = isRapidFire ? score.total : currentQuestions.length;
    const correct = score.correct;
    const incorrect = total - correct;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    
    document.getElementById('total-questions').textContent = total;
    document.getElementById('correct-answers').textContent = correct;
    document.getElementById('incorrect-answers').textContent = incorrect;
    document.getElementById('percentage-score').textContent = percentage + '%';
    
    // Display incorrect questions
    displayIncorrectQuestions();
}

function displayIncorrectQuestions() {
    if (incorrectQuestions.length === 0) {
        incorrectQuestionsSection.style.display = 'none';
        return;
    }
    
    incorrectQuestionsSection.style.display = 'block';
    incorrectQuestionsList.innerHTML = '';
    
    incorrectQuestions.forEach((item, idx) => {
        const questionCard = document.createElement('div');
        questionCard.className = 'incorrect-question-card';
        questionCard.style.cssText = 'margin-bottom: 20px; padding: 20px; background: #fff3cd; border: 2px solid #ffc107; border-radius: 10px;';
        
        let imageHtml = '';
        if (item.image) {
            imageHtml = `<div style="text-align: center; margin-bottom: 15px;"><img src="${item.image}" alt="Question diagram" style="max-width: 100%; max-height: 300px; border-radius: 8px;" /></div>`;
        }
        
        questionCard.innerHTML = `
            <div style="font-weight: bold; color: #856404; margin-bottom: 10px; font-size: 1.1em;">
                Question ${idx + 1}
            </div>
            ${imageHtml}
            <div style="margin-bottom: 15px; font-size: 1.05em; line-height: 1.6;">
                ${item.question}
            </div>
            <div style="background: #f8d7da; padding: 12px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #dc3545;">
                <strong style="color: #721c24;">❌ Your Answer:</strong> <span style="color: #721c24;">${item.userAnswer}) ${item.userAnswerText}</span>
            </div>
            <div style="background: #d4edda; padding: 12px; border-radius: 8px; border-left: 4px solid #28a745;">
                <strong style="color: #155724;">✓ Correct Answer:</strong> <span style="color: #155724;">${item.correctAnswer}) ${item.correctAnswerText}</span>
            </div>
        `;
        
        incorrectQuestionsList.appendChild(questionCard);
    });
}

// Rapid Fire Functions
function startRapidFire() {
    if (allQuestions.length === 0) {
        alert('No questions available. Please load a questions file.');
        return;
    }
    
    isRapidFire = true;
    rapidFireQuestions = [...allQuestions];
    rapidFireAnswered = new Set();
    incorrectQuestions = [];
    currentQuestionIndex = 0;
    userAnswers = {};
    score = { correct: 0, total: 0 };
    answerMappings = {};
    
    uploadSection.style.display = 'none';
    quizSection.style.display = 'block';
    resultsSection.style.display = 'none';
    
    getNextRapidFireQuestion();
    updateNavigationButtons();
}

function getNextRapidFireQuestion() {
    // Filter out questions that have already been shown
    const availableQuestions = rapidFireQuestions.filter(q => {
        const qId = q.id || rapidFireQuestions.indexOf(q);
        return !rapidFireAnswered.has(qId);
    });
    
    // If all questions have been shown, reset the set
    if (availableQuestions.length === 0) {
        rapidFireAnswered.clear();
        availableQuestions.push(...rapidFireQuestions);
    }
    
    // Randomly select a question
    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const selectedQuestion = availableQuestions[randomIndex];
    const questionId = selectedQuestion.id || rapidFireQuestions.indexOf(selectedQuestion);
    
    // Mark as answered
    rapidFireAnswered.add(questionId);
    
    // Set as current question
    currentQuestions = [selectedQuestion];
    currentQuestionIndex = 0;
    
    // Display the question
    displayQuestion();
    updateScoreDisplay();
}

function endRapidFire() {
    if (score.total === 0) {
        if (!confirm('You haven\'t answered any questions yet. End rapid fire anyway?')) {
            return;
        }
    }
    
    isRapidFire = false;
    showResults();
}

// Restart quiz
function restartQuiz() {
    resultsSection.style.display = 'none';
    uploadSection.style.display = 'block';
    fileInput.value = '';
    
    // Check if questions are saved
    checkForSavedData();
    
    // Reset current quiz state but keep saved questions
    currentQuestionIndex = 0;
    userAnswers = {};
    score = { correct: 0, total: 0 };
    currentQuestions = [];
    
    // Clear progress but keep questions
    localStorage.removeItem('quizProgress');
}

// Review answers
function reviewAnswers() {
    resultsSection.style.display = 'none';
    quizSection.style.display = 'block';
    currentQuestionIndex = 0;
    displayQuestion();
    updateNavigationButtons();
}

