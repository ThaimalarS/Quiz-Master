from flask import Flask, render_template, jsonify, request
import json
from pathlib import Path

app = Flask(__name__)

# Load JSON questions
def load_questions():
    file_path = Path(__file__).with_name("questions.json")

    with open(file_path, "r", encoding="utf-8") as file:
        return json.load(file)


# Home page
@app.route("/")
def home():
    return render_template("index.html")


# Send questions to JavaScript
@app.route("/api/questions")
def get_questions():

    questions = load_questions()

    public_questions = []

    for q in questions:
        public_questions.append({
            "id": q["id"],
            "question": q["question"],
            "options": q["options"]
        })

    return jsonify(public_questions)


# Check answers
@app.route("/api/submit", methods=["POST"])
def submit_quiz():

    data = request.get_json()

    answers = data.get("answers", {})

    questions = load_questions()

    score = 0
    review = []

    for q in questions:

        selected = answers.get(str(q["id"]))

        correct = selected == q["answer"]

        if correct:
            score += 1

        review.append({
            "id": q["id"],
            "question": q["question"],
            "selected": selected,
            "correct": q["answer"],
            "is_correct": correct,
            "explanation": q["explanation"]
        })

    percentage = (score / len(questions)) * 100 if questions else 0

    return jsonify({
        "score": score,
        "total": len(questions),
        "percentage": round(percentage, 1),
        "review": review
    })


if __name__ == "__main__":
    app.run(debug=True)