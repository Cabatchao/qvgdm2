
import React from 'react';
import { REWARDS } from '../constants';
import { Reward } from '../types';

interface BoutiqueProps {
  userPoints: number;
  lang: 'fr' | 'en';
  onClose: () => void;
  onRedeem: (reward: Reward) => void;
}

export const Boutique: React.FC<BoutiqueProps> = ({ userPoints, lang, onClose, onRedeem }) => {
  const t = {
    title: lang === 'fr' ? 'La Boutique' : 'The Shop',
    subtitle: lang === 'fr' ? 'Échangez vos gains contre du réel' : 'Exchange your points for real rewards',
    pts: lang === 'fr' ? 'PTS' : 'PTS',
    redeem: lang === 'fr' ? 'Réclamer mon gain' : 'Claim reward',
    insufficient: lang === 'fr' ? 'Points manquants' : 'Insufficient points',
    shipping: lang === 'fr' ? 'Expédié sous 7 jours • Support 24/7' : 'Shipped within 7 days • 24/7 Support',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-xl">
      <div className="bg-[#0a0a25] border-2 border-yellow-500/40 rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl relative">
        
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
          <div>
            <h2 className="text-5xl font-black text-yellow-500 uppercase tracking-tighter italic">{t.title}</h2>
            <p className="text-gray-400 mt-2 uppercase text-xs tracking-[0.3em]">{t.subtitle}</p>
          </div>
          <div className="bg-yellow-500 text-black px-6 py-3 rounded-xl font-black text-xl shadow-lg">
            {userPoints.toLocaleString()} <span className="text-xs uppercase opacity-80">{t.pts}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {REWARDS.map((item) => (
            <div key={item.id} className="bg-[#111135] border border-blue-900/50 rounded-2xl overflow-hidden group hover:border-yellow-500/50 transition-all flex flex-col">
              <div className="relative h-48 overflow-hidden">
                <img src={item.image} alt={item.name[lang]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md text-yellow-400 font-black px-3 py-1 rounded-md text-sm border border-yellow-500/30">
                  {item.points.toLocaleString()} PTS
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-black mb-2 text-white uppercase tracking-tight">{item.name[lang]}</h3>
                <p className="text-gray-400 text-sm mb-6 flex-1 italic">{item.description[lang]}</p>
                <button
                  disabled={userPoints < item.points}
                  onClick={() => onRedeem(item)}
                  className={`w-full py-4 rounded-xl font-black uppercase tracking-widest transition-all ${
                    userPoints >= item.points 
                    ? 'bg-gradient-to-r from-yellow-600 to-yellow-400 text-black hover:shadow-xl hover:-translate-y-1' 
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'
                  }`}
                >
                  {userPoints >= item.points ? t.redeem : t.insufficient}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center border-t border-white/5 pt-8">
          <p className="text-gray-600 text-[10px] uppercase tracking-[0.5em]">{t.shipping}</p>
        </div>
      </div>
    </div>
  );
};
