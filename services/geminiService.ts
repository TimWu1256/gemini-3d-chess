import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getBestMove = async (fen: string, validMoves: string[]): Promise<string> => {
  try {
    const prompt = `
      You are a chess grandmaster engine.
      The current board state in FEN notation is: "${fen}".
      The list of valid moves (in algebraic notation or SAN) is: ${validMoves.join(', ')}.

      Analyze the position and select the absolute best strategic move to win the game.
      Return ONLY the move in standard algebraic notation (SAN) or UCI format (e.g., "e4" or "e2e4", "Nf3").
      Do not add any explanation, numbering, or punctuation. Just the move string.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.1, // Low temperature for more deterministic/logic-based responses
      }
    });

    const moveText = response.text?.trim();
    if (!moveText) {
      throw new Error("No move generated");
    }

    // Basic cleaning in case the model adds extra text
    const cleanMove = moveText.split(/\s+/)[0].replace('.', '');
    return cleanMove;

  } catch (error) {
    console.error("Error fetching move from Gemini:", error);
    // Fallback: Return a random move if AI fails to prevent crash
    const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
    return randomMove;
  }
};
