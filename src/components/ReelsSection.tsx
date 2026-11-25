import React from 'react';
import { Link } from 'react-router-dom';
import ReelVideo from './ReelVideo';
import { REELS, REELS_MUSIC_CREDIT } from '../data/reels';

export default function ReelsSection() {
  return (
    <section className="py-12 bg-white border-t border-gray-100" aria-labelledby="reels-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6">
          <h2 id="reels-title" className="text-2xl font-extrabold text-[#111827] tracking-tight">ريلز سولته</h2>
          <p className="text-xs text-gray-500 mt-1">شاهدي البيجامات في فيديوهات قصيرة</p>
        </div>
        <div
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-3 -mx-4 px-4"
          style={{ scrollbarWidth: 'none' }}
        >
          {REELS.map(r => (
            <div key={r.id} className="snap-center shrink-0 w-[58%] sm:w-[30%] lg:w-[18%]">
              <ReelVideo reel={r} />
              <Link
                to={`/product/${r.slug}`}
                className="block mt-2 text-[11px] font-bold text-gray-800 text-center leading-snug hover:text-[#A44C5C]"
              >
                {r.title}
              </Link>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-gray-400 text-center mt-3" dir="ltr">{REELS_MUSIC_CREDIT}</p>
      </div>
    </section>
  );
}
