
import React, { useState, useEffect, useCallback } from 'react';
import { fetchQuestions } from './services/geminiService';
import { 
  Question, 
  GameStatus, 
  UserStats, 
  LifelineState, 
  LifelineType, 
  Reward,
  QuestionHistoryEntry
} from './types';
import { 
  POINTS_LADDER, 
  MAX_DAILY_ATTEMPTS, 
  QUESTION_TIMER,
  SAFETY_TIERS,
  LIFELINE_PRICES
} from './constants';
import { Timer } from './components/Timer';
import { Boutique } from './components/Boutique';
import { PaymentModal } from './components/PaymentModal';

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.START);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIMER);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answerState, setAnswerState] = useState<'idle' | 'checking' | 'correct' | 'wrong'>('idle');
  const [bankedLevel, setBankedLevel] = useState<number | null>(null);
  const [lang, setLang] = useState<'fr' | 'en'>('fr');
  
  const [purchaseType, setPurchaseType] = useState<LifelineType | 'EXTRA_GAME' | null>(null);

  const [userStats, setUserStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('millionnaire_stats');
    if (saved) {
      const parsed = JSON.parse(saved);
      const now = Date.now();
      const oneDay = 86400000;
      const oneYear = 31536000000;
      
      let updatedStats = { ...parsed };
      
      // Reset daily attempts if a day has passed
      if (now - (parsed.lastPlayedTimestamp || 0) > oneDay) {
        updatedStats.dailyAttempts = 0;
      }

      // Prune question history older than 1 year
      if (parsed.questionHistory) {
        updatedStats.questionHistory = parsed.questionHistory.filter(
          (entry: QuestionHistoryEntry) => now - entry.timestamp < oneYear
        );
      } else {
        updatedStats.questionHistory = [];
      }

      return updatedStats;
    }
    return { 
      points: 25000, 
      dailyAttempts: 0, 
      lastPlayedTimestamp: Date.now(),
      lastFreeLifelineTimestamp: 0,
      language: 'fr',
      questionHistory: []
    };
  });

  const [lifelines, setLifelines] = useState<LifelineState[]>([
    { type: '50:50', isUsedInCurrentGame: false, isPaid: false },
    { type: 'BANK', isUsedInCurrentGame: false, isPaid: true },
    { type: 'SWITCH', isUsedInCurrentGame: false, isPaid: true }
  ]);
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);

  useEffect(() => {
    localStorage.setItem('millionnaire_stats', JSON.stringify(userStats));
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
    if (bankedLevel !== null && bankedLevel > finalLevel) {
      finalLevel = bankedLevel;
    }

    const wonPoints = finalLevel >= 0 ? POINTS_LADDER[finalLevel] : 0;
    setUserStats(prev => ({ 
      ...prev, 
      points: prev.points + wonPoints,
      lastPlayedTimestamp: Date.now() 
    }));
    
    const alertMsg = lang === 'fr' 
      ? `${message}\n\nPoints sécurisés : ${wonPoints.toLocaleString()} PTS`
      : `${message}\n\nPoints secured: ${wonPoints.toLocaleString()} PTS`;
    alert(alertMsg);
  }, [status, currentLevel, bankedLevel, lang]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && status === GameStatus.PLAYING) {
        handleGameOver(lang === 'fr' ? 'ÉLIMINATION : Sortie de l\'application détectée.' : 'ELIMINATION: App exit detected.');
      }
    };
    const handleBlur = () => {
      if (status === GameStatus.PLAYING) {
        handleGameOver(lang === 'fr' ? 'ÉLIMINATION : Fenêtre inactive (Anti-triche).' : 'ELIMINATION: Window blurred (Anti-cheat).');
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [status, handleGameOver, lang]);

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

  const isFreeLifelineAvailable = () => {
    const oneDay = 86400000;
    return (Date.now() - (userStats.lastFreeLifelineTimestamp || 0)) > oneDay;
  };

  const executeLifeline = async (type: LifelineType) => {
    setLifelines(prev => prev.map(l => l.type === type ? { ...l, isUsedInCurrentGame: true } : l));

    if (type === '50:50' && currentQuestion) {
      const correct = currentQuestion.correctAnswer;
      const incorrects = [0, 1, 2, 3].filter(i => i !== correct).sort(() => Math.random() - 0.5);
      setHiddenOptions(incorrects.slice(0, 2));
    } else if (type === 'BANK') {
      const levelToBank = currentLevel - 1;
      if (levelToBank >= 0) {
        setBankedLevel(levelToBank);
        alert(lang === 'fr' ? `Gains sécurisés à ${POINTS_LADDER[levelToBank].toLocaleString()} PTS !` : `Winnings secured at ${POINTS_LADDER[levelToBank].toLocaleString()} PTS!`);
      } else {
        alert(lang === 'fr' ? "Aucun point à sécuriser pour le moment !" : "No points to secure yet!");
      }
    } else if (type === 'SWITCH') {
      setLoading(true);
      try {
        const difficulty = Math.min(15, currentLevel + 1);
        const nextBatch = await fetchQuestions(
          difficulty, 
          lang, 
          userStats.questionHistory.map(h => h.text)
        );
        if (nextBatch && nextBatch.length > 0) {
          const newQ = nextBatch[0];
          setCurrentQuestion(newQ);
          setTimeLeft(QUESTION_TIMER); 
          setHiddenOptions([]); 
          setSelectedOption(null);
          setAnswerState('idle');
          
          // Add to history
          setUserStats(prev => ({
            ...prev,
            questionHistory: [...prev.questionHistory, { text: newQ.text, timestamp: Date.now() }]
          }));
        }
      } catch (err) {
        console.error("Failed to switch question", err);
        alert(lang === 'fr' ? "Erreur lors du changement de question." : "Error switching question.");
      } finally {
        setLoading(false);
      }
    }
  };

  const startNewGame = async () => {
    if (userStats.dailyAttempts >= MAX_DAILY_ATTEMPTS) {
      setPurchaseType('EXTRA_GAME');
      return;
    }

    setLoading(true);
    try {
      const q = await fetchQuestions(
        1, 
        lang, 
        userStats.questionHistory.map(h => h.text)
      );
      const firstQ = q[0];
      setCurrentLevel(0);
      setCurrentQuestion(firstQ);
      setStatus(GameStatus.PLAYING);
      setTimeLeft(QUESTION_TIMER);
      setUserStats(prev => ({ 
        ...prev, 
        dailyAttempts: prev.dailyAttempts + 1,
        lastPlayedTimestamp: Date.now(),
        questionHistory: [...prev.questionHistory, { text: firstQ.text, timestamp: Date.now() }]
      }));
      setLifelines(lfs => lfs.map(l => ({ ...l, isUsedInCurrentGame: false })));
      setHiddenOptions([]);
      setSelectedOption(null);
      setAnswerState('idle');
      setBankedLevel(null);
    } catch (e) {
      alert(lang === 'fr' ? "Erreur réseau." : "Network error.");
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
        if (nextLevel === POINTS_LADDER.length) {
          setStatus(GameStatus.WINNER);
          const jackpot = POINTS_LADDER[POINTS_LADDER.length - 1];
          setUserStats(prev => ({ ...prev, points: prev.points + jackpot }));
          alert(lang === 'fr' ? 'FÉLICITATIONS !' : 'CONGRATULATIONS!');
        } else {
          setTimeout(async () => {
            setLoading(true);
            try {
              const difficulty = Math.min(15, nextLevel + 1);
              const nextBatch = await fetchQuestions(
                difficulty, 
                lang, 
                userStats.questionHistory.map(h => h.text)
              );
              const nextQ = nextBatch[0];
              setCurrentLevel(nextLevel);
              setCurrentQuestion(nextQ);
              setTimeLeft(QUESTION_TIMER);
              setSelectedOption(null);
              setAnswerState('idle');
              setHiddenOptions([]);
              
              // Record in history
              setUserStats(prev => ({
                ...prev,
                questionHistory: [...prev.questionHistory, { text: nextQ.text, timestamp: Date.now() }]
              }));
            } catch (err) { handleGameOver("Error."); }
            finally { setLoading(false); }
          }, 1000);
        }
      } else {
        setAnswerState('wrong');
        setTimeout(() => handleGameOver(lang === 'fr' ? 'Mauvaise réponse !' : 'Wrong answer!'), 1500);
      }
    }, 800);
  };

  const onPurchaseComplete = (method: 'points' | 'money') => {
    if (!purchaseType) return;

    if (purchaseType === 'EXTRA_GAME') {
      if (method === 'points') {
        const cost = 20000;
        setUserStats(prev => ({ ...prev, points: prev.points - cost, dailyAttempts: 0 }));
      } else {
        setUserStats(prev => ({ ...prev, dailyAttempts: 0 }));
      }
      setPurchaseType(null);
      setTimeout(() => startNewGame(), 500);
      return;
    }

    if (method === 'points') {
      const cost = LIFELINE_PRICES[purchaseType as LifelineType].points;
      setUserStats(prev => ({ ...prev, points: prev.points - cost }));
    }
    
    if (purchaseType === '50:50') {
      setUserStats(prev => ({ ...prev, lastFreeLifelineTimestamp: Date.now() }));
    }

    const type = purchaseType as LifelineType;
    setPurchaseType(null);
    executeLifeline(type);
  };

  const clickLifeline = (type: LifelineType) => {
    const lifeline = lifelines.find(l => l.type === type);
    if (!lifeline || lifeline.isUsedInCurrentGame) return;

    const needsPurchase = (type === '50:50' && !isFreeLifelineAvailable()) || lifeline.isPaid;

    if (needsPurchase) {
      setPurchaseType(type);
    } else {
      executeLifeline(type);
    }
  };

  const t = {
    lives: lang === 'fr' ? 'VIES' : 'LIVES',
    shop: lang === 'fr' ? 'BOUTIQUE' : 'SHOP',
    start: lang === 'fr' ? 'JOUER' : 'PLAY',
    title: lang === 'fr' ? 'POINTS MILLIONNAIRE' : 'POINTS MILLIONAIRE',
    desc: lang === 'fr' ? 'Gagnez des points pour débloquer des cadeaux.' : 'Win points to unlock gifts.',
    points: lang === 'fr' ? 'POINTS' : 'POINTS',
  };

  return (
    <div className="h-screen w-full flex flex-col items-center justify-between p-4 relative overflow-hidden bg-[#050510] text-white">
      <div className="absolute inset-0 pointer-events-none select-none z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,#1e3a8a_0%,transparent_70%)] opacity-30"></div>
        <div className="absolute top-0 left-0 w-full h-full border-[12px] border-[#0a1a44] opacity-50"></div>
      </div>

      <div className="w-full flex justify-between items-start z-10 max-w-6xl">
        <div className="flex flex-col">
          <h1 className="text-3xl font-black text-yellow-500 tracking-tighter italic uppercase drop-shadow-[0_0_12px_rgba(234,179,8,0.6)]">
            {t.title}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="bg-yellow-500/20 border border-yellow-500/50 px-3 py-1 rounded-md text-yellow-400 font-bold text-sm tracking-widest shadow-lg">
              {userStats.points.toLocaleString()} PTS
            </span>
            <span className="text-[10px] font-bold opacity-60 uppercase bg-blue-900/40 px-2 py-1 rounded">
              {t.lives}: {MAX_DAILY_ATTEMPTS - userStats.dailyAttempts}/2
            </span>
          </div>
        </div>
        
        <div className="flex gap-3">
           <button onClick={() => setLang(l => l === 'fr' ? 'en' : 'fr')} className="px-3 py-2 bg-blue-900/60 rounded-full text-[11px] font-black uppercase border border-blue-400/30 hover:bg-blue-400 hover:text-black transition-colors">
            {lang === 'fr' ? 'EN' : 'FR'}
          </button>
          <button onClick={() => setStatus(GameStatus.BOUTIQUE)} className="bg-gradient-to-r from-yellow-600 to-yellow-400 text-black px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest hover:scale-110 active:scale-95 transition-all shadow-xl">
            {t.shop} 🎁
          </button>
        </div>
      </div>

      <div className="flex-1 w-full flex flex-col items-center justify-center z-10">
        {status === GameStatus.START && (
          <div className="flex flex-col items-center text-center max-w-xl animate-in fade-in duration-1000">
            <div className="w-48 h-48 mb-10 animate-pulse-gold rounded-full bg-gradient-to-tr from-yellow-600 to-yellow-300 flex items-center justify-center shadow-2xl border-4 border-white/20">
              <span className="text-8xl font-black text-black">?</span>
            </div>
            <h2 className="text-6xl font-black mb-4 uppercase tracking-tight italic drop-shadow-lg">PRÊT ?</h2>
            <p className="text-blue-200 text-lg mb-12 opacity-80 font-medium">{t.desc}</p>
            <button onClick={startNewGame} disabled={loading} className="px-20 py-6 bg-blue-600 rounded-full text-2xl font-black hover:bg-blue-500 shadow-[0_10px_0_#1e3a8a] active:shadow-none active:translate-y-[10px] uppercase tracking-wider transition-all border-2 border-blue-400/40">
              {loading ? 'SYNC...' : t.start}
            </button>
          </div>
        )}

        {status === GameStatus.PLAYING && currentQuestion && (
          <div className="w-full flex flex-col items-center gap-6 max-w-5xl px-4 animate-in fade-in zoom-in duration-300">
            <div className="grid grid-cols-5 md:grid-cols-15 gap-1.5 w-full mb-2">
              {POINTS_LADDER.map((pts, idx) => {
                const isSafety = SAFETY_TIERS.includes(idx);
                const isCurrent = idx === currentLevel;
                const isPassed = idx < currentLevel;
                const isBanked = idx === bankedLevel;

                let borderClass = 'border-blue-900/60';
                let bgClass = 'bg-blue-900/40 text-blue-800';

                if (isCurrent) {
                  bgClass = 'bg-yellow-500 text-black scale-125 z-20 shadow-2xl animate-pulse';
                  borderClass = 'border-yellow-200';
                } else if (isPassed) {
                  bgClass = 'bg-green-600 text-white';
                  borderClass = 'border-green-400';
                } else if (isSafety) {
                  bgClass = 'bg-blue-800 text-white';
                  borderClass = 'border-blue-300';
                }

                if (isBanked) {
                  borderClass = 'border-4 border-yellow-400';
                  bgClass += ' ring-2 ring-yellow-400 ring-offset-2 ring-offset-[#050510]';
                }

                return (
                  <div key={idx} className={`h-10 flex flex-col items-center justify-center rounded-md text-[9px] font-black border transition-all ${bgClass} ${borderClass}`}>
                    <span className="opacity-40">{idx + 1}</span>
                    <span className="leading-none">{pts >= 1000 ? (pts/1000) + 'K' : pts}</span>
                  </div>
                );
              })}
            </div>

            <Timer seconds={timeLeft} maxSeconds={QUESTION_TIMER} />

            <div className="w-full relative px-12 py-16 bg-[#0a0a25]/95 border-y-4 border-blue-500 shadow-xl backdrop-blur-xl hexagon-shape">
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-blue-600 text-[12px] font-black px-12 py-3 rounded-full border-2 border-blue-300 shadow-2xl uppercase tracking-[0.4em] text-white">
                {POINTS_LADDER[currentLevel].toLocaleString()} {t.points}
              </div>
              <h3 className="text-2xl md:text-5xl font-extrabold text-center leading-tight tracking-tight text-white drop-shadow-md">
                {currentQuestion.text}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              {currentQuestion.options.map((option, idx) => {
                const isHidden = hiddenOptions.includes(idx);
                const label = String.fromCharCode(65 + idx);
                let cls = "relative hexagon-shape p-1 transition-all duration-300 ";
                if (isHidden) cls += "opacity-0 pointer-events-none scale-75";
                else if (selectedOption === idx) {
                  if (answerState === 'checking') cls += "bg-yellow-400 scale-105 shadow-xl";
                  else if (answerState === 'correct') cls += "bg-green-500 scale-105 shadow-xl";
                  else if (answerState === 'wrong') cls += "bg-red-500 scale-105 shadow-xl";
                } else cls += "bg-blue-500/20 hover:bg-blue-400/50 hover:scale-[1.02]";

                return (
                  <button key={idx} disabled={answerState !== 'idle' || isHidden} onClick={() => handleAnswer(idx)} className={cls}>
                    <div className="bg-[#050515] h-full w-full py-7 px-14 text-left hexagon-shape flex items-center group">
                      <span className="text-yellow-500 font-black mr-8 text-4xl group-hover:scale-110 transition-transform">{label}:</span>
                      <span className="text-xl md:text-2xl font-bold tracking-tight text-white/95">{option}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-8 mt-6">
              {lifelines.map((life) => {
                const available = life.type === '50:50' ? isFreeLifelineAvailable() : true;
                const canUse = !life.isUsedInCurrentGame;
                return (
                  <button 
                    key={life.type} 
                    disabled={!canUse || answerState !== 'idle'} 
                    onClick={() => clickLifeline(life.type)} 
                    className={`w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center transition-all ${
                      !canUse ? 'border-gray-800 bg-gray-950 text-gray-800 grayscale scale-90' : 
                      'border-blue-500 bg-blue-900/60 hover:bg-yellow-500 hover:text-black hover:border-yellow-100 shadow-2xl hover:scale-110'
                    }`}
                  >
                    <span className="text-xs font-black tracking-widest">{life.type}</span>
                    {(life.isPaid || (life.type === '50:50' && !available)) && !life.isUsedInCurrentGame && (
                      <span className="text-[10px] mt-1 font-black text-yellow-500 uppercase tracking-tighter">PREMIUM</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {(status === GameStatus.GAMEOVER || status === GameStatus.WINNER) && (
          <div className="flex flex-col items-center text-center p-16 bg-black/60 border border-white/10 rounded-[50px] backdrop-blur-3xl animate-in zoom-in duration-700 shadow-2xl">
            <h2 className={`text-8xl font-black mb-10 italic tracking-tighter ${status === GameStatus.WINNER ? 'text-green-500' : 'text-red-600'}`}>
              {status === GameStatus.WINNER ? (lang === 'fr' ? 'Gagné !' : 'Winner!') : (lang === 'fr' ? 'Terminé' : 'Game Over')}
            </h2>
            <div className="mb-12">
              <p className="text-6xl text-white font-black">{userStats.points.toLocaleString()} PTS</p>
            </div>
            <button onClick={() => setStatus(GameStatus.START)} className="px-20 py-6 bg-gradient-to-r from-yellow-600 to-yellow-400 text-black font-black rounded-full text-3xl hover:shadow-2xl transition-all uppercase tracking-widest hover:scale-110">
              MENU
            </button>
          </div>
        )}
      </div>

      {status === GameStatus.BOUTIQUE && (
        <Boutique userPoints={userStats.points} lang={lang} onClose={() => setStatus(GameStatus.START)} 
          onRedeem={(r) => {
            if (userStats.points >= r.points) {
              setUserStats(prev => ({ ...prev, points: prev.points - r.points }));
              alert(lang === 'fr' ? `Commande enregistrée pour : ${r.name.fr}` : `Order placed for: ${r.name.en}`);
            }
          }} 
        />
      )}

      {purchaseType && (
        <PaymentModal 
          type={purchaseType} 
          lang={lang} 
          userPoints={userStats.points}
          onCancel={() => setPurchaseType(null)}
          onPaid={onPurchaseComplete}
        />
      )}

      {loading && (
        <div className="fixed inset-0 z-[100] bg-[#050510]/98 flex flex-col items-center justify-center backdrop-blur-xl">
          <div className="w-32 h-32 border-[10px] border-yellow-500 border-t-transparent rounded-full animate-spin mb-10"></div>
          <p className="text-yellow-500 font-black text-4xl uppercase tracking-[0.6em] animate-pulse italic">SYNC...</p>
        </div>
      )}

      <div className="w-full text-center py-4 text-[10px] text-blue-900/40 font-black uppercase tracking-[15px] z-10 pointer-events-none">
        MILLIONNAIRE ENGINE 3.0
      </div>
    </div>
  );
};

export default App;
