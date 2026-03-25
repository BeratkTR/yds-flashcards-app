import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

interface StatsData {
  totalStudied: number;
  reviewsPending: number;
  correctCount: number;
  incorrectCount: number;
  allWords: Array<{
    id: number;
    status: string;
    incorrectCount: number;
    step: number;
    nextReviewDate: string | null;
    lastReviewedAt: string;
    word: {
      word: string;
      meaning: string;
    }
  }>;
}

export default function Stats() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'CORRECT' | 'INCORRECT'>('ALL');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchStats();
  }, [navigate]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/stats');
      setStats(res.data);
    } catch (error) {
      console.error('Failed to fetch stats', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="spinner"></div>;
  }

  if (!stats) return <div style={{textAlign: 'center', marginTop: '2rem'}}>Failed to load dashboard.</div>;

  const filteredWords = stats.allWords.filter(w => {
    if (filter === 'ALL') return true;
    return w.status === filter;
  });

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '3rem', gap: '1rem' }}>
        <h2 style={{ fontSize: '2.5rem', textAlign: 'center' }}>Hoş Geldin!</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-success" onClick={() => navigate('/study?mode=study')} style={{ padding: '1rem 2rem', fontSize: '1.25rem' }}>
            🚀 Çalışmaya Başla
          </button>
          {stats.reviewsPending > 0 && (
            <button className="btn" onClick={() => navigate('/study?mode=review')} style={{ padding: '1rem 2rem', fontSize: '1.25rem' }}>
              🔄 Tekrar Et ({stats.reviewsPending})
            </button>
          )}
        </div>
      </div>
      
      <div className="stats-grid">
        <div className="glass-panel stat-card">
          <div className="stat-value primary">{stats.totalStudied}</div>
          <div className="stat-label">Toplam Çalışılan</div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-value success">{stats.correctCount}</div>
          <div className="stat-label">Öğrenilen</div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-value danger">{stats.incorrectCount}</div>
          <div className="stat-label">Pratik Gereken</div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.5rem', margin: 0 }}>Kelime Listesi</h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button 
              className={`btn ${filter === 'ALL' ? 'btn-primary' : ''}`} 
              style={{ padding: '0.5rem 1rem', background: filter === 'ALL' ? 'var(--primary)' : 'rgba(255,255,255,0.1)' }}
              onClick={() => setFilter('ALL')}
            >
              Tümü
            </button>
            <button 
              className={`btn ${filter === 'CORRECT' ? 'btn-success' : ''}`} 
              style={{ padding: '0.5rem 1rem', background: filter === 'CORRECT' ? 'var(--success)' : 'rgba(255,255,255,0.1)' }}
              onClick={() => setFilter('CORRECT')}
            >
              Bildiğim Kelimeler
            </button>
            <button 
              className={`btn ${filter === 'INCORRECT' ? 'btn-danger' : ''}`} 
              style={{ padding: '0.5rem 1rem', background: filter === 'INCORRECT' ? 'var(--danger)' : 'rgba(255,255,255,0.1)' }}
              onClick={() => setFilter('INCORRECT')}
            >
              Yanlış / Pratik
            </button>
          </div>
        </div>

        {stats.allWords.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Henüz incelenen kelime yok. Çalışmaya başla!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--card-border)', borderRadius: '0.5rem', overflowY: 'auto', maxHeight: '500px' }}>
            {filteredWords.length === 0 && (
              <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--bg-color)', color: 'var(--text-muted)' }}>Bu filtrede kelime bulunamadı.</div>
            )}
            {filteredWords.map(rw => (
              <div key={rw.id} className="list-item" style={{ background: 'var(--bg-color)' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '0.25rem' }}>
                    {rw.word.word}
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>{rw.word.meaning}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                  <span style={{ 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '9999px', 
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    background: rw.status === 'CORRECT' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: rw.status === 'CORRECT' ? 'var(--success)' : 'var(--danger)'
                  }}>
                    {rw.status === 'CORRECT' ? 'ÖĞRENİLDİ' : 'TEKRAR EDİLECEK'}
                  </span>
                  {rw.incorrectCount > 0 && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Yanlış sayısı: <b style={{ color: 'var(--danger)' }}>{rw.incorrectCount}</b>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
