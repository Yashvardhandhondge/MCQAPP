const createError = require('http-errors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getModelBySubject } = require('../models/Mcq');

// Initialize Gemini AI (use GEMINI_API_KEY in .env for your Gemini Pro key)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSyCTxDNDVrGUQbmb1FFnScnSEHudQfQNJ_o');

/**
 * Remove markdown syntax from text for better user experience
 */
function removeMarkdownSyntax(text) {
  if (!text) return text;
  
  let cleaned = text;
  
  // Remove code blocks (```code```)
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
  
  // Remove inline code (`code`)
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
  
  // Remove bold/italic markers (**text**, *text*, __text__, _text_)
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1'); // **bold**
  cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1'); // *italic*
  cleaned = cleaned.replace(/__([^_]+)__/g, '$1'); // __bold__
  cleaned = cleaned.replace(/_([^_]+)_/g, '$1'); // _italic_
  
  // Remove headers (# Header, ## Header, etc.)
  cleaned = cleaned.replace(/^#{1,6}\s+(.+)$/gm, '$1');
  
  // Remove links [text](url) -> text
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
  
  // Remove images ![alt](url)
  cleaned = cleaned.replace(/!\[([^\]]*)\]\([^\)]+\)/g, '');
  
  // Remove horizontal rules (---, ***)
  cleaned = cleaned.replace(/^[-*]{3,}$/gm, '');
  
  // Remove blockquotes (> text)
  cleaned = cleaned.replace(/^>\s+(.+)$/gm, '$1');
  
  // Remove strikethrough (~~text~~)
  cleaned = cleaned.replace(/~~([^~]+)~~/g, '$1');
  
  // Keep LaTeX math ($...$ and $$...$$) and \boxed{} - frontend MathText needs them for rendering

  // Clean up extra whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n'); // Max 2 newlines
  cleaned = cleaned.replace(/[ \t]+/g, ' '); // Multiple spaces to single
  cleaned = cleaned.trim();
  
  return cleaned;
}

/**
 * Get or generate solution for a question
 * GET /api/mcq/questions/:questionId/solution
 */
const getQuestionSolution = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const userId = req.user._id;

    if (!questionId) {
      return next(createError(400, 'Question ID is required'));
    }

    // Try to find the question across all subject collections
    const subjects = ['Chemistry', 'Physics', 'Maths', 'Biology'];
    let question = null;
    let questionModel = null;

    for (const subject of subjects) {
      try {
        const Model = getModelBySubject(subject);
        const found = await Model.findById(questionId).lean();
        if (found) {
          question = found;
          questionModel = Model;
          break;
        }
      } catch (error) {
        // Continue searching in other collections
        continue;
      }
    }

    if (!question) {
      return next(createError(404, 'Question not found'));
    }

    // If solution already exists, return it immediately
    if (question.solution && question.solution.trim().length > 0) {
      return res.status(200).json({
        success: true,
        data: {
          solution: question.solution,
          fromCache: true,
        },
      });
    }

    // Generate solution using Gemini AI (only when not in DB) — free Flash model only
    try {
      const modelName = 'gemini-2.5-flash';
      const model = genAI.getGenerativeModel({ model: modelName });

      const systemPrompt = 'You are an AI helping students with MCQ solutions. Give SHORT, direct answers only.\n\n' +
        'STRICT LENGTH RULES:\n' +
        '- Maximum 2 to 4 sentences. Answer only what the question needs.\n' +
        '- No long paragraphs, no extra theory, no repetition.\n' +
        '- For simple MCQs: one short reason why the correct option is right.\n' +
        '- For math: only the essential steps in brief; use LaTeX for formulas.\n\n' +
        'MATH FORMATTING (for Maths subject):\n' +
        '- Use LaTeX so our app can render it: inline math in $...$ (e.g. $x^2$, $\\frac{a}{b}$), display math in $$...$$ for key steps (e.g. $$\\int_0^1 x\\,dx = \\frac{1}{2}$$).\n' +
        '- Use \\frac{}{}, \\sqrt{}, \\int, \\sum, etc. for fractions, roots, integrals, sums.\n' +
        '- Keep math readable and minimal—only what is needed for the solution.\n\n' +
        'OTHER FORMATTING:\n' +
        '- No markdown (no **, *, #, backticks, [](url)). Plain text only.\n' +
        '- Line breaks for steps are fine; no code blocks or bold/italic.';

      const userPrompt = `Question: ${question.question}

Options:
${question.options.map((opt, idx) => `${idx + 1}. ${opt}`).join('\n')}

Correct Answer: ${question.correctanswrs}

Subject: ${question.subject}
Chapter: ${question.chapter}

Give a short, direct explanation (2–4 sentences max) of why this answer is correct. For math, use LaTeX in $...$ or $$...$$.`;

      const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
      
      console.log('Calling Gemini API for question:', questionId);
      console.log('Question subject:', question.subject);
      console.log('Using model:', modelName);
      
      const result = await model.generateContent(fullPrompt);
      const response = result.response;
      
      // Get text from response
      let solution = response.text();
      
      // Remove markdown syntax for better user experience
      solution = removeMarkdownSyntax(solution);
      
      // Clean up the solution text
      solution = solution.trim();

      if (!solution || solution.length === 0) {
        throw new Error('Empty solution received from Gemini API');
      }
      
      console.log('Solution generated successfully, length:', solution.length);

      // Save the solution to the database
      if (questionModel && solution && solution.trim().length > 0) {
        await questionModel.findByIdAndUpdate(questionId, {
          $set: { solution: solution.trim() },
        });
        console.log('Solution saved to database for question:', questionId);
      }

      return res.status(200).json({
        success: true,
        data: {
          solution: solution.trim(),
          fromCache: false,
        },
      });
    } catch (geminiError) {
      console.error('Error calling Gemini API:', geminiError);
      console.error('Error details:', {
        message: geminiError.message,
        stack: geminiError.stack,
        name: geminiError.name,
      });
      
      // Provide more specific error message
      const errorMessage = geminiError.message || 'Unknown error';
      return next(createError(500, `Failed to generate solution: ${errorMessage}`));
    }
  } catch (error) {
    console.error('Error getting question solution:', error);
    return next(createError(500, 'Failed to fetch solution'));
  }
};

module.exports = {
  getQuestionSolution,
};

