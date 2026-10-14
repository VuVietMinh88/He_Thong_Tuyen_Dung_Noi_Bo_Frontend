import React, { useState } from 'react';
import {
  MessageSquare,
  Lock,
  Send,
  Loader2,
  Clock,
  User,
  ShieldAlert,
} from 'lucide-react';
import type { InternalNote } from '../../types/candidate';

interface InternalNotesSectionProps {
  notes: InternalNote[];
  onAddNote: (content: string, category?: InternalNote['category']) => Promise<void>;
  readOnly?: boolean;
}

const CATEGORY_LABELS: Record<NonNullable<InternalNote['category']>, { label: string; badgeClass: string }> = {
  GENERAL: { label: 'Chung', badgeClass: 'bg-gray-100 text-gray-700 border-gray-200' },
  SCREENING: { label: 'Sơ loại CV', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
  INTERVIEW: { label: 'Phỏng vấn', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200' },
  OFFER: { label: 'Đề xuất lương', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  CULTURE: { label: 'Văn hóa & Kỹ năng mềm', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

export const InternalNotesSection: React.FC<InternalNotesSectionProps> = ({
  notes,
  onAddNote,
  readOnly = false,
}) => {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<InternalNote['category']>('GENERAL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDateVN = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(date);
    } catch {
      return dateString;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) {
      setError('Vui lòng nhập nội dung ghi chú.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onAddNote(trimmed, category);
      setContent('');
      setCategory('GENERAL');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể lưu ghi chú lúc này.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-gray-100">
        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-600" />
          Ghi chú nội bộ tuyển dụng ({notes.length})
        </h3>
        {/* Security badge warning */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-semibold">
          <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Bảo mật nội bộ — Ứng viên không bao giờ nhìn thấy</span>
        </div>
      </div>

      {/* Add note form */}
      {!readOnly && (
        <form onSubmit={handleSubmit} className="bg-slate-50/70 rounded-xl p-3.5 border border-slate-200">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 mb-2">
            <span className="text-xs font-semibold text-slate-700">Thêm nhận xét / đánh giá mới:</span>
            <div className="flex items-center gap-2">
              <label htmlFor="note-category-select" className="text-xs text-slate-500">Phân loại:</label>
              <select
                id="note-category-select"
                aria-label="Phân loại ghi chú"
                value={category}
                onChange={(e) => setCategory(e.target.value as InternalNote['category'])}
                className="text-xs px-2.5 py-1 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={isSubmitting}
              >
                <option value="GENERAL">Chung</option>
                <option value="SCREENING">Sơ loại CV</option>
                <option value="INTERVIEW">Phỏng vấn</option>
                <option value="OFFER">Đề xuất offer</option>
                <option value="CULTURE">Văn hóa & Kỹ năng</option>
              </select>
            </div>
          </div>

          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Nhập ghi chú, đánh giá năng lực, nhận xét sau phỏng vấn hoặc lưu ý đặc biệt..."
            rows={3}
            disabled={isSubmitting}
            className="w-full text-xs sm:text-sm p-3 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
          />

          {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60">
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
              Chỉ HR & Hội đồng phỏng vấn được phân quyền mới có thể đọc.
            </span>
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Lưu ghi chú
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Notes list */}
      <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
        {notes.length === 0 ? (
          <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-xs sm:text-sm font-medium">Chưa có ghi chú nội bộ nào cho hồ sơ này.</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Hãy để lại nhận xét đầu tiên để đồng nghiệp cùng theo dõi.
            </p>
          </div>
        ) : (
          notes.map((note) => {
            const cat = note.category ? CATEGORY_LABELS[note.category] : CATEGORY_LABELS.GENERAL;
            return (
              <div
                key={note.id}
                className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-gray-200 hover:shadow-xs transition-all space-y-2"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {note.authorAvatar ? (
                        <img
                          src={note.authorAvatar}
                          alt={note.authorName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-gray-900 block">{note.authorName}</span>
                      <span className="text-[11px] text-gray-500 block">{note.authorRole}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${cat.badgeClass}`}>
                      {cat.label}
                    </span>
                    <span className="text-[11px] text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDateVN(note.createdAt)}
                    </span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-line leading-relaxed pl-9">
                  {note.content}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default InternalNotesSection;

