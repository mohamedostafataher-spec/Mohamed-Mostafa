import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { dbService } from '../services/db';
import { Review } from '../types';

interface Props {
  productId: string;
  productName: string;
}

const Stars: React.FC<{ value: number; size?: number }> = ({ value, size = 16 }) => (
  <span className="inline-flex" aria-label={`${value} من 5`}>
    {[1, 2, 3, 4, 5].map(n => (
      <Star key={n} size={size} className={n <= Math.round(value) ? 'text-amber-500 fill-current' : 'text-gray-300'} />
    ))}
  </span>
);

const ProductReviews: React.FC<Props> = ({ productId, productName }) => {
  const [all, setAll] = useState<Review[]>([]);
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  useEffect(() => {
    const unsub = dbService.subscribeReviews(setAll, () => setAll([]));
    return () => unsub();
  }, []);

  const reviews = all.filter(r => r.productId === productId && r.status === 'approved');
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || comment.trim().length < 5) return;
    setState('sending');
    try {
      await dbService.addReview({
        productId,
        productName,
        username: name.trim().slice(0, 40),
        rating,
        comment: comment.trim().slice(0, 600),
        status: 'pending',
        country: 'SA' as any,
        isVerifiedPurchase: false,
        avatar: ''
      });
      setState('done');
      setName('');
      setComment('');
    } catch {
      setState('error');
    }
  };

  // Structured data only when genuine approved reviews exist.
  const jsonLd = reviews.length
    ? {
        '@context': 'https://schema.org/',
        '@type': 'Product',
        name: productName,
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: Number(avg.toFixed(1)),
          reviewCount: reviews.length
        }
      }
    : null;

  return (
    <section className="pt-6 border-t border-gray-200" aria-labelledby="reviews-title">
      <div className="flex items-center justify-between mb-3">
        <h2 id="reviews-title" className="text-lg font-bold text-gray-950">آراء العميلات</h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Stars value={avg} />
            <span>{avg.toFixed(1)} ({reviews.length})</span>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="text-sm text-gray-600 mb-4">لا توجد تقييمات بعد. كوني أول من يشاركنا رأيها.</p>
      ) : (
        <ul className="space-y-3 mb-4">
          {reviews.slice(0, 10).map(r => (
            <li key={r.id} className="rounded-2xl border border-gray-200 p-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-gray-900">{r.username}</span>
                <Stars value={r.rating} size={14} />
              </div>
              <p className="mt-1 text-sm text-gray-700 leading-relaxed">{r.comment}</p>
            </li>
          ))}
        </ul>
      )}

      {state === 'done' ? (
        <p className="rounded-2xl bg-gray-50 border border-gray-200 p-3 text-sm text-gray-800">
          شكراً لكِ. سيظهر تقييمك بعد المراجعة.
        </p>
      ) : (
        <form onSubmit={submit} className="rounded-2xl border border-gray-200 p-3 space-y-2.5">
          <div className="text-sm font-bold text-gray-900">أضيفي تقييمك</div>
          <div className="flex gap-1" role="radiogroup" aria-label="التقييم">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={`${n} نجوم`}
                className="p-1 cursor-pointer"
              >
                <Star size={26} className={n <= rating ? 'text-amber-500 fill-current' : 'text-gray-300'} />
              </button>
            ))}
          </div>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={40}
            required
            placeholder="الاسم"
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
          />
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            maxLength={600}
            required
            minLength={5}
            rows={3}
            placeholder="رأيك في البيجامة (الخامة، المقاس، التوصيل)"
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={state === 'sending'}
            className="w-full rounded-xl bg-gray-950 text-white py-2.5 text-sm font-bold disabled:opacity-60 cursor-pointer"
          >
            {state === 'sending' ? 'جارٍ الإرسال...' : 'إرسال التقييم'}
          </button>
          {state === 'error' && <p className="text-xs text-red-600">تعذر الإرسال. حاولي لاحقاً.</p>}
        </form>
      )}

      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
    </section>
  );
};

export default ProductReviews;
