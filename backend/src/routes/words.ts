import { Router } from 'express';
import prisma from '../prisma';
import { authMiddleware } from '../middleware/authMiddleware';
import OpenAI from 'openai';

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });

// Helper for randomizing array
const shuffleArray = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// Get words
router.get('/daily', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const mode = req.query.mode as string; // 'study' or 'review'

    if (mode === 'review') {
      // Review mode: Fetch words that are scheduled for review today or earlier
      const now = new Date();
      const reviewStates = await prisma.userWordState.findMany({
        where: {
          userId,
          nextReviewDate: {
            lte: now
          }
        },
        include: { word: true }
      });

      // Filter and shuffle
      const groupedWords = reviewStates.map(state => state.word);
      const shuffled = shuffleArray(groupedWords);
      return res.json(shuffled.slice(0, 10));
    } else {
      // Study mode: Fetch new words (UNSEEN) or words user hasn't attempted yet.
      // Easiest way: words not in UserWordState for this user
      const existingStates = await prisma.userWordState.findMany({
        where: { userId },
        select: { wordId: true }
      });
      const seenWordIds = existingStates.map(s => s.wordId);

      // We have to get 10 random words from DB that are not in seenWordIds.
      const newWords = await prisma.word.findMany({
        where: {
          id: { notIn: seenWordIds }
        },
        take: 200
      });

      const shuffled = shuffleArray(newWords);
      return res.json(shuffled.slice(0, 10));
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch words' });
  }
});

// Update word state
router.post('/answer', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { wordId, isCorrect } = req.body;

    if (!wordId || isCorrect === undefined) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    const currentState = await prisma.userWordState.findUnique({
      where: { userId_wordId: { userId, wordId } }
    });

    const now = new Date();
    let nextReviewDate: Date | null = null;
    let step = currentState?.step || 0;
    let incorrectCount = currentState?.incorrectCount || 0;

    if (!isCorrect) {
      // Incorrect -> enters/restarts the 1-7-30 spaced repetition cycle
      incorrectCount += 1;
      step = 1;
      nextReviewDate = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000); // +1 day
    } else {
      // Correct
      if (!currentState || step === 0) {
        // First time see and correct -> Mastered instantly
        step = 0;
        nextReviewDate = null;
      } else if (step === 1) {
        // Was on 1-day step, now graduates to 7-day
        step = 2;
        nextReviewDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 days
      } else if (step === 2) {
        // Was on 7-day step, now graduates to 30-day
        step = 3;
        nextReviewDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 days
      } else if (step === 3) {
        // Mastered!
        step = 0;
        nextReviewDate = null;
      }
    }

    const state = await prisma.userWordState.upsert({
      where: {
        userId_wordId: { userId, wordId }
      },
      update: {
        status: isCorrect ? 'CORRECT' : 'INCORRECT',
        incorrectCount,
        step,
        nextReviewDate,
        lastReviewedAt: now
      },
      create: {
        userId,
        wordId,
        status: isCorrect ? 'CORRECT' : 'INCORRECT',
        incorrectCount,
        step,
        nextReviewDate,
        lastReviewedAt: now
      }
    });

    res.json(state);
  } catch (error) {
    res.status(500).json({ error: 'Failed to record answer' });
  }
});

// Get AI Examples
router.get('/examples/:wordId', authMiddleware, async (req, res) => {
  try {
    const wordId = parseInt(req.params.wordId as string, 10);
    const word = await prisma.word.findUnique({ where: { id: wordId } });

    if (!word) {
      return res.status(404).json({ error: 'Word not found' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    const prompt = `Lütfen "${word.word}" (anlamı: "${word.meaning}") kelimesi için aşağıdaki JSON formatına birebir uyarak veri üret.
Kurallar:
1. "sentences" dizisi içinde 3 farklı örnek İngilizce cümle ("english") ve Türkçe çevirisi ("turkish") olsun.
2. İngilizce cümlede kelimenin kendisini **kalın** yap (örn: "**${word.word}**").
3. Türkçe cümlede kelimenin çevrilmiş karşılığını **kalın** yap (örn: "**anlamı**").
4. "synonyms" dizisine 3 tane eş anlamlı İngilizce kelime ekle.
5. "antonyms" dizisine 3 tane zıt anlamlı İngilizce kelime ekle (eğer yoksa en yakın zıt anlamlıları koy).

Zorunlu JSON Formatı:
{
  "sentences": [
    { "english": "cümle", "turkish": "çeviri" }
  ],
  "synonyms": ["kelime1", "kelime2"],
  "antonyms": ["kelime1", "kelime2"]
}`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-5.4-mini",
      response_format: { type: "json_object" } // Enforce JSON
    });

    const content = completion.choices[0].message.content || '{}';
    const parsed = JSON.parse(content);

    res.json({ examples: parsed });
  } catch (error: any) {
    console.error('OpenAI Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate examples' });
  }
});

export default router;
