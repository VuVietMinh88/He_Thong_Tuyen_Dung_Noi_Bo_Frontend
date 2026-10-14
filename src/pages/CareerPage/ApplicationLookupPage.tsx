import React, { useState } from 'react';
import { AxiosError } from 'axios';
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  CircleHelp,
  Clock3,
  FileSearch,
  Search,
  ShieldCheck,
} from 'lucide-react';
import PublicFooter from '../../components/CareerPage/PublicFooter';
import PublicJobHeader from '../../components/CareerPage/PublicJobHeader';
import {
  applicationLookupService,
  type ApplicationLookupMethod,
  type ApplicationLookupResult,
  type ApplicationStatus,
} from '../../services/applicationLookupService';

const statusLabels: Record<ApplicationStatus, string> = {
  RECEIVED: 'Đã nhận hồ sơ',
  IN_REVIEW: 'Đang duyệt',
  INTERVIEW: 'Phỏng vấn',
  HIRED: 'Trúng tuyển',
  REJECTED: 'Chưa phù hợp',
  WITHDRAWN: 'Đã rút hồ sơ',
};

const stages: Array<{ status: ApplicationStatus; label: string; description: string }> = [
  {
    status: 'RECEIVED',
    label: 'Đã nhận hồ sơ',
    description: 'Hồ sơ của bạn đã được ghi nhận',
  },
  {
    status: 'IN_REVIEW',
    label: 'Đang duyệt',
    description: 'Đội ngũ tuyển dụng đang xem xét hồ sơ',
  },
  {
    status: 'INTERVIEW',
    label: 'Phỏng vấn',
    description: 'Trao đổi thêm về vị trí ứng tuyển',
  },
  {
    status: 'HIRED',
    label: 'Kết quả',
    description: 'Kết quả cuối cùng của hồ sơ',
  },
];

const statusColors: Record<ApplicationStatus, string> = {
  RECEIVED: 'bg-sky-50 text-sky-700 ring-sky-200',
  IN_REVIEW: 'bg-amber-50 text-amber-700 ring-amber-200',
  INTERVIEW: 'bg-violet-50 text-violet-700 ring-violet-200',
  HIRED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-700 ring-rose-200',
  WITHDRAWN: 'bg-slate-100 text-slate-700 ring-slate-200',
};

