import { useEffect, useRef } from 'react';
import BackToHome from '../../components/navigation/BackToHome';
import { useToast } from '../../components/notifications/useToast';

const UnauthorizedPage = () => {
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
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-4xl font-bold text-red-500 shadow-inner shadow-red-100"
            aria-hidden="true"
          >
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

        <BackToHome />
      </section>
    </main>
  );
};

export default UnauthorizedPage;
