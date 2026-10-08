'use client';

import { useState } from 'react';
import { formatWhatsAppUrl } from '@/lib/whatsapp';

export default function RatingClientView({ card }) {
  const [selectedRating, setSelectedRating] = useState(null);
  const [hoverRating, setHoverRating] = useState(0);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleStarClick = async (star) => {
    setSelectedRating(star);

    // Fire telemetry asynchronously
    fetch('/api/telemetry/star', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        card_id: card.id,
        selected_stars: star,
      }),
    }).catch((err) => console.error('[client] Telemetry error:', err));

    if (star >= 4) {
      // 4 or 5 Stars: Reputation shield triggers Google Maps review redirect after 300ms
      setIsRedirecting(true);
      setTimeout(() => {
        if (card.google_review_url) {
          window.location.href = card.google_review_url;
        }
      }, 300);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRating) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_id: card.id,
          rating: selectedRating,
          feedback_text: feedbackText,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to submit feedback');
      }

      setIsSubmitted(true);
    } catch (err) {
      console.error('[client] Feedback error:', err);
      setSubmitError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const waUrl = card.whatsapp_number
    ? formatWhatsAppUrl({
        phoneNumber: card.whatsapp_number,
        storeName: card.store_name,
        rating: selectedRating || 1,
        feedbackText,
      })
    : null;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <div className="w-full max-w-md p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 text-center">
        {/* Store Header */}
        <div className="mb-6">
          <div className="w-14 h-14 mx-auto mb-3 flex items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-lg font-bold text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
            {card.store_name ? card.store_name.slice(0, 2).toUpperCase() : 'RT'}
          </div>
          <h1 className="text-xl font-bold tracking-tight">{card.store_name}</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Feedback & Review System
          </p>
        </div>

        {/* State 4: Thank You Screen */}
        {isSubmitted ? (
          <div className="py-6 space-y-3">
            <div className="w-12 h-12 mx-auto flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold">Terima Kasih atas Masukan Anda!</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Pesan Anda telah kami teruskan ke tim manajemen kami untuk evaluasi lebih lanjut.
            </p>
          </div>
        ) : selectedRating && selectedRating <= 3 ? (
          /* State 3: Low Rating Feedback Form (1-3 Stars) */
          <div className="py-2 text-left">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
                  Apa yang bisa kami tingkatkan?
                </h2>
                <p className="text-xs text-zinc-500">
                  Kami menghargai masukan jujur Anda untuk pelayanan lebih baik.
                </p>
              </div>
              <span className="inline-flex items-center px-2 py-1 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-600 text-xs font-semibold">
                ★ {selectedRating}/5
              </span>
            </div>

            {submitError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs">
                {submitError}
              </div>
            )}

            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="feedback-input"
                  className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1"
                >
                  Tuliskan saran atau keluhan Anda (opsional)
                </label>
                <textarea
                  id="feedback-input"
                  rows={4}
                  maxLength={2000}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Ceritakan pengalaman Anda..."
                  className="w-full p-3 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span>Mengirim...</span>
                  ) : (
                    <span>Kirim Masukan</span>
                  )}
                </button>

                {waUrl && (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-5.46-4.45-9.92-9.91-9.92zM12.04 20.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31c-.82-1.31-1.26-2.83-1.26-4.38 0-4.54 3.7-8.24 8.24-8.24 4.54 0 8.24 3.7 8.24 8.24 0 4.54-3.7 8.24-8.24 8.24z" />
                    </svg>
                    <span>Kirim via WhatsApp</span>
                  </a>
                )}
              </div>
            </form>
          </div>
        ) : (
          /* State 1 & 2: Star Rating Component (1-5 Stars) */
          <div className="py-4 space-y-4">
            <h2 className="text-base font-medium text-zinc-700 dark:text-zinc-300">
              Bagikan pengalaman Anda (1–5 bintang)
            </h2>

            {isRedirecting ? (
              <div className="py-4 flex flex-col items-center justify-center space-y-2 text-amber-600 dark:text-amber-400">
                <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <p className="text-xs">Mengarahkan ke Google Review...</p>
              </div>
            ) : (
              <div
                className="flex items-center justify-center gap-2 py-2"
                role="group"
                aria-label="Rating Bintang"
              >
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = (hoverRating || selectedRating || 0) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                      onClick={() => handleStarClick(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-2 rounded-xl transition-transform active:scale-90 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    >
                      <svg
                        className={`w-9 h-9 transition-colors ${
                          isFilled
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-zinc-300 dark:text-zinc-700 fill-transparent'
                        }`}
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                        />
                      </svg>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
