
import React from 'react';
import { LifelineType } from '../types';
import { LIFELINE_PRICES } from '../constants';

interface PaymentModalProps {
  type: LifelineType | 'EXTRA_GAME';
  lang: 'fr' | 'en';
  userPoints: number;
  onCancel: () => void;
  onPaid: (method: 'points' | 'money') => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ type, lang, userPoints, onCancel, onPaid }) => {
  const price = type === 'EXTRA_GAME' ? { points: 20000, xpf: 500, usd: 5.00 } : LIFELINE_PRICES[type as LifelineType];
  
  const t = {
    title: lang === 'fr' ? 'Débloquer' : 'Unlock',
    joker: lang === 'fr' ? 'Joker' : 'Lifeline',
    extra: lang === 'fr' ? 'Partie Supplémentaire' : 'Extra Game',
    method: lang === 'fr' ? 'Choisissez votre mode de paiement' : 'Choose payment method',
    payPoints: lang === 'fr' ? 'Payer avec mes Points' : 'Pay with my Points',
    insufficient: lang === 'fr' ? 'Points insuffisants' : 'Insufficient points',
    sms: lang === 'fr' ? 'SMS Surtaxé' : 'Premium SMS',
    card: lang === 'fr' ? 'Carte Bancaire / In-App' : 'Credit Card / In-App',
    cancel: lang === 'fr' ? 'Annuler' : 'Cancel',
  };

  const itemLabel = type === 'EXTRA_GAME' ? t.extra : `${t.joker} ${type}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
      <div className="bg-[#0f172a] border-2 border-blue-500/30 rounded-[32px] w-full max-w-md p-8 shadow-3xl animate-in zoom-in duration-300">
        <h2 className="text-3xl font-black text-center mb-2 text-yellow-500 italic uppercase italic">
          {t.title}
        </h2>
        <p className="text-center text-white/60 text-sm uppercase tracking-widest mb-8">
          {itemLabel}
        </p>

        <div className="space-y-4">
          {/* Points Payment */}
          <button 
            disabled={userPoints < price.points}
            onClick={() => onPaid('points')}
            className={`w-full p-5 rounded-2xl border-2 flex flex-col items-center transition-all ${
              userPoints >= price.points 
              ? 'border-yellow-500/50 bg-yellow-500/5 hover:bg-yellow-500/20 active:scale-95' 
              : 'border-white/5 bg-white/5 opacity-50 grayscale'
            }`}
          >
            <span className="text-xs font-bold text-yellow-500 uppercase tracking-widest">{t.payPoints}</span>
            <span className="text-2xl font-black">{price.points.toLocaleString()} PTS</span>
            {userPoints < price.points && <span className="text-[10px] mt-1 text-red-400 italic">{t.insufficient}</span>}
          </button>

          <div className="flex items-center gap-4 py-2">
            <div className="h-px bg-white/10 flex-1"></div>
            <span className="text-[10px] text-white/30 font-black uppercase tracking-widest">OR</span>
            <div className="h-px bg-white/10 flex-1"></div>
          </div>

          {/* Real Money Simulation */}
          <button 
            onClick={() => onPaid('money')}
            className="w-full p-5 rounded-2xl bg-blue-600 hover:bg-blue-500 border-2 border-blue-400/30 text-white active:scale-95 transition-all flex flex-col items-center shadow-xl"
          >
            <span className="text-xs font-bold text-blue-200 uppercase tracking-widest">{t.card}</span>
            <span className="text-2xl font-black">{price.xpf} XPF / {price.usd.toFixed(2)}$</span>
          </button>

          <button 
            onClick={() => onPaid('money')}
            className="w-full py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-sm font-bold uppercase tracking-widest transition-all"
          >
            {t.sms}
          </button>

          <button 
            onClick={onCancel}
            className="w-full py-4 text-white/40 text-xs font-black uppercase tracking-widest hover:text-white transition-colors"
          >
            {t.cancel}
          </button>
        </div>
      </div>
    </div>
  );
};
