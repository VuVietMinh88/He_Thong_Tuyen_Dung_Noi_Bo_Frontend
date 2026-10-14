import React, { useState } from 'react';
import { Tag, Plus, X, Loader2 } from 'lucide-react';
import type { CandidateTag } from '../../types/candidate';

interface CandidateTagsManagerProps {
  tags: CandidateTag[];
  onAddTag: (tagName: string) => Promise<void>;
  onRemoveTag: (tagId: string) => Promise<void>;
  readOnly?: boolean;
}

export const CandidateTagsManager: React.FC<CandidateTagsManagerProps> = ({
  tags,
  onAddTag,
  onRemoveTag,
  readOnly = false,
}) => {
  const [newTagText, setNewTagText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newTagText.trim();
    if (!trimmed) {
      setError('Vui lòng nhập tên nhãn.');
      return;
    }
    if (tags.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('Nhãn này đã tồn tại trên hồ sơ.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onAddTag(trimmed);
      setNewTagText('');
      setIsInputOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể thêm nhãn lúc này.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (tagId: string) => {
    try {
      await onRemoveTag(tagId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể gỡ nhãn lúc này.');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <Tag className="w-4 h-4 text-indigo-600" />
          Nhãn phân loại kỹ năng & hồ sơ ({tags.length})
        </h4>
        {!readOnly && !isInputOpen && (
          <button
            type="button"
            onClick={() => {
              setIsInputOpen(true);
              setError(null);
            }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Thêm nhãn
          </button>
        )}
      </div>

      {/* Tags list */}
      <div className="flex flex-wrap items-center gap-1.5 min-h-[32px]">
        {tags.map((tag) => (
          <span
            key={tag.id}
            className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md border ${tag.colorClass} transition-all`}
          >
            #{tag.name}
            {!readOnly && (
              <button
                type="button"
                onClick={() => handleRemove(tag.id)}
                title={`Gỡ nhãn ${tag.name}`}
                className="hover:opacity-75 focus:outline-none ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
        ))}

        {tags.length === 0 && !isInputOpen && (
          <span className="text-xs text-gray-400 italic">Chưa có nhãn phân loại nào.</span>
        )}
      </div>

      {/* Add tag form */}
      {!readOnly && isInputOpen && (
        <form onSubmit={handleAdd} className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newTagText}
              onChange={(e) => {
                setNewTagText(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Nhập tên nhãn (VD: Tiếng Anh tốt, Lead kinh nghiệm...)"
              className="flex-1 text-xs px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              autoFocus
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={isSubmitting || !newTagText.trim()}
              className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Lưu
            </button>
            <button
              type="button"
              onClick={() => {
                setIsInputOpen(false);
                setNewTagText('');
                setError(null);
              }}
              disabled={isSubmitting}
              className="text-xs px-2.5 py-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Hủy
            </button>
          </div>
          {error && <p className="text-xs text-rose-600 mt-1.5">{error}</p>}
        </form>
      )}
    </div>
  );
};

export default CandidateTagsManager;

