import { Router } from 'express';
import prisma from '../prisma';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Get user statistics
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const now = new Date();

    const totalStudied = await prisma.userWordState.count({
      where: { userId }
    });

    const reviewsPending = await prisma.userWordState.count({
      where: {
        userId,
        nextReviewDate: { lte: now }
      }
    });

    const correctCount = await prisma.userWordState.count({
      where: { userId, status: 'CORRECT' }
    });

    const incorrectCount = await prisma.userWordState.count({
      where: { userId, status: 'INCORRECT' } // Currently on 1-7-30 cycle
    });

    // Return all user words so the frontend can filter and scroll
    const allWords = await prisma.userWordState.findMany({
      where: { userId },
      orderBy: { lastReviewedAt: 'desc' },
      include: { word: true }
    });

    res.json({
      totalStudied,
      reviewsPending,
      correctCount,
      incorrectCount,
      allWords
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;
