import React, { useEffect, useState } from 'react';

interface LoginSuccessOverlayProps {
  userName?: string;
  onDone?: () => void;
}

/**
 * Overlay animation hiển thị sau khi đăng nhập thành công.
 * Tự động ẩn sau 2.2 giây rồi gọi onDone().
 */
export const LoginSuccessOverlay: React.FC<LoginSuccessOverlayProps> = ({ userName, onDone }) => {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Bắt đầu fade-out sau 1.7 giây
    const fadeTimer = setTimeout(() => setFadeOut(true), 1700);
    // Gọi onDone sau 2.2 giây (0.5 giây sau khi fade-out bắt đầu)
    const doneTimer = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 2200);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  if (!visible) return null;

  return (
    <div
      className={`login-success-overlay ${fadeOut ? 'fade-out' : ''}`}
      role="status"
      aria-live="assertive"
      aria-label="Đăng nhập thành công"
    >
      <div className="login-success-card">
        {/* Vòng tròn check animation */}
        <div className="success-circle">
          <svg
            className="success-checkmark"
            viewBox="0 0 52 52"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle className="success-checkmark-circle" cx="26" cy="26" r="25" stroke="white" strokeWidth="2" />
            <path
              className="success-checkmark-check"
              d="M14.1 27.2l7.1 7.2 16.7-16.8"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Text */}
        <h2 className="success-title">Đăng nhập thành công!</h2>
        {userName && (
          <p className="success-subtitle">
            Chào mừng trở lại, <strong>{userName}</strong>
          </p>
        )}
        <p className="success-redirect-text">Đang chuyển hướng...</p>

        {/* Loading bar */}
        <div className="success-progress-bar">
          <div className="success-progress-fill" />
        </div>
      </div>

      <style>{`
        .login-success-overlay {
          position: fixed;
          inset: 0;
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          animation: overlayFadeIn 0.3s ease forwards;
        }

        .login-success-overlay.fade-out {
          animation: overlayFadeOut 0.5s ease forwards;
        }

        @keyframes overlayFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes overlayFadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        .login-success-card {
          background: linear-gradient(135deg, #1e3a5f 0%, #1a1f4b 50%, #0f172a 100%);
          border: 1px solid rgba(99, 179, 237, 0.2);
          border-radius: 24px;
          padding: 48px 56px;
          text-align: center;
          box-shadow:
            0 0 0 1px rgba(99, 179, 237, 0.1),
            0 25px 50px -12px rgba(0, 0, 0, 0.5),
            0 0 80px rgba(79, 70, 229, 0.15);
          animation: cardSlideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          min-width: 320px;
          max-width: 420px;
        }

        @keyframes cardSlideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* SVG checkmark animation */
        .success-circle {
          width: 80px;
          height: 80px;
          margin: 0 auto 24px;
          background: linear-gradient(135deg, #10b981, #059669);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 30px rgba(16, 185, 129, 0.4), 0 0 60px rgba(16, 185, 129, 0.15);
          animation: circlePop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both;
        }

        @keyframes circlePop {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .success-checkmark {
          width: 44px;
          height: 44px;
        }

        .success-checkmark-circle {
          stroke-dasharray: 166;
          stroke-dashoffset: 166;
          animation: strokeDraw 0.6s cubic-bezier(0.65, 0, 0.45, 1) 0.3s forwards;
          opacity: 0.5;
        }

        .success-checkmark-check {
          stroke-dasharray: 48;
          stroke-dashoffset: 48;
          animation: strokeDraw 0.4s cubic-bezier(0.65, 0, 0.45, 1) 0.7s forwards;
        }

        @keyframes strokeDraw {
          to { stroke-dashoffset: 0; }
        }

        .success-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #f0f9ff;
          margin: 0 0 8px;
          letter-spacing: -0.025em;
          animation: textFadeUp 0.4s ease 0.4s both;
        }

        .success-subtitle {
          font-size: 0.95rem;
          color: #94a3b8;
          margin: 0 0 6px;
          animation: textFadeUp 0.4s ease 0.5s both;
        }

        .success-subtitle strong {
          color: #63b3ed;
          font-weight: 600;
        }

        .success-redirect-text {
          font-size: 0.8rem;
          color: #475569;
          margin: 0 0 20px;
          animation: textFadeUp 0.4s ease 0.6s both;
        }

        @keyframes textFadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Progress bar */
        .success-progress-bar {
          height: 4px;
          background: rgba(99, 179, 237, 0.15);
          border-radius: 100px;
          overflow: hidden;
          animation: textFadeUp 0.4s ease 0.7s both;
        }

        .success-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #10b981, #3b82f6, #6366f1);
          border-radius: 100px;
          animation: progressLoad 1.7s cubic-bezier(0.4, 0, 0.2, 1) 0.3s both;
          width: 0;
        }

        @keyframes progressLoad {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default LoginSuccessOverlay;
