
import React, { useState, useEffect, useCallback } from 'react';
import { fetchQuestions } from './services/geminiService';
import { 
  Question, 
  GameStatus, 
  UserStats, 
  LifelineState, 
  LifelineType, 
  Reward
} from './types';
import { 
  POINTS_LADDER, 
  MAX_DAILY_ATTEMPTS, 
  QUESTION_TIMER,
  SAFETY_TIERS
} from './constants';
import { Timer } from './components/Timer';
import { PaymentModal } from './components/PaymentModal';

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.HOME);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIMER);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answerState, setAnswerState] = useState<'idle' | 'checking' | 'correct' | 'wrong'>('idle');
  const [lang, setLang] = useState<'fr' | 'en'>('fr');
  const [purchaseType, setPurchaseType] = useState<LifelineType | 'EXTRA_GAME' | null>(null);
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);
  const [lifelines, setLifelines] = useState<LifelineState[]>([
    { type: '50:50', isUsedInCurrentGame: false, isPaid: false },
    { type: 'BANK', isUsedInCurrentGame: false, isPaid: true },
    { type: 'SWITCH', isUsedInCurrentGame: false, isPaid: true }
  ]);

  const [userStats, setUserStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('millionnaire_stats_poly');
    if (saved) {
      const parsed = JSON.parse(saved);
      const now = Date.now();
      const oneDay = 86400000;
      if (now - (parsed.lastPlayedTimestamp || 0) > oneDay) {
        parsed.dailyAttempts = 0;
      }
      return parsed;
    }
    return { 
      points: 2500, 
      dailyAttempts: 0, 
      lastPlayedTimestamp: Date.now(),
      lastFreeLifelineTimestamp: 0,
      language: 'fr',
      questionHistory: []
    };
  });

  useEffect(() => {
    localStorage.setItem('millionnaire_stats_poly', JSON.stringify(userStats));
  }, [userStats]);

  const handleGameOver = useCallback((message: string) => {
    if (status !== GameStatus.PLAYING) return;
    setStatus(GameStatus.GAMEOVER);

    let finalLevel = -1;
    for (let i = currentLevel - 1; i >= 0; i--) {
      if (SAFETY_TIERS.includes(i)) {
        finalLevel = i;
        break;
      }
    }
    const wonPoints = finalLevel >= 0 ? POINTS_LADDER[finalLevel] : 0;
    setUserStats(prev => ({ 
      ...prev, 
      points: prev.points + wonPoints,
      lastPlayedTimestamp: Date.now() 
    }));
    
    alert(`${message}\n\nPoints sécurisés : ${wonPoints.toLocaleString()} PTS`);
  }, [status, currentLevel]);

  // Anti-cheat
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && status === GameStatus.PLAYING) {
        handleGameOver(lang === 'fr' ? 'ÉLIMINATION : Changement d\'onglet.' : 'ELIMINATION: Tab switched.');
      }
    };
    const handleBlur = () => {
      if (status === GameStatus.PLAYING) {
        handleGameOver(lang === 'fr' ? 'ÉLIMINATION : Fenêtre inactive.' : 'ELIMINATION: Window blurred.');
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [status, handleGameOver, lang]);

  // Timer
  useEffect(() => {
    if (status === GameStatus.PLAYING && timeLeft > 0 && answerState === 'idle') {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 0.1) {
            handleGameOver(lang === 'fr' ? 'TEMPS ÉCOULÉ !' : 'TIME IS UP!');
            return 0;
          }
          return prev - 0.1;
        });
      }, 100);
      return () => clearInterval(timer);
    }
  }, [status, timeLeft, answerState, handleGameOver, lang]);

  const startNewGame = async () => {
    if (userStats.dailyAttempts >= MAX_DAILY_ATTEMPTS) {
      setPurchaseType('EXTRA_GAME');
      return;
    }
    setLoading(true);
    try {
      const q = await fetchQuestions(1, lang, userStats.questionHistory.map(h => h.text));
      setCurrentLevel(0);
      setCurrentQuestion(q[0]);
      setStatus(GameStatus.PLAYING);
      setTimeLeft(QUESTION_TIMER);
      setUserStats(prev => ({ 
        ...prev, 
        dailyAttempts: prev.dailyAttempts + 1,
        lastPlayedTimestamp: Date.now()
      }));
      setLifelines(lfs => lfs.map(l => ({ ...l, isUsedInCurrentGame: false })));
      setHiddenOptions([]);
      setSelectedOption(null);
      setAnswerState('idle');
    } catch (e) {
      alert("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (index: number) => {
    if (answerState !== 'idle') return;
    setSelectedOption(index);
    setAnswerState('checking');
    setTimeout(async () => {
      if (index === currentQuestion?.correctAnswer) {
        setAnswerState('correct');
        const nextLevel = currentLevel + 1;
        if (SAFETY_TIERS.includes(currentLevel)) {
            setStatus(GameStatus.CELEBRATION);
        } else if (nextLevel === POINTS_LADDER.length) {
            setStatus(GameStatus.WINNER);
        } else {
            loadNextQuestion(nextLevel);
        }
      } else {
        setAnswerState('wrong');
        setTimeout(() => handleGameOver('Mauvaise réponse !'), 1000);
      }
    }, 1000);
  };

  const loadNextQuestion = async (level: number) => {
    setLoading(true);
    try {
      const nextBatch = await fetchQuestions(level + 1, lang, userStats.questionHistory.map(h => h.text));
      setCurrentLevel(level);
      setCurrentQuestion(nextBatch[0]);
      setStatus(GameStatus.PLAYING);
      setTimeLeft(QUESTION_TIMER);
      setSelectedOption(null);
      setAnswerState('idle');
      setHiddenOptions([]);
    } catch (err) { handleGameOver("Error."); }
    finally { setLoading(false); }
  };

  const renderHome = () => (
    <div className="relative w-full max-w-md h-full flex flex-col overflow-hidden bg-background-dark shadow-2xl animate-in fade-in duration-700">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#081216] via-[#101e22] to-[#052e3e]"></div>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary/20 rounded-full blur-[80px]"></div>
      </div>
      <div className="relative z-10 flex flex-col h-full p-6">
        <div className="flex justify-between items-center mt-4">
          <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-2">
            <span className="material-icons-round text-gold-accent text-lg">monetization_on</span>
            <span className="text-white font-semibold text-sm">{userStats.points.toLocaleString()} PTS</span>
          </div>
          <button className="glass-panel p-2 rounded-full text-primary">
            <span className="material-icons-round">settings</span>
          </button>
        </div>
        <div className="flex-grow flex flex-col justify-center items-center -mt-10">
          <div className="relative flex flex-col items-center mb-12">
            <div className="absolute -top-12 opacity-80 animate-pulse">
               <span className="text-6xl">🌺</span>
            </div>
            <div className="relative bg-gradient-to-b from-[#1a3a45] to-[#0b1619] border-2 border-[#caa455] p-1 rounded-full shadow-[0_0_40px_rgba(13,185,242,0.3)]">
              <div className="border border-[#caa455]/50 rounded-full p-8 flex flex-col items-center justify-center w-64 h-64 bg-black/40">
                <div className="relative z-20 text-center">
                  <h1 className="text-3xl font-bold text-white tracking-wider leading-tight drop-shadow-lg uppercase">
                    Qui veut<br/>gagner des
                  </h1>
                  <h2 className="text-4xl font-black gold-gradient-text tracking-widest mt-1 drop-shadow-md">MILLIONS</h2>
                  <div className="w-full h-px bg-primary/50 my-3"></div>
                  <span className="text-primary font-medium tracking-[0.2em] text-sm uppercase">Édition Polynésie</span>
                </div>
              </div>
            </div>
          </div>
          <button onClick={startNewGame} className="group relative w-full max-w-xs h-16 bg-primary hover:bg-primary-dark transition-all duration-300 rounded-lg flex items-center justify-center primary-glow overflow-hidden transform active:scale-95 shadow-xl">
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
            <span className="text-white font-bold text-xl tracking-widest z-10 uppercase">Jouer</span>
          </button>
          <p className="text-gray-400 text-xs mt-6 text-center max-w-[200px] font-medium opacity-60">
            Tentez de gagner jusqu'à 10,000,000 de points pour débloquer des cadeaux.
          </p>
        </div>
      </div>
    </div>
  );

  const renderGame = () => (
    <div className="relative w-full max-w-md h-full flex flex-col bg-background-dark p-6 animate-in slide-in-from-bottom duration-500 overflow-hidden">
      <header className="flex flex-col gap-4 pt-4 mb-8">
        <div className="flex justify-between items-center px-2">
            <div className="flex flex-col">
                <span className="text-xs text-primary/60 uppercase tracking-widest font-bold">Niveau {currentLevel + 1}</span>
                <span className="text-xl font-bold text-white tracking-wide">{POINTS_LADDER[currentLevel].toLocaleString()} PTS</span>
            </div>
            <div className="relative w-14 h-14 flex items-center justify-center">
                <Timer seconds={timeLeft} maxSeconds={QUESTION_TIMER} />
            </div>
        </div>
      </header>
      <section className="flex-grow flex items-center justify-center py-6">
        <div className="w-full relative wood-texture rounded-2xl p-8 border border-white/10 shadow-2xl min-h-[180px] flex items-center justify-center text-center">
             <h2 className="text-xl font-bold leading-relaxed tracking-wide text-white drop-shadow-lg">
                {currentQuestion?.text}
             </h2>
        </div>
      </section>
      <section className="grid grid-cols-1 gap-3 w-full mb-8">
        {currentQuestion?.options.map((opt, idx) => (
           <button 
                key={idx} 
                onClick={() => handleAnswer(idx)}
                disabled={answerState !== 'idle'}
                className={`relative w-full p-5 rounded-xl border-2 flex items-center gap-4 transition-all overflow-hidden ${
                    selectedOption === idx 
                        ? (answerState === 'correct' ? 'bg-green-600 border-green-400 shadow-lg shadow-green-500/20' : 
                           answerState === 'wrong' ? 'bg-red-600 border-red-400' : 'bg-yellow-500 border-white text-black')
                        : 'bg-black/40 border-[#caa455]/40 hover:border-primary active:scale-95'
                }`}
            >
                <span className="text-gold-accent font-black text-lg">{String.fromCharCode(65+idx)}:</span>
                <span className="font-bold tracking-wide">{opt}</span>
           </button>
        ))}
      </section>
      <footer className="flex justify-center gap-6 pb-6">
          <button onClick={() => setStatus(GameStatus.LADDER)} className="p-4 rounded-full glass-panel text-primary hover:text-white transition-colors">
            <span className="material-icons-round">leaderboard</span>
          </button>
          <button onClick={() => handleGameOver('Abandon')} className="p-4 rounded-full bg-red-900/40 border border-red-500/40 text-red-500">
            <span className="material-icons-round">logout</span>
          </button>
      </footer>
    </div>
  );

  // Re-use renderCelebration for both intermediate tiers and final victory
  const renderCelebration = (isFinal?: boolean) => (
    <div className="relative w-full max-w-md h-full flex flex-col items-center justify-center bg-background-dark p-10 text-center animate-in zoom-in duration-700">
         <div className="w-24 h-24 rounded-full bg-gradient-to-b from-primary to-primary-dark flex items-center justify-center shadow-3xl mb-10">
            <span className="material-icons-round text-5xl text-background-dark">emoji_events</span>
         </div>
         <h2 className="text-primary text-sm font-black tracking-widest uppercase mb-2">
            {isFinal ? 'Grand Gagnant !' : 'Palier Atteint !'}
         </h2>
         <h1 className="text-6xl font-black text-white mb-4 italic">Máuruuru !</h1>
         <p className="text-white/60 mb-12">
            {isFinal ? 'Vous avez décroché les 10 millions !' : 'Votre culture brille comme une perle.'}
         </p>
         <div className="bg-primary/10 border border-primary/20 p-8 rounded-3xl w-full mb-12">
            <span className="block text-xs uppercase opacity-40 mb-2">{isFinal ? 'Total Remporté' : 'Gain Sécurisé'}</span>
            <span className="text-4xl font-black text-primary">{POINTS_LADDER[currentLevel].toLocaleString()} PTS</span>
         </div>
         <button 
            onClick={() => isFinal ? setStatus(GameStatus.HOME) : loadNextQuestion(currentLevel + 1)} 
            className="w-full py-6 bg-primary text-background-dark font-black rounded-full text-xl shadow-xl hover:scale-105 transition-all uppercase tracking-widest"
         >
            {isFinal ? 'Retour à l\'accueil' : 'Continuer'}
         </button>
    </div>
  );

  return (
    <div className="h-screen w-full flex justify-center items-center bg-[#050510]">
      <main className="relative w-full max-w-md h-full bg-background-dark shadow-2xl flex flex-col overflow-hidden">
        {status === GameStatus.HOME && renderHome()}
        {status === GameStatus.PLAYING && renderGame()}
        {status === GameStatus.CELEBRATION && renderCelebration(false)}
        {status === GameStatus.WINNER && renderCelebration(true)}
        
        {/* Persistent navigation (hidden during playing, celebration and winner states) */}
        {status !== GameStatus.PLAYING && status !== GameStatus.CELEBRATION && status !== GameStatus.WINNER && (
          <nav className="absolute bottom-6 left-6 right-6 h-16 glass-panel rounded-2xl flex items-center justify-around px-2 z-50 border border-white/5 shadow-2xl">
            <button onClick={() => setStatus(GameStatus.HOME)} className={`w-12 h-12 flex flex-col items-center justify-center transition-colors ${status === GameStatus.HOME ? 'text-primary' : 'text-white/40'}`}>
              <span className="material-icons-round text-2xl">home</span>
            </button>
            <button onClick={() => setStatus(GameStatus.LEADERBOARD)} className={`w-12 h-12 flex flex-col items-center justify-center transition-colors ${status === GameStatus.LEADERBOARD ? 'text-primary' : 'text-white/40'}`}>
              <span className="material-icons-round text-2xl">leaderboard</span>
            </button>
            <div className="relative -top-6">
              <button onClick={startNewGame} className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-3xl border-4 border-background-dark">
                <span className="material-icons-round text-3xl text-background-dark">play_arrow</span>
              </button>
            </div>
            <button onClick={() => setStatus(GameStatus.SHOP)} className={`w-12 h-12 flex flex-col items-center justify-center transition-colors ${status === GameStatus.SHOP ? 'text-primary' : 'text-white/40'}`}>
              <span className="material-icons-round text-2xl">shopping_bag</span>
            </button>
            <button onClick={() => setStatus(GameStatus.PROFILE)} className={`w-12 h-12 flex flex-col items-center justify-center transition-colors ${status === GameStatus.PROFILE ? 'text-primary' : 'text-white/40'}`}>
              <span className="material-icons-round text-2xl">person</span>
            </button>
          </nav>
        )}
      </main>

      {loading && (
        <div className="fixed inset-0 z-[100] bg-background-dark/95 flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-6 text-primary font-black uppercase tracking-widest animate-pulse">Sync...</p>
        </div>
      )}

      {purchaseType && (
        <PaymentModal type={purchaseType} lang={lang} userPoints={userStats.points} onCancel={() => setPurchaseType(null)} onPaid={() => {
            setUserStats(prev => ({ ...prev, dailyAttempts: 0 }));
            setPurchaseType(null);
            startNewGame();
        }} />
      )}
    </div>
  );
};

export default App;
