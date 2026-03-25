import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import wordsRoutes from './routes/words';
import statsRoutes from './routes/stats';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/words', wordsRoutes);
app.use('/api/stats', statsRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Backend is running at http://localhost:${port}`);
});
