const createError = require('http-errors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getModelBySubject } = require('../models/Mcq');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSyAIEd-a6TmTlKZ6cTu8NV7rHNAoV01QHRc');

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
  
  // Remove LaTeX math blocks ($...$ and $$...$$)
  cleaned = cleaned.replace(/\$\$[\s\S]*?\$\$/g, '');
  cleaned = cleaned.replace(/\$([^$]+)\$/g, '$1');
  
  // Remove boxed answers (\boxed{...})
  cleaned = cleaned.replace(/\\boxed\{([^}]+)\}/g, '$1');
  
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

    // Generate solution using Gemini AI
    try {
      // Try gemini-2.5-flash first (newest model), then fallback to others
      const modelNames = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
      let model = null;
      let modelUsed = null;
      
      for (const modelName of modelNames) {
        try {
          model = genAI.getGenerativeModel({ model: modelName });
          modelUsed = modelName;
          console.log(`Successfully initialized model: ${modelName}`);
          break;
        } catch (modelError) {
          console.log(`Model ${modelName} not available: ${modelError.message}`);
          continue;
        }
      }
      
      if (!model) {
        throw new Error('No available Gemini models. Please check your API key and model availability.');
      }

      const systemPrompt = 'You are an advanced AI helping students prepare to crack 2026 exams. Your task is to provide clear, concise, and educational explanations for multiple-choice questions.\n\n' +
        'IMPORTANT FORMATTING RULES:\n' +
        '- DO NOT use any markdown syntax (no asterisks, underscores, backticks, hash symbols, square brackets, etc.)\n' +
        '- Write in plain text only\n' +
        '- Use simple formatting: line breaks for paragraphs, numbers for lists\n' +
        '- Do not use code blocks, bold, italic, or any special formatting\n' +
        '- Write naturally as if explaining to a student in person\n\n' +
        'Guidelines:\n' +
        '- Explain why the correct answer is correct\n' +
        '- Provide step-by-step reasoning when applicable\n' +
        '- Keep explanations focused and relevant\n' +
        '- Use clear language suitable for exam preparation\n' +
        '- Highlight key concepts and principles involved\n' +
        '- Use plain text formatting only';

      const userPrompt = `Question: ${question.question}

Options:
${question.options.map((opt, idx) => `${idx + 1}. ${opt}`).join('\n')}

Correct Answer: ${question.correctanswrs}

Subject: ${question.subject}
Chapter: ${question.chapter}

Please provide a clear explanation of why this answer is correct and how to solve this question.`;

      const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
      
      console.log('Calling Gemini API for question:', questionId);
      console.log('Question subject:', question.subject);
      console.log('Using model:', modelUsed);
      
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

