import React from 'react';
import { Search, MapPin, Building2, Sparkles, ArrowDown, Users, Award, ShieldCheck } from 'lucide-react';

export interface PublicJobHeroProps {
  title?: string;
  slogan?: string;
  coverImageUrl?: string;
  searchKeyword: string;
  onSearchChange: (value: string) => void;
  selectedLocation: string;
  onLocationChange: (value: string) => void;
  selectedDepartment: string;
  onDepartmentChange: (value: string) => void;
  departments: { id: string; name: string }[];
  locations: string[];
  totalJobsCount: number;
  onSearchSubmit: () => void;
  onScrollToJobs: () => void;
}

export const PublicJobHero: React.FC<PublicJobHeroProps> = ({
  title = 'Gia nhập gia đình SmartRecruit',
  slogan = 'Nơi tài năng của bạn được tỏa sáng, kiến tạo các sản phẩm công nghệ đột phá.',
  coverImageUrl = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=2000&ixlib=rb-4.0.3',
  searchKeyword,
  onSearchChange,
  selectedLocation,
  onLocationChange,
  selectedDepartment,
  onDepartmentChange,
  departments,
  locations,
  totalJobsCount,
  onSearchSubmit,
  onScrollToJobs,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit();
    onScrollToJobs();
  };

  return (
    <section className="relative min-h-[560px] w-full overflow-hidden bg-slate-900 py-20 lg:py-28">
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={coverImageUrl}
          alt="Career Hero Banner"
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-900/85 to-indigo-950/80 backdrop-blur-[2px]" />
        {/* Subtle decorative glow */}
        <div className="absolute -left-20 top-1/4 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -right-20 bottom-10 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/20 px-4 py-1.5 text-xs font-semibold text-indigo-200 backdrop-blur-md shadow-inner">
            <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
            <span>Cổng tuyển dụng chính thức 2026</span>
          </div>

          {/* Heading */}
          <h1 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            {title}
          </h1>

          {/* Slogan */}
          <p className="mx-auto mt-4 max-w-2xl text-base font-normal text-slate-300 sm:text-lg lg:text-xl leading-relaxed">
            {slogan}
          </p>

          {/* Quick Search Form Container */}
          <form
            onSubmit={handleSubmit}
            className="mt-10 rounded-2xl border border-white/20 bg-white/95 p-3 shadow-2xl backdrop-blur-md transition-all hover:bg-white text-left"
          >
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-12 md:gap-3">
              {/* Keyword Input */}
              <div className="relative md:col-span-5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Search className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Vị trí, chức danh hoặc kỹ năng (React, Java, UI/UX...)"
                  className="w-full rounded-xl border-0 bg-slate-50/80 py-3.5 pl-11 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Department Select */}
              <div className="relative md:col-span-3">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Building2 className="h-5 w-5 text-slate-400" />
                </div>
                <select
                  value={selectedDepartment}
                  onChange={(e) => onDepartmentChange(e.target.value)}
                  className="w-full appearance-none rounded-xl border-0 bg-slate-50/80 py-3.5 pl-11 pr-8 text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">Tất cả phòng ban</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location Select */}
              <div className="relative md:col-span-2">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <MapPin className="h-5 w-5 text-slate-400" />
                </div>
                <select
                  value={selectedLocation}
                  onChange={(e) => onLocationChange(e.target.value)}
                  className="w-full appearance-none rounded-xl border-0 bg-slate-50/80 py-3.5 pl-11 pr-8 text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">Tất cả địa điểm</option>
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Button */}
              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 px-4 text-sm font-bold text-white shadow-md shadow-indigo-600/30 transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <Search className="h-4 w-4" />
                  <span>Tìm kiếm</span>
                </button>
              </div>
            </div>
          </form>

          {/* Quick Stats & Highlights */}
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xs">
              <div className="flex items-center justify-center gap-2 text-indigo-400">
                <Users className="h-5 w-5" />
                <span className="text-2xl font-black text-white">{totalJobsCount}+</span>
              </div>
              <p className="mt-1 text-xs font-medium text-slate-300">Vị trí đang mở</p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xs">
              <div className="flex items-center justify-center gap-2 text-emerald-400">
                <Award className="h-5 w-5" />
                <span className="text-2xl font-black text-white">Top 10</span>
              </div>
              <p className="mt-1 text-xs font-medium text-slate-300">Nơi làm việc lý tưởng</p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xs">
              <div className="flex items-center justify-center gap-2 text-amber-400">
                <Sparkles className="h-5 w-5" />
                <span className="text-2xl font-black text-white">100%</span>
              </div>
              <p className="mt-1 text-xs font-medium text-slate-300">Lộ trình rõ ràng</p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xs">
              <div className="flex items-center justify-center gap-2 text-purple-400">
                <ShieldCheck className="h-5 w-5" />
                <span className="text-2xl font-black text-white">Toàn diện</span>
              </div>
              <p className="mt-1 text-xs font-medium text-slate-300">Phúc lợi chuẩn quốc tế</p>
            </div>
          </div>

          {/* Scroll Down Hint */}
          <div className="mt-10">
            <button
              type="button"
              onClick={onScrollToJobs}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              <span>Xem danh sách việc làm</span>
              <ArrowDown className="h-3.5 w-3.5 animate-bounce" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PublicJobHero;
