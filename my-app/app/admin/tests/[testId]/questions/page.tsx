'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated, fetchWithAuth, logout } from '@/lib/auth';

interface PyqQuestion {
  _id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  subject: string;
  chapter: string;
  year: string;
  shift: string;
  addImage: string;
  image: string;
  isFedToChapter?: boolean;
  fedToChapterAt?: string | null;
   // New multi-image metadata from backend
  questionImages?: string[];
  optionImages?: string[];
}

const SUBJECTS = ['Chemistry', 'Physics', 'Maths', 'Biology'];

// Image upload is now allowed for all questions (Cloudinary-backed)
function isAddImageEnabled(q: PyqQuestion): boolean {
  return true;
}

export default function AdminTestQuestionsPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params?.testId as string;
  const [questions, setQuestions] = useState<PyqQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testTitle, setTestTitle] = useState('');
  const [testYear, setTestYear] = useState('');
  const [modalQuestion, setModalQuestion] = useState<PyqQuestion | null>(null);
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [chapters, setChapters] = useState<string[]>([]);
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [classOption, setClassOption] = useState<string>('12');
  const [yearInput, setYearInput] = useState('');
  const [feeding, setFeeding] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [feedSuccess, setFeedSuccess] = useState<string | null>(null);
  const [selectedCorrectAnswer, setSelectedCorrectAnswer] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [imageModalQuestion, setImageModalQuestion] = useState<PyqQuestion | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const optionImageInputRef = useRef<HTMLInputElement | null>(null);
  const [optionImageTarget, setOptionImageTarget] = useState<{ questionId: string; optionIndex: number } | null>(null);

  const parseTestId = useCallback((id: string) => {
    const decoded = decodeURIComponent(id);
    const idx = decoded.indexOf('__');
    const year = idx >= 0 ? decoded.slice(0, idx) : '';
    const title = idx >= 0 ? decoded.slice(idx + 2) : decoded;
    return { year: year === 'na' ? '' : year, title };
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    if (!testId) return;
    const { year, title } = parseTestId(testId);
    setTestYear(year);
    setTestTitle(title);
    fetchQuestions(title, year);
  }, [testId, router, parseTestId]);

  const fetchQuestions = async (title: string, year: string) => {
    try {
      setLoading(true);
      setError(null);
      const qs = new URLSearchParams({ title });
      if (year) qs.set('year', year);
      const res = await fetchWithAuth(`/api/mcq/admin/pyq-mock-tests/questions?${qs.toString()}`);
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          logout();
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch questions');
      }
      const data = await res.json();
      setQuestions(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!subject) {
      setChapters([]);
      setChapter('');
      return;
    }
    let cancelled = false;
    (async () => {
      setChaptersLoading(true);
      try {
        const res = await fetchWithAuth(`/api/mcq/admin/subjects/${encodeURIComponent(subject)}/chapters`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled && data.data) setChapters(data.data);
      } catch {
        if (!cancelled) setChapters([]);
      } finally {
        if (!cancelled) setChaptersLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [subject]);

  const openModal = (q: PyqQuestion) => {
    setModalQuestion(q);
    setSubject(q.subject || '');
    setChapter(q.chapter || '');
    setYearInput(q.year || testYear || '');
    setSelectedCorrectAnswer((q.correctAnswer ?? '').toString().trim());
    setChapters([]);
    setFeedError(null);
    setFeedSuccess(null);
  };

  const closeModal = () => {
    setModalQuestion(null);
    setSubject('');
    setChapter('');
    setChapters([]);
    setSelectedCorrectAnswer('');
    setFeedError(null);
    setFeedSuccess(null);
  };

  /** True when this question has no correct answer and admin must select one before adding */
  const needCorrectAnswer = Boolean(
    modalQuestion &&
    Array.isArray(modalQuestion.options) &&
    modalQuestion.options.length > 0 &&
    !(modalQuestion.correctAnswer ?? '').toString().trim()
  );

  const handleImageFileChange = async (q: PyqQuestion, file: File | null) => {
    if (!file || !file.type.startsWith('image/')) {
      setImageError('Please select an image file');
      return;
    }
    setImageUploading(true);
    setImageError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/cloudinary-upload', {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.success || !uploadData.url) {
        setImageError(uploadData.message || 'Upload failed');
        return;
      }
      const url = uploadData.url as string;
      const res = await fetchWithAuth(`/api/mcq/admin/pyq-mock-tests/questions/${q._id}/image`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: url }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setImageError(data.message || `Failed to save image (${res.status})`);
        return;
      }
      setQuestions((prev) =>
        prev.map((qq) => (qq._id === q._id ? { ...qq, image: url } : qq))
      );
      setImageModalQuestion(null);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setImageUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleOptionImageFileChange = async (q: PyqQuestion, optionIndex: number, file: File | null) => {
    if (!file || !file.type.startsWith('image/')) {
      setImageError('Please select an image file');
      return;
    }
    setImageUploading(true);
    setImageError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/cloudinary-upload', {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.success || !uploadData.url) {
        setImageError(uploadData.message || 'Upload failed');
        return;
      }
      const url = uploadData.url as string;
      const res = await fetchWithAuth(`/api/mcq/admin/pyq-mock-tests/questions/${q._id}/options/${optionIndex}/image`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: url }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setImageError(data.message || `Failed to save option image (${res.status})`);
        return;
      }
      setQuestions((prev) =>
        prev.map((qq) => {
          if (qq._id !== q._id) return qq;
          const nextOptionImages = Array.isArray(qq.optionImages) ? [...qq.optionImages] : [];
          nextOptionImages[optionIndex] = url;
          return { ...qq, optionImages: nextOptionImages };
        })
      );
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setImageUploading(false);
      setOptionImageTarget(null);
      if (optionImageInputRef.current) optionImageInputRef.current.value = '';
    }
  };

  const handleFeedToChapter = async () => {
    if (!modalQuestion || !subject || !chapter) return;
    const correctToSend = (modalQuestion.correctAnswer ?? '').toString().trim() || selectedCorrectAnswer.trim();
    if (needCorrectAnswer && !correctToSend) return;
    setFeeding(true);
    setFeedError(null);
    setFeedSuccess(null);
    try {
      const yearToSend = yearInput.trim() || modalQuestion.year || testYear || undefined;
      const res = await fetchWithAuth('/api/mcq/admin/pyq-mock-tests/feed-to-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pyqQuestionId: modalQuestion._id,
          subject,
          chapter,
          ...(yearToSend ? { year: yearToSend } : {}),
          ...(correctToSend ? { correctAnswer: correctToSend } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFeedError(data.message || `Failed (${res.status})`);
        return;
      }
      setFeedSuccess('Question added to chapter-based PYQ.');
      fetchQuestions(testTitle, testYear);
      setTimeout(closeModal, 1500);
    } catch (err) {
      setFeedError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setFeeding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link
            href="/admin/tests"
            className="text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-50 mb-4 inline-flex items-center gap-2"
          >
            ← Back to Tests
          </Link>
          <h1 className="text-3xl font-bold text-black dark:text-zinc-50 mb-2">
            Questions
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            {testTitle} {testYear && `(${testYear})`} — Add questions to chapter-based PYQ
          </p>
        </div>

        {questions.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-8 text-center border border-zinc-200 dark:border-zinc-800">
            <p className="text-zinc-600 dark:text-zinc-400">No questions in this test</p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q) => {
              const isExpanded = expandedId === q._id;
              const wasFedToChapter = Boolean(q.isFedToChapter);
              return (
                <div
                  key={q._id}
                  className={`rounded-lg border overflow-hidden ${
                    wasFedToChapter
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-600'
                      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                        {q.subject} {q.chapter && ` · ${q.chapter}`} {q.year && ` · ${q.year}`}
                        {q.shift && ` · Shift: ${q.shift}`}
                      </p>
                      <p className={`text-black dark:text-zinc-50 ${isExpanded ? '' : 'line-clamp-2'}`}>
                        {q.question}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {wasFedToChapter && (
                        <span className="inline-flex items-center rounded-full bg-yellow-200 dark:bg-yellow-700 px-2 py-0.5 text-xs font-medium text-yellow-900 dark:text-yellow-50">
                          Already added
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : q._id)}
                        className="px-3 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-sm font-medium hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                      >
                        {isExpanded ? 'Hide options' : 'View options'}
                      </button>
                      {isAddImageEnabled(q) && (
                        <button
                          type="button"
                          onClick={() => setImageModalQuestion(q)}
                          className="px-3 py-2 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-700 transition-colors"
                        >
                          {q.image || (q.addImage && q.addImage.startsWith('http')) ? 'Change image' : 'Add image'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => !wasFedToChapter && openModal(q)}
                        disabled={wasFedToChapter}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          wasFedToChapter
                            ? 'bg-zinc-300 dark:bg-zinc-600 text-zinc-500 dark:text-zinc-400 cursor-not-allowed'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        {wasFedToChapter ? 'Already added' : 'Add to chapter-based PYQ'}
                      </button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 px-4 py-4 space-y-3">
                      <div>
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1">
                          Full question
                        </p>
                        <p className="text-sm text-black dark:text-zinc-50 whitespace-pre-wrap">
                          {q.question}
                        </p>
                      </div>
                      {q.options && q.options.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
                            Options
                          </p>
                          <ul className="space-y-1.5">
                            {q.options.map((opt, i) => {
                              const isCorrect = opt === q.correctAnswer || String(opt).trim() === String(q.correctAnswer || '').trim();
                              const optionImage =
                                Array.isArray(q.optionImages) && q.optionImages[i]
                                  ? q.optionImages[i]
                                  : null;
                              return (
                                <li
                                  key={i}
                                  className={`text-sm px-3 py-2 rounded-lg border ${
                                    isCorrect
                                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200'
                                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200'
                                  }`}
                                >
                                  <span className="font-medium text-zinc-500 dark:text-zinc-400 mr-2">
                                    {String.fromCharCode(65 + i)}.
                                  </span>
                                  <span>{opt}</span>
                                  {isCorrect && (
                                    <span className="ml-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                      (correct)
                                    </span>
                                  )}
                                  {optionImage && (
                                    <div className="mt-2">
                                      <a
                                        href={optionImage}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-sky-600 dark:text-sky-400 hover:underline break-all"
                                      >
                                        Option image
                                      </a>
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOptionImageTarget({ questionId: q._id, optionIndex: i });
                                      optionImageInputRef.current?.click();
                                    }}
                                    className="mt-2 inline-flex px-2 py-1 rounded bg-sky-600 text-white text-xs font-medium hover:bg-sky-700"
                                  >
                                    {optionImage ? 'Change image' : 'Add image'}
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                      {q.correctAnswer && (
                        <div>
                          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1">
                            Correct answer
                          </p>
                          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                            {q.correctAnswer}
                          </p>
                        </div>
                      )}
                      {q.shift && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Shift: {q.shift}
                        </p>
                      )}
                      <div>
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1">
                          Image
                        </p>
                        {(q.image || (q.addImage && q.addImage.startsWith('http'))) ? (
                          <div className="flex flex-wrap items-start gap-2">
                            <a
                              href={q.image || q.addImage}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-sky-600 dark:text-sky-400 hover:underline break-all"
                            >
                              {q.image || q.addImage}
                            </a>
                            {(q.image || q.addImage).startsWith('http') && (
                              <img
                                src={q.image || q.addImage}
                                alt="Question"
                                className="max-w-full h-auto max-h-48 rounded border border-zinc-200 dark:border-zinc-700"
                              />
                            )}
                            {isAddImageEnabled(q) && (
                              <button
                                type="button"
                                onClick={() => setImageModalQuestion(q)}
                                className="mt-2 px-3 py-1.5 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-700"
                              >
                                Change image
                              </button>
                            )}
                          </div>
                        ) : (
                          <>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 italic">No image</p>
                            {isAddImageEnabled(q) && (
                              <button
                                type="button"
                                onClick={() => setImageModalQuestion(q)}
                                className="mt-2 px-3 py-1.5 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-700"
                              >
                                Add image
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Hidden file input for image upload */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (imageModalQuestion && file) {
            handleImageFileChange(imageModalQuestion, file);
          }
        }}
      />

      {/* Hidden file input for option image upload */}
      <input
        ref={optionImageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (optionImageTarget && file) {
            const targetQuestion = questions.find((qq) => qq._id === optionImageTarget.questionId);
            if (targetQuestion) {
              handleOptionImageFileChange(targetQuestion, optionImageTarget.optionIndex, file);
            }
          }
        }}
      />

      {/* Modal: Add / Change image (Cloudinary) */}
      {imageModalQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-2">
              {imageModalQuestion.image || (imageModalQuestion.addImage && imageModalQuestion.addImage.startsWith('http'))
                ? 'Change image'
                : 'Add image'}
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 line-clamp-2">
              {imageModalQuestion.question}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
              Image is saved to this PYQ question and to any chapter-based copies (same question + shift).
            </p>
            {imageError && (
              <p className="mb-3 text-sm text-red-600 dark:text-red-400">{imageError}</p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={imageUploading}
                className="px-4 py-2 rounded-lg bg-sky-600 text-white font-medium hover:bg-sky-700 disabled:opacity-50"
              >
                {imageUploading ? 'Uploading…' : 'Select image'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setImageModalQuestion(null);
                  setImageError(null);
                  if (imageInputRef.current) imageInputRef.current.value = '';
                }}
                disabled={imageUploading}
                className="px-4 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add to chapter-based PYQ */}
      {modalQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xl max-w-md w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-2">
                Add to chapter-based PYQ
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 line-clamp-2">
                {modalQuestion.question}
              </p>
              {modalQuestion.shift && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                  Shift: {modalQuestion.shift}
                </p>
              )}

              {needCorrectAnswer && (
                <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                    This question has no correct answer set. Please select the correct option before adding.
                  </p>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Correct answer *
                  </label>
                  <select
                    value={selectedCorrectAnswer}
                    onChange={(e) => setSelectedCorrectAnswer(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
                  >
                    <option value="">Select correct option</option>
                    {modalQuestion.options?.map((opt, i) => (
                      <option key={i} value={opt}>
                        {String.fromCharCode(65 + i)}. {opt}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {!needCorrectAnswer && modalQuestion.correctAnswer && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                  Correct answer: {modalQuestion.correctAnswer}
                </p>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Class (optional)
                  </label>
                  <select
                    value={classOption}
                    onChange={(e) => setClassOption(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
                  >
                    <option value="11">11th</option>
                    <option value="12">12th</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Subject *
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => { setSubject(e.target.value); setChapter(''); }}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
                  >
                    <option value="">Select subject</option>
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Chapter *
                  </label>
                  <select
                    value={chapter}
                    onChange={(e) => setChapter(e.target.value)}
                    disabled={chaptersLoading || !subject}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 disabled:opacity-50"
                  >
                    <option value="">Select chapter</option>
                    {chapters.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  {chaptersLoading && (
                    <p className="text-xs text-zinc-500 mt-1">Loading chapters…</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Year *
                  </label>
                  <input
                    type="text"
                    value={yearInput}
                    onChange={(e) => setYearInput(e.target.value)}
                    placeholder="e.g. 2025"
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
                  />
                </div>
              </div>

              {feedError && (
                <p className="mt-3 text-sm text-red-600 dark:text-red-400">{feedError}</p>
              )}
              {feedSuccess && (
                <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">{feedSuccess}</p>
              )}

              <div className="mt-6 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={feeding}
                  className="px-4 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleFeedToChapter}
                  disabled={
                    feeding ||
                    !subject ||
                    !chapter ||
                    !yearInput.trim() ||
                    (needCorrectAnswer && !selectedCorrectAnswer.trim())
                  }
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {feeding ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
