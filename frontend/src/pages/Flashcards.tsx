import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../lib/api';

interface Word {
  id: number;
  word: string;
  meaning: string;
}

interface AiData {
  sentences: Array<{ english: string; turkish: string }>;
  synonyms: string[];
  antonyms: string[];
}

export default function Flashcards() {
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [animatingClass, setAnimatingClass] = useState('');
  
  const [aiExamples, setAiExamples] = useState<AiData | string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const mode = queryParams.get('mode') || 'study';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchWords();
  }, [navigate]);

  const fetchWords = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/words/daily?mode=${mode}`);
      setWords(res.data);
    } catch (error) {
      console.error('Failed to fetch words', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (isCorrect: boolean) => {
    if (words.length === 0) return;
    
    const currentWord = words[currentIndex];
    
    // Set animation class
    setAnimatingClass(isCorrect ? 'swipe-right' : 'swipe-left');

    try {
      // Send answer in background
      api.post('/words/answer', { wordId: currentWord.id, isCorrect });
      
      // Wait for animation
      setTimeout(() => {
        setAnimatingClass('');
        setIsFlipped(false);
        setAiExamples(null);
        setCurrentIndex(prev => prev + 1);
      }, 500);
      
    } catch (error) {
      console.error('Failed to submit answer', error);
    }
  };

  if (loading) {
    return <div className="spinner"></div>;
  }

  if (words.length === 0 || currentIndex >= words.length) {
    return (
      <div className="fade-in glass-panel" style={{ textAlign: 'center', margin: '4rem auto', maxWidth: '500px' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Tebrikler! 🎉</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          {mode === 'review' 
            ? "Bugünlük tekrar etmen gereken tüm kelimeleri bitirdin." 
            : "Yeni kelime setini tamamladın!"}
        </p>
        <button className="btn" onClick={() => navigate('/')}>Ana Sayfaya Dön</button>
      </div>
    );
  }

  const currentWord = words[currentIndex];

  const fetchAiExamples = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (aiExamples || loadingAi) return;
    
    setLoadingAi(true);
    try {
      const res = await api.get(`/words/examples/${currentWord.id}`);
      setAiExamples(res.data.examples);
    } catch (error: any) {
      setAiExamples(error.response?.data?.error || 'Could not fetch examples.');
    } finally {
      setLoadingAi(false);
    }
  };

  const renderBoldText = (text: string, color: string) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} style={{ color }}>{part.slice(2, -2)}</strong>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  const renderLeftPanel = () => {
    if (!aiExamples || typeof aiExamples === 'string') return null;

    return (
      <div className="fade-in glass-panel" style={{ 
        flex: 1, 
        maxWidth: '400px', 
        padding: '1.5rem', 
        fontSize: '0.95rem', 
        lineHeight: '1.5'
      }}>
        <h4 style={{ color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🤖 Örnek Cümleler
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {aiExamples.sentences.map((s, idx) => (
            <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--card-border)' }}>
              <div style={{ marginBottom: '0.5rem', color: 'var(--text-main)', fontSize: '1rem' }}>
                {renderBoldText(s.english, 'var(--primary)')}
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem' }}>
                {renderBoldText(s.turkish, 'var(--danger)')}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderRightPanel = () => {
    if (!aiExamples || typeof aiExamples === 'string') return null;

    return (
      <div className="fade-in glass-panel" style={{ 
        flex: 1, 
        maxWidth: '300px', 
        padding: '1.5rem', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '1.5rem' 
      }}>
        <div>
          <h4 style={{ color: 'var(--success)', marginBottom: '0.75rem' }}>Eş Anlamlılar</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {aiExamples.synonyms.map((syn, idx) => (
              <span key={idx} style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '0.25rem 0.6rem', borderRadius: '9999px', fontSize: '0.85rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                {syn}
              </span>
            ))}
          </div>
        </div>
        <div>
          <h4 style={{ color: 'var(--danger)', marginBottom: '0.75rem' }}>Zıt Anlamlılar</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {aiExamples.antonyms.map((ant, idx) => (
              <span key={idx} style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '0.25rem 0.6rem', borderRadius: '9999px', fontSize: '0.85rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                {ant}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '2rem', paddingBottom: '4rem' }}>
      <div style={{ marginBottom: '2rem', fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>
        {mode === 'review' ? '🔄 Tekrar Modu' : '🚀 Yeni Kelimeler'} - {currentIndex + 1} / {words.length}
      </div>

      {typeof aiExamples === 'string' && (
        <div className="fade-in glass-panel" style={{ marginBottom: '2rem', maxWidth: '800px', color: 'var(--danger)' }}>
          {aiExamples}
        </div>
      )}

      <div style={{ 
        display: 'flex', 
        flexDirection: 'row', 
        alignItems: 'flex-start', 
        justifyContent: 'center', 
        gap: '2rem',
        width: '100%',
        maxWidth: '1400px'
      }}>
        
        {renderLeftPanel()}

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, minWidth: '400px' }}>
          <div 
            className={`flashcard-wrapper ${isFlipped ? 'is-flipped' : ''} ${animatingClass}`} 
            onClick={() => !animatingClass && setIsFlipped(!isFlipped)}
            style={{ position: 'relative' }}
          >
            <button 
              onClick={fetchAiExamples} 
              style={{
                position: 'absolute', top: '1rem', right: '1rem', zIndex: 10,
                background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                borderRadius: '50%', width: '40px', height: '40px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: '1.2rem', boxShadow: 'var(--card-shadow)',
                color: 'var(--text-main)', transition: 'all 0.2s'
              }}
              title="Yapay Zeka ile Örnek Cümleler Üret"
            >
              {loadingAi ? '⏳' : '❓'}
            </button>

            <div className="flashcard-inner" key={currentWord.id}>
              <div className="flashcard-face flashcard-front">
                <h2 className="word-display">{currentWord.word}</h2>
                <p className="word-hint">Anlamını görmek için tıkla</p>
              </div>
              <div className="flashcard-face flashcard-back">
                <h2 className="word-display">{currentWord.meaning}</h2>
                <p className="word-hint">Geri dönmek için tıkla</p>
              </div>
            </div>
          </div>

          <div className="action-buttons fade-in" style={{ transition: 'opacity 0.3s', marginTop: '1.5rem' }}>
            <button className="btn btn-danger" onClick={(e) => { e.stopPropagation(); handleAnswer(false); }}>
              <span style={{ fontSize: '1.5rem' }}>✕</span> Bilmiyorum
            </button>
            <button className="btn btn-success" onClick={(e) => { e.stopPropagation(); handleAnswer(true); }}>
              <span style={{ fontSize: '1.5rem' }}>✓</span> Biliyorum
            </button>
          </div>
        </div>

        {renderRightPanel()}

      </div>
    </div>
  );
}
