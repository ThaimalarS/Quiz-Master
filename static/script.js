// ============================================
// 1. GLOBAL VARIABLES
// ============================================

let questions = [];
let currentIndex = 0;
let answers = {};


// ============================================
// 2. DOM ELEMENTS
// ============================================

const landingPage = document.getElementById("landing-page");
const quizPage = document.getElementById("quiz-page");

const quizPanel = document.getElementById("quiz-panel");
const resultPanel = document.getElementById("result-panel");

const questionText = document.getElementById("question-text");
const questionNumber = document.getElementById("question-number");
const questionCount = document.getElementById("question-count");

const optionsContainer = document.getElementById("options");

const progressBar = document.getElementById("progress-bar");

const previousBtn = document.getElementById("previous-btn");
const nextBtn = document.getElementById("next-btn");
const submitBtn = document.getElementById("submit-btn");
const restartBtn = document.getElementById("restart-btn");

const message = document.getElementById("message");
const scorePreview = document.getElementById("score-preview");


// ============================================
// 3. START QUIZ
// ============================================

async function startQuiz() {

    landingPage.classList.add("hidden");
    quizPage.classList.remove("hidden");

    window.scrollTo(0, 0);

    quizPanel.classList.remove("hidden");
    resultPanel.classList.add("hidden");

    if (questions.length === 0) {
        await loadQuiz();
    } else {
        displayQuestion();
    }
}


// ============================================
// 4. LOAD QUESTIONS FROM FLASK
// ============================================

async function loadQuiz() {

    try {

        questionText.textContent = "Loading questions...";

        const response = await fetch("/api/questions");

        if (!response.ok) {
            throw new Error("Unable to load questions");
        }

        questions = await response.json();

        if (!Array.isArray(questions) || questions.length === 0) {
            throw new Error("No questions available");
        }

        currentIndex = 0;
        answers = {};

        displayQuestion();

    } catch (error) {

        console.error(error);

        questionText.textContent =
            "Unable to load questions. Please refresh and try again.";

    }
}


// ============================================
// 5. DISPLAY QUESTION
// ============================================

function displayQuestion() {

    const question = questions[currentIndex];

    if (!question) return;

    // Question text

    questionText.textContent = question.question;

    // Question number

    questionNumber.textContent =
        `QUESTION ${String(currentIndex + 1).padStart(2, "0")}`;

    questionCount.textContent =
        `Question ${currentIndex + 1} of ${questions.length}`;


    // Progress bar

    const progress =
        ((currentIndex + 1) / questions.length) * 100;

    progressBar.style.width = `${progress}%`;


    // Clear previous options

    optionsContainer.innerHTML = "";

    // Display options

    question.options.forEach((option, index) => {

        const button = document.createElement("button");

        button.className = "option";

        button.textContent =
            `${String.fromCharCode(65 + index)}. ${option}`;

        // Restore selected answer

        if (answers[currentIndex] === index) {
            button.classList.add("selected");
        }

        button.addEventListener("click", () => {
            selectAnswer(index);
        });

        optionsContainer.appendChild(button);

    });


    // Navigation buttons

    previousBtn.disabled = currentIndex === 0;

    if (currentIndex === questions.length - 1) {

        nextBtn.classList.add("hidden");
        submitBtn.classList.remove("hidden");

    } else {

        nextBtn.classList.remove("hidden");
        submitBtn.classList.add("hidden");

    }


    // Answer counter

    const answeredCount = Object.keys(answers).length;

    scorePreview.textContent =
        `Answered: ${answeredCount} / ${questions.length}`;

    message.textContent = "";

}


// ============================================
// 6. SELECT ANSWER
// ============================================

function selectAnswer(selectedIndex) {

    answers[currentIndex] = selectedIndex;

    displayQuestion();

}


// ============================================
// 7. NEXT QUESTION
// ============================================

nextBtn.addEventListener("click", () => {

    if (currentIndex < questions.length - 1) {

        currentIndex++;

        displayQuestion();

    }

});


// ============================================
// 8. PREVIOUS QUESTION
// ============================================

previousBtn.addEventListener("click", () => {

    if (currentIndex > 0) {

        currentIndex--;

        displayQuestion();

    }

});


// ============================================
// 9. SUBMIT QUIZ
// ============================================

submitBtn.addEventListener("click", async () => {

    if (Object.keys(answers).length !== questions.length) {

        message.textContent =
            "Please answer all questions before submitting!";

        return;

    }

    const confirmSubmit = confirm(
        "Are you sure you want to submit your quiz?"
    );

    if (!confirmSubmit) return;

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    try {

        const response = await fetch("/api/submit", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                answers: answers
            })

        });

        if (!response.ok) {
            throw new Error("Submission failed");
        }

        const result = await response.json();

        showResults(result);

    } catch (error) {

        console.error(error);

        message.textContent =
            "Something went wrong. Please try again.";

    } finally {

        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Quiz ✓";

    }

});


// ============================================
// 10. SHOW RESULTS
// ============================================

function showResults(result) {

    quizPanel.classList.add("hidden");
    resultPanel.classList.remove("hidden");

    // Final score

    document.getElementById("final-score").textContent =
        `${result.score} / ${questions.length}`;

    // Result percentage

    const percentage = result.percentage ??
        (result.score / questions.length) * 100;

    let resultMessage = "";

    if (percentage >= 90) {

        resultMessage = "Outstanding! You are a Quiz Champion! 🏆";

    } else if (percentage >= 70) {

        resultMessage = "Excellent work! Keep improving! 🚀";

    } else if (percentage >= 50) {

        resultMessage = "Good effort! You are getting better! 💪";

    } else {

        resultMessage = "Keep practising. You can do better! ❤️";

    }

    document.getElementById("result-message").textContent =
        resultMessage;


    // Display answer review

    const reviewList = document.getElementById("review-list");

    reviewList.innerHTML = "";

    if (Array.isArray(result.review)) {

        result.review.forEach((item, index) => {

            const reviewItem = document.createElement("div");

            reviewItem.className = "review-item";

            const heading = document.createElement("h4");

            heading.textContent =
                `${index + 1}. ${item.question}`;

            const selected = document.createElement("p");

            selected.textContent =
                `Your answer: ${item.selected_answer ?? "Not answered"}`;

            selected.className =
                item.is_correct ? "correct" : "incorrect";

            const correct = document.createElement("p");

            correct.textContent =
                `Correct answer: ${item.correct_answer}`;

            correct.className = "correct";

            const explanation = document.createElement("p");

            explanation.textContent =
                `Explanation: ${item.explanation ?? "No explanation available."}`;

            reviewItem.appendChild(heading);
            reviewItem.appendChild(selected);
            reviewItem.appendChild(correct);
            reviewItem.appendChild(explanation);

            reviewList.appendChild(reviewItem);

        });

    }

    window.scrollTo(0, 0);

}


// ============================================
// 11. RESTART QUIZ
// ============================================

restartBtn.addEventListener("click", async () => {

    currentIndex = 0;
    answers = {};

    questions = [];

    resultPanel.classList.add("hidden");
    quizPanel.classList.remove("hidden");

    await loadQuiz();

    window.scrollTo(0, 0);

});


// ============================================
// 12. BACK TO HOME
// ============================================

function goHome() {

    quizPage.classList.add("hidden");
    landingPage.classList.remove("hidden");

    currentIndex = 0;
    answers = {};
    questions = [];

    quizPanel.classList.remove("hidden");
    resultPanel.classList.add("hidden");

    window.scrollTo(0, 0);

}