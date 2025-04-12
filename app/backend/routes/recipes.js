const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const auth = require('../middleware/auth');

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// Generate recipe based on ingredients
router.post('/generate', auth, async (req, res) => {
  try {
    const { ingredients } = req.body;

    if (!ingredients) {
      return res.status(400).json({
        success: false,
        message: 'Please provide ingredients',
      });
    }

    const prompt = `Create a healthy recipe using these ingredients: ${ingredients}.
    Please provide the recipe in the following JSON format:
    {
      "title": "Recipe Title",
      "description": "Brief description of the recipe",
      "ingredients": ["list of ingredients with quantities"],
      "instructions": ["step by step instructions"],
      "nutritionInfo": {
        "calories": number,
        "protein": "Xg",
        "carbs": "Xg",
        "fat": "Xg"
      }
    }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Attempt to parse the text response as JSON
    let recipe;
    try {
      recipe = JSON.parse(text);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', text);
      console.error('Parse Error:', parseError);
      return res.status(500).json({
        success: false,
        message: 'Failed to parse recipe data from AI. The format might be incorrect.',
        rawResponse: text,
      });
    }

    res.json({
      success: true,
      data: recipe,
    });
  } catch (error) {
    console.error('Recipe generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate recipe. Please try again.',
    });
  }
});

module.exports = router;
