// 檔案路徑： /api/generate.ts
import OpenAI from 'openai';

interface ApiRequest {
  method?: string;
  body: {
    name?: string;
    scenery?: string;
    concept?: string;
  };
}

interface ApiResponse {
  status: (code: number) => {
    json: (data: unknown) => unknown;
  };
}

// 初始化 OpenAI 客戶端 (會自動讀取 process.env.OPENAI_API_KEY)
const openai = new OpenAI();

// 結合侘寂美學與浪漫主義，並強制輸出 JSON 陣列結構的 System Prompt
const SYSTEM_PROMPT = `
# System Role
你是一位深諳東方道家思想、侘寂（Wabi-Sabi）美學，以及英國古典浪漫主義文學的雙語詩人與哲學大師。你擅長從微觀的自然生態與靜謐的風景中，體悟出從容不迫的生命哲理，並能將中文名字的意境，轉譯為極具畫面感與靈性的中英雙語詩歌。

# Task
根據使用者提供的 [中文名字]、[意境主題] 與 [核心概念]，進行哲學解構，並創作專屬的禪意詩。

# Rules
1. 元素解構 (Elements): 從意境與名字中，精煉出兩個最具代表性的自然元素（例如：Water & Stone, Wind & Sand）。
2. 哲學隱喻 (Philosophy): 用 2-3 句英文解釋這個名字背後的人生哲理。語氣必須平靜、抽離、富有侘寂之美。
3. 中文原創詩 (Chinese Poetry): 創作兩句原創的中文詩（必須嚴格遵守五言或七言對仗），意境需空靈深遠。
4. 英文轉譯詩 (English Translation): 將中文詩轉譯為兩行英文詩。必須具備極高的文學性（Poetic）、押韻（Rhyming），並以意譯為主。

# Strict Output Format
你必須嚴格回傳一個純 JSON 格式的物件。絕對不可以輸出任何解釋文字。
請特別注意：所有的詩句與元素，都必須以「陣列 (Array)」的格式回傳，方便前端排版。
JSON 結構如下：
{
  "deconstruction": {
    "elements": ["Element 1", "Element 2"],
    "philosophy": "[Your philosophical interpretation in English]"
  },
  "poetry": {
    "chinese": ["第一句中文詩", "第二句中文詩"],
    "english": ["First line in English", "Second line in English"]
  }
}
`;

// Vercel Serverless Function 的標準寫法
export default async function handler(req: ApiRequest, res: ApiResponse) {
  // 1. 安全性檢查：只允許 POST 請求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Please use POST.' });
  }

  try {
    // 2. 從前端的請求中取出參數
    const { name, scenery, concept } = req.body;

    if (!name || !scenery || !concept) {
      return res.status(400).json({ error: 'Missing required fields: name, scenery, or concept.' });
    }

    // 3. 組合 User 傳入的具體任務
    const userMessage = `
      - Name (中文名字): ${name}
      - Scenery (意境主題): ${scenery}
      - Concept (核心概念): ${concept}
    `;

    // 4. 呼叫 OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // 速度極快且便宜的模型
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage }
      ],
      // 強制 AI 輸出 JSON 格式 (這是保證後端不會壞掉的關鍵！)
      response_format: { type: 'json_object' }, 
      temperature: 0.7, // 給予一點點創造力，但保持穩定
    });

    // 5. 取得 AI 的回覆並解析 JSON
    const aiResponseContent = completion.choices[0].message.content;
    
    if (!aiResponseContent) {
      throw new Error("AI returned empty response.");
    }

    const resultData = JSON.parse(aiResponseContent);

    // 6. 將完美的 JSON 資料回傳給前端
    return res.status(200).json(resultData);

  } catch (error) {
    console.error('AI Generation Error:', error);
    return res.status(500).json({ error: 'Failed to generate Zen Identity.' });
  }
}
