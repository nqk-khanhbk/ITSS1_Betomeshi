const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// POST /api/generate
router.post("/generate", async (req, res, next) => {
  console.log("Received /generate request with body:", req.body);
  try {
    const { dish } = req.body;

    if (!dish) {
      return res.status(400).json({ message: "Missing dish name" });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
    });

    const prompt = `
あなたは日本語を教える先生です。ベトナム人の留学生が、ベトナム料理について日本語で紹介します。

料理名: ${dish}

以下のルールで、留学生と先生の自然な会話を作成してください：

【会話の要件】
- 留学生が主体的に料理を紹介し、先生が聞き手となる
- 短いメッセージを交互にやり取り（Slackのようなチャットスタイル）
- 日本語レベル：N3～N2
- 丁寧で自然な会話

【役割】
- 学生：料理を積極的に紹介する（歴史、材料、作り方、特徴などを説明）
- 先生：聞き手として自然に反応し、短い質問で話を促す
  例：「そうなんですね」「なるほど」「それはどんな味ですか？」
  必要に応じて、より丁寧な言い方を提案する

【会話の内容（学生が順番に紹介すること）】
1. 料理の歴史と起源
2. 主な材料・成分
3. 作り方や特徴
4. 日本料理との比較
5. 先生に丁寧に紹介する表現の練習

【会話後の補足】
- 難しい語彙のリスト（日本語、読み方、ベトナム語の意味）
- 使用した重要な文法パターン（日本語、ベトナム語説明、会話からの例）

出力は必ず次のJSON形式のみで返してください：

{
  "messages": [
    {"role": "student", "text": "先生、今日は${dish}について紹介したいと思います。"},
    {"role": "teacher", "text": "いいですね。ぜひ教えてください。"}
  ],
  "vocabulary": [
    {"word": "代表的", "reading": "だいひょうてき", "meaning": "tiêu biểu, đại diện"}
  ],
  "grammar": [
    {"pattern": "〜と思います", "explanation": "Mẫu câu thể hiện ý kiến, dự định", "example": "紹介したいと思います"}
  ]
}

他の説明や補足は一切書かないでください。JSONのみを返してください。
`;

    // Gọi API Gemini
    const result = await model.generateContent(prompt);
    const raw = result.response.text();

    // Làm sạch output của Gemini (loại bỏ ```json ... ```)
    let clean = raw
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let data;

    try {
      data = JSON.parse(clean);
    } catch (err) {
      console.error("JSON parse error:", err);
      return res.status(500).json({
        error: "Model did not return valid JSON",
        rawOutput: raw,
        cleanedOutput: clean,
      });
    }

    // Trả JSON sạch về frontend
    res.json({
      messages: data.messages || [],
      vocabulary: data.vocabulary || [],
      grammar: data.grammar || [],
    });


  } catch (err) {
    console.error("Gemini Error:", err);

    // Handle rate limiting error
    if (err.status === 429 || err.message?.includes('429') || err.message?.includes('quota')) {
      return res.status(429).json({
        error: "Rate limit exceeded",
        message: "Gemini APIのリクエスト制限に達しました。しばらく待ってから再試行してください。",
        retryAfter: 60
      });
    }

    // Handle other API errors
    if (err.status) {
      return res.status(err.status).json({
        error: err.message || "API error occurred",
        message: "APIエラーが発生しました。"
      });
    }

    next(err);
  }
});

module.exports = router;
