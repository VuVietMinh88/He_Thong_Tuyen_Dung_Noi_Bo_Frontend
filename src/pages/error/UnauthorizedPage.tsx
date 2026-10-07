import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/notifications/useToast';

const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const { notify } = useToast();
  const notified = useRef(false);

  useEffect(() => {
    if (notified.current) return;
    notified.current = true;
    notify('Bạn không có quyền truy cập trang này.', 'error');
  }, [notify]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10 text-slate-800">
      <section className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/80 sm:p-10">
        <div className="mb-6 flex items-center justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-4xl font-bold text-red-500 shadow-inner shadow-red-100">
            403
          </div>
        </div>

        <div className="text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-red-500">
            Truy cập bị từ chối
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Không đủ quyền hạn
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Tài khoản hiện tại chưa được cấp quyền để truy cập chức năng hoặc trang này.
            Vui lòng quay lại hoặc liên hệ quản trị viên nếu bạn cho rằng đây là lỗi.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            Quay lại trang trước
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            Về trang tổng quan
          </button>
        </div>
      </section>
    </main>
  );
};

export default UnauthorizedPage;
