import React from 'react';

export interface EmailFooterProps {
  className?: string;
  showLogo?: boolean;
}

/**
 * Component EmailFooter / SupportFooter
 * Hiển thị thông tin hỗ trợ, hotline, email liên hệ, logo công ty và bản quyền
 * dùng cho email template preview và các màn hình kích hoạt / quên mật khẩu.
 */
export const EmailFooter: React.FC<EmailFooterProps> = ({
  className = '',
  showLogo = true,
}) => {
  return (
    <footer
      className={`mt-8 border-t border-slate-200/80 pt-6 text-center text-xs text-slate-500 ${className}`}
    >
      {showLogo && (
        <div className="mb-3 flex justify-center">
          <img
            src="/logo.png"
            alt="Logo Công ty"
            className="h-10 w-auto max-w-[160px] object-contain"
            onError={(e) => {
              // Fallback nếu ảnh không tải được
              const target = e.currentTarget;
              target.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Thông tin hỗ trợ */}
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5 text-slate-600 leading-relaxed text-left sm:text-center">
        <p className="font-semibold text-indigo-950 mb-1">
          💬 Trung tâm hỗ trợ nhân sự &amp; tài khoản
        </p>
        <p>
          Nếu gặp bất kỳ vấn đề gì trong quá trình kích hoạt tài khoản hoặc đặt lại mật khẩu,
          xin vui lòng liên hệ Bộ phận Nhân sự qua email:{' '}
          <a
            href="mailto:hr@company.com"
            className="font-semibold text-indigo-600 hover:text-indigo-800 underline transition"
          >
            hr@company.com
          </a>{' '}
          hoặc hotline:{' '}
          <a
            href="tel:02412345678"
            className="font-semibold text-indigo-600 hover:text-indigo-800 underline transition"
          >
            (024) 1234 5678
          </a>{' '}
          để được hỗ trợ kịp thời.
        </p>
      </div>

      {/* Bản quyền & Địa chỉ */}
      <div className="mt-4 space-y-1 text-[11px] text-slate-400">
        <p>© 2026 Hệ thống Tuyển Dụng Thông Minh. Tất cả các quyền được bảo lưu.</p>
        <p>Tòa nhà Công nghệ, Tầng 8, Số 123 Phố Duy Tân, Cầu Giấy, Hà Nội.</p>
      </div>
    </footer>
  );
};

export default EmailFooter;