const formatDate = (value?: string): string => {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa cập nhật';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

const getStageIndex = (status: ApplicationStatus, timeline: ApplicationLookupResult['timeline']): number => {
  const stageStatus = status === 'WITHDRAWN' || status === 'REJECTED'
    ? [...(timeline ?? [])].reverse().find((event) => event.status !== 'WITHDRAWN' && event.status !== 'REJECTED')?.status ?? 'RECEIVED'
    : status;
  if (stageStatus === 'RECEIVED') return 0;
  if (stageStatus === 'IN_REVIEW') return 1;
  if (stageStatus === 'INTERVIEW') return 2;
  return 3;
};

export const ApplicationLookupPage: React.FC = () => {
  const [method, setMethod] = useState<ApplicationLookupMethod>('applicationCode');
  const [value, setValue] = useState('');
  const [result, setResult] = useState<ApplicationLookupResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = value.trim();
    if (!query) {
      setError(method === 'applicationCode'
        ? 'Vui lòng nhập mã tra cứu.'
        : 'Vui lòng nhập email hoặc số điện thoại.');
      setResult(null);
      setNotFound(false);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setNotFound(false);
    setHasSearched(true);
    setResult(null);
    try {
      setResult(await applicationLookupService.lookup(method, query));
    } catch (requestError: unknown) {
      if (requestError instanceof AxiosError && requestError.response?.status === 404) {
        setNotFound(true);
      } else {
        console.error('Error looking up application status:', requestError);
        setError('Chưa thể tra cứu hồ sơ lúc này. Vui lòng thử lại sau.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const statusHistory = result?.timeline ?? [];
  const terminalStatus = result?.status === 'REJECTED' || result?.status === 'WITHDRAWN';
  const currentStageIndex = result ? getStageIndex(result.status, statusHistory) : -1;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-800">
      <PublicJobHeader />

      <main className="flex-1 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
              <FileSearch className="h-7 w-7" aria-hidden="true" />
            </div>
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-indigo-600">
              Dành cho ứng viên
            </p>
            <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Theo dõi hồ sơ ứng tuyển
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
              Tra cứu tiến trình tuyển dụng nhanh chóng bằng mã hồ sơ hoặc thông tin liên hệ bạn đã đăng ký.
            </p>
          </div>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8" aria-labelledby="lookup-heading">
            <div className="mb-5 flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Search className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 id="lookup-heading" className="text-lg font-bold text-slate-900">
                  Nhập thông tin tra cứu
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Chọn một trong hai cách để tìm hồ sơ của bạn.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <fieldset>
                <legend className="mb-2 text-sm font-semibold text-slate-700">
                  Tra cứu bằng
                </legend>
                <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMethod('applicationCode');
                      setValue('');
                      setError(null);
                    }}
                    aria-pressed={method === 'applicationCode'}
                    className={`min-h-11 rounded-lg px-3 text-sm font-semibold transition ${
                      method === 'applicationCode'
                        ? 'bg-white text-indigo-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Mã tra cứu
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMethod('contact');
                      setValue('');
                      setError(null);
                    }}
                    aria-pressed={method === 'contact'}
                    className={`min-h-11 rounded-lg px-3 text-sm font-semibold transition ${
                      method === 'contact'
                        ? 'bg-white text-indigo-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Email / Số điện thoại
                  </button>
                </div>
              </fieldset>

              <label htmlFor="application-lookup-value" className="mb-2 block text-sm font-semibold text-slate-700">
                {method === 'applicationCode' ? 'Mã hồ sơ' : 'Email hoặc số điện thoại'}
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  id="application-lookup-value"
                  name="lookupValue"
                  type={method === 'applicationCode' ? 'text' : 'text'}
                  autoComplete={method === 'applicationCode' ? 'off' : 'email'}
                  inputMode={method === 'contact' ? 'email' : 'text'}
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  placeholder={method === 'applicationCode' ? 'Ví dụ: APP-2026-00125' : 'Nhập email hoặc số điện thoại đã đăng ký'}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'lookup-error' : 'lookup-hint'}
                  className="min-h-12 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-bold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-wait disabled:opacity-70"
                >
                  {isLoading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
                      Đang tra cứu
                    </>
                  ) : (
                    <>
                      Tra cứu
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </>
                  )}
                </button>
              </div>
              {error ? (
                <p id="lookup-error" role="alert" className="mt-2 flex items-center gap-1.5 text-sm text-rose-600">
                  <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {error}
                </p>
              ) : (
                <p id="lookup-hint" className="mt-2 text-xs text-slate-500">
                  {method === 'applicationCode'
                    ? 'Mã tra cứu được gửi đến bạn sau khi nộp hồ sơ.'
                    : 'Sử dụng thông tin liên hệ đã cung cấp trong hồ sơ ứng tuyển.'}
                </p>
              )}
            </form>
          </section>

          {isLoading && (
            <div role="status" className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
              <span className="mx-auto mb-3 block h-7 w-7 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" aria-hidden="true" />
              Đang tìm thông tin hồ sơ…
            </div>
          )}

          {!isLoading && result && (
            <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm" aria-labelledby="result-heading" aria-live="polite">
              <div className="border-b border-slate-100 p-5 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Vị trí ứng tuyển</p>
                    <h2 id="result-heading" className="mt-1 text-xl font-black text-slate-900 sm:text-2xl">
                      {result.jobTitle}
                    </h2>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${statusColors[result.status]}`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                    {statusLabels[result.status]}
                  </span>
                </div>
                <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-3.5">
                    <p className="text-xs font-medium text-slate-500">Mã hồ sơ</p>
                    <p className="mt-1 break-all font-mono font-semibold text-slate-800">{result.applicationCode}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3.5">
                    <p className="text-xs font-medium text-slate-500">Ngày nộp hồ sơ</p>
                    <p className="mt-1 font-semibold text-slate-800">{formatDate(result.submittedAt)}</p>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-7">
                <h3 className="text-base font-bold text-slate-900">Tiến trình tuyển dụng</h3>
                <ol className="mt-5">
                  {stages.map((stage, index) => {
                    const event = statusHistory.find((item) => item.status === stage.status);
                    const isComplete = index < currentStageIndex
                      || (index === currentStageIndex && (terminalStatus || result.status !== 'REJECTED'));
                    const isCurrent = index === currentStageIndex && !terminalStatus;
                    const isFinalStage = index === stages.length - 1;
                    const stageLabel = isFinalStage && (result.status === 'REJECTED' || result.status === 'HIRED')
                      ? statusLabels[result.status]
                      : stage.label;

                    return (
                      <li key={stage.status} className="relative flex gap-4 pb-6 last:pb-0">
                        {index < stages.length - 1 && (
                          <span
                            className={`absolute left-[15px] top-8 h-[calc(100%-1.5rem)] w-0.5 ${
                              index < currentStageIndex ? 'bg-indigo-500' : 'bg-slate-200'
                            }`}
                            aria-hidden="true"
                          />
                        )}
                        <span className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          isComplete
                            ? 'bg-indigo-600 text-white'
                            : isCurrent
                              ? 'bg-indigo-50 text-indigo-700 ring-2 ring-indigo-600'
                              : 'bg-slate-100 text-slate-400'
                        }`}>
                          {isComplete ? <Check className="h-4 w-4" aria-hidden="true" /> : <span className="text-xs font-bold">{index + 1}</span>}
                        </span>
                        <div className="min-w-0 flex-1 pt-0.5">
                          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                            <p className={`text-sm font-semibold ${isCurrent ? 'text-indigo-700' : isComplete ? 'text-slate-900' : 'text-slate-500'}`}>
                              {stageLabel}
                              {isCurrent && <span className="ml-2 text-xs font-medium text-indigo-600">(Hiện tại)</span>}
                            </p>
                            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                              <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                              {formatDate(event?.occurredAt ?? (index === 0 ? result.submittedAt : undefined))}
                            </span>
                          </div>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {event?.note ?? (isCurrent ? stage.description : isComplete ? 'Đã hoàn tất' : 'Chưa cập nhật')}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                  {terminalStatus && (
                    <li className="relative flex gap-4">
                      <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                        {result.status === 'WITHDRAWN'
                          ? <CircleHelp className="h-4 w-4" aria-hidden="true" />
                          : <AlertCircle className="h-4 w-4" aria-hidden="true" />}
                      </span>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <p className="text-sm font-semibold text-slate-800">{statusLabels[result.status]}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {statusHistory.find((item) => item.status === result.status)?.note
                            ?? 'Trạng thái hồ sơ đã được cập nhật.'}
                        </p>
                      </div>
                    </li>
                  )}
                </ol>
                <div className="mt-6 flex items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50/70 p-4">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" aria-hidden="true" />
                  <p className="text-xs leading-5 text-indigo-950">
                    Thông tin hồ sơ được bảo mật. Nếu cần hỗ trợ, vui lòng liên hệ đội ngũ tuyển dụng.
                  </p>
                </div>
              </div>
            </section>
          )}

          {!isLoading && !result && notFound && (
            <section role="status" className="mt-6 rounded-3xl border border-slate-200 bg-white px-6 py-10 text-center shadow-sm" aria-live="polite">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <FileSearch className="h-7 w-7" aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-lg font-bold text-slate-900">Chưa tìm thấy hồ sơ</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                Vui lòng kiểm tra lại mã tra cứu hoặc thông tin liên hệ. Nếu bạn vừa nộp hồ sơ, hệ thống có thể cần ít phút để cập nhật.
              </p>
            </section>
          )}

          {!isLoading && !result && !notFound && !error && !hasSearched && (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-8 text-center">
              <CheckCircle2 className="mx-auto h-6 w-6 text-slate-400" aria-hidden="true" />
              <p className="mt-2 text-sm font-medium text-slate-600">
                Kết quả theo dõi hồ sơ sẽ hiển thị tại đây.
              </p>
            </div>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default ApplicationLookupPage;
