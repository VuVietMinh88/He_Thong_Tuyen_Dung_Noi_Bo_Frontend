import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Menu, X, LogIn, Sparkles, Building2, SearchCheck } from 'lucide-react';

export interface PublicJobHeaderProps {
  onScrollToJobs?: () => void;
  onScrollToAbout?: () => void;
  onScrollToBenefits?: () => void;
}

export const PublicJobHeader: React.FC<PublicJobHeaderProps> = ({
  onScrollToJobs,
  onScrollToAbout,
  onScrollToBenefits,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Name */}
        <Link to="/careers" className="group flex items-center gap-3 focus:outline-none">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-500/20 transition-transform group-hover:scale-105">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                SmartRecruit
              </span>
              <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 border border-indigo-200/50">
                Careers
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              Cơ hội nghề nghiệp & Phát triển tương lai
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            to="/careers/applications/lookup"
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 transition-colors hover:text-indigo-600"
          >
            <SearchCheck className="h-4 w-4 text-indigo-600" />
            Tra cứu hồ sơ
          </Link>
          <button
            type="button"
            onClick={onScrollToJobs}
            className="text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Briefcase className="h-4 w-4 text-indigo-600" />
            Cơ hội việc làm
          </button>
          <button
            type="button"
            onClick={onScrollToAbout}
            className="text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Building2 className="h-4 w-4 text-slate-400 group-hover:text-indigo-600" />
            Về chúng tôi
          </button>
          <button
            type="button"
            onClick={onScrollToBenefits}
            className="text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="h-4 w-4 text-amber-500" />
            Chế độ đãi ngộ
          </button>
        </nav>

        {/* Actions */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            <LogIn className="h-4 w-4 text-slate-500" />
            Đăng nhập nội bộ
          </Link>
          <button
            type="button"
            onClick={onScrollToJobs}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/30 transition hover:bg-indigo-700 hover:shadow-indigo-600/40 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            Ứng tuyển ngay
          </button>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 focus:outline-none"
          aria-label="Toggle mobile menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 animate-in fade-in slide-in-from-top-2">
          <Link
            to="/careers/applications/lookup"
            onClick={() => setMobileMenuOpen(false)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-600"
          >
            <SearchCheck className="h-4 w-4" />
            Tra cứu hồ sơ
          </Link>
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onScrollToJobs?.();
            }}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition"
          >
            💼 Cơ hội việc làm
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onScrollToAbout?.();
            }}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition"
          >
            🏢 Về chúng tôi
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onScrollToBenefits?.();
            }}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition"
          >
            ✨ Chế độ đãi ngộ
          </button>
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700"
            >
              <LogIn className="h-4 w-4" />
              Đăng nhập nội bộ
            </Link>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onScrollToJobs?.();
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
            >
              Xem tất cả việc làm
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default PublicJobHeader;
