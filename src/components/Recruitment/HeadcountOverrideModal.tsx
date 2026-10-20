import React, { useState } from 'react';

interface HeadcountOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

export const HeadcountOverrideModal: React.FC<HeadcountOverrideModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit 
}) => {
  const [reason, setReason] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do vượt định biên.');
      return;
    }
    setError('');
    onSubmit(reason.trim());
    setReason('');
  };

  const handleClose = () => {
    setReason('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl transform transition-all">
        <div className="flex items-center space-x-2 mb-4">
          <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-lg font-semibold text-slate-900">Ghi đè chỉ tiêu định biên</h2>
        </div>
        
        <p className="text-sm text-slate-600 mb-4">
          Số lượng tuyển dụng yêu cầu vượt quá định biên còn lại. Vui lòng cung cấp lý do giải trình để tiếp tục.
        </p>

        <div className="mb-4">
          <label htmlFor="overrideReason" className="block text-sm font-medium text-slate-700 mb-1">
            Lý do vượt định biên <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="overrideReason"
            rows={4}
            className={`w-full rounded-xl border px-4 py-3 text-sm text-slate-900 shadow-xs outline-none transition focus:ring-2 ${
              error 
                ? 'border-rose-300 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-200' 
                : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
            }`}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError('');
            }}
            placeholder="Nhập lý do chi tiết..."
          />
          {error && <p className="text-rose-600 text-xs mt-1.5 font-medium">{error}</p>}
        </div>

        <div className="flex justify-end space-x-3 mt-6 border-t border-slate-100 pt-4">
          <button 
            type="button"
            onClick={handleClose} 
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            Hủy bỏ
          </button>
          <button 
            type="button"
            onClick={handleSubmit} 
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-200"
          >
            Xác nhận & Ghi đè
          </button>
        </div>
      </div>
    </div>
  );
};

