# IB Sports Exercise Health Sciences Quiz App

A simple, easy-to-use quiz application for practicing IB Sports Exercise Health Sciences Paper 1 exam questions.

## 🚀 Getting Started (No Coding Required!)

### Step 1: Open the Quiz App
1. Navigate to the folder containing these files
2. Double-click on `index.html`
3. The quiz app will open in your web browser

That's it! No installation needed.

## 📝 How to Use

### Loading Your Questions

1. **Prepare your questions file** (see format below)
2. Click the "Choose Questions File (JSON)" button
3. Select your JSON file containing the questions
4. The app will load your questions automatically

### Quiz Modes

**All Questions Mode:**
- Practice all questions from all exams at once
- Great for comprehensive review

**Individual Exam Mode:**
- Select a specific exam from the dropdown menu
- Practice questions from one exam at a time

### Taking the Quiz

1. Read the question carefully
2. If there's an image, it will appear above the question
3. Click on one of the four answer choices (A, B, C, or D)
4. You'll immediately see if your answer is correct or incorrect
5. The correct answer will be highlighted in green
6. Use "Previous" and "Next Question" buttons to navigate
7. Click "Finish Quiz" when you're done

### Viewing Results

After finishing, you'll see:
- Total number of questions
- Number of correct answers
- Number of incorrect answers
- Your percentage score

You can then:
- Start a new quiz
- Review your answers

## 📋 Question File Format

Your questions need to be in JSON format. Here's how to structure them:

### Option 1: Multiple Exams (Recommended)

```json
{
  "exams": [
    {
      "name": "May 2023 Paper 1",
      "questions": [
        {
          "question": "Your question text here?",
          "answers": [
            "Answer choice A",
            "Answer choice B",
            "Answer choice C",
            "Answer choice D"
          ],
          "correctAnswer": 0,
          "image": null
        }
      ]
    }
  ]
}
```

**Important Notes:**
- `correctAnswer` must be a number: 0 for A, 1 for B, 2 for C, 3 for D
- `image` can be:
  - `null` if there's no image
  - A file path like `"images/question1.png"` (place images in the same folder)
  - A full URL like `"https://example.com/image.jpg"`
  - A base64 encoded image (advanced)

### Option 2: Simple Array (Single Exam)

```json
[
  {
    "question": "Your question text here?",
    "answers": [
      "Answer choice A",
      "Answer choice B",
      "Answer choice C",
      "Answer choice D"
    ],
    "correctAnswer": 0,
    "image": null
  }
]
```

## 🖼️ Adding Images to Questions

### Method 1: Local Image Files (Easiest)

1. Create a folder called `images` in the same directory as your HTML file
2. Place your image files in that folder
3. In your JSON file, set the image path:
   ```json
   "image": "images/diagram1.png"
   ```

### Method 2: Same Folder

If images are in the same folder as your HTML file:
```json
"image": "diagram1.png"
```

### Method 3: Online Images

Use a full URL:
```json
"image": "https://example.com/diagram.jpg"
```

## 📝 Creating Your Question File

### Using a Text Editor

1. Open a text editor (Notepad on Windows, TextEdit on Mac)
2. Copy the sample format from `sample-questions.json`
3. Replace with your own questions
4. Save as a `.json` file (e.g., `my-questions.json`)

### Using Online JSON Editors

You can use online tools like:
- JSON Editor Online (jsoneditoronline.org)
- JSON Formatter (jsonformatter.org)

These tools help you:
- Format your JSON correctly
- Check for errors
- Make editing easier

### Important Rules for JSON Files

1. **Use double quotes** for all text (not single quotes)
2. **Commas** separate items in lists
3. **No trailing commas** after the last item
4. **Brackets** `[]` for arrays/lists
5. **Braces** `{}` for objects
6. **Numbers** don't need quotes

### Common Mistakes to Avoid

❌ Wrong:
```json
{
  'question': 'What is...?',  // Single quotes
  "correctAnswer": "0",        // Number in quotes
  "answers": ["A", "B", "C", "D",],  // Trailing comma
}
```

✅ Correct:
```json
{
  "question": "What is...?",
  "correctAnswer": 0,
  "answers": ["A", "B", "C", "D"]
}
```

## 💡 Tips

1. **Start Small**: Create a test file with 2-3 questions first to make sure everything works
2. **Use the Sample**: Look at `sample-questions.json` as a reference
3. **Validate JSON**: Use an online JSON validator before loading large files
4. **Organize by Exam**: Use the "exams" format to keep different papers organized
5. **Image Names**: Use simple, descriptive names for image files (avoid spaces, use hyphens)

## 🐛 Troubleshooting

**"Error loading file" message:**
- Check that your JSON is valid (use a JSON validator)
- Make sure all questions have: `question`, `answers` (4 items), and `correctAnswer`
- Check for typos in property names

**Images not showing:**
- Make sure the image path is correct
- Check that the image file exists in the specified location
- Try using a full file path or URL

**Questions not loading:**
- Verify your JSON file is saved with `.json` extension
- Check the browser console (F12) for error messages
- Make sure the file structure matches the examples

## 📁 File Structure

Your folder should look like this:
```
quiz-app/
├── index.html
├── style.css
├── script.js
├── sample-questions.json
├── your-questions.json
└── images/          (optional)
    ├── diagram1.png
    └── diagram2.jpg
```

## 🎯 Features

✅ Multiple choice questions (4 options)
✅ Image support for diagrams
✅ Instant feedback on answers
✅ Progress tracking
✅ Score calculation
✅ Multiple exam support
✅ Review mode
✅ No internet required (works offline)
✅ No installation needed

## 📚 Example Question Structure

Here's a complete example of a question with an image:

```json
{
  "question": "Identify the muscle labeled X in the diagram.",
  "answers": [
    "Biceps brachii",
    "Triceps brachii",
    "Deltoid",
    "Pectoralis major"
  ],
  "correctAnswer": 1,
  "image": "images/muscle-diagram.png"
}
```

## 🆘 Need Help?

If you're having trouble:
1. Check the sample file (`sample-questions.json`) for reference
2. Use an online JSON validator to check your file
3. Start with a simple file (2-3 questions) to test
4. Make sure all required fields are present in each question

---

**Good luck with your IB Sports Exercise Health Sciences exam preparation!** 🎓

