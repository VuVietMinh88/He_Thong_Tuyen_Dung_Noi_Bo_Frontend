import React, { useEffect, useState } from 'react';
import { ArrowRight, Heart, Users, ShieldCheck, Target, TrendingUp, Sparkles, Coffee } from 'lucide-react';
import type { CareerPageConfig } from '../../services/careerPageService';
import { careerPageService } from '../../services/careerPageService';

export interface CareerPagePreviewUIProps {
  data?: CareerPageConfig;
}

const defaultMockData: CareerPageConfig = {
  title: "Gia nhập gia đình TechCorp",
  slogan: "Nơi tài năng của bạn được tỏa sáng và phát triển không giới hạn.",
  aboutUs: "TechCorp là công ty công nghệ hàng đầu, tập trung vào việc tạo ra các giải pháp phần mềm đột phá. Chúng tôi tin rằng con người là tài sản quý giá nhất, và luôn tạo điều kiện tốt nhất để nhân viên phát triển sự nghiệp.\n\nGia nhập với chúng tôi, bạn sẽ được làm việc trong một môi trường năng động, đa văn hóa và đầy thách thức, nơi những ý tưởng mới luôn được chào đón và khuyến khích.",
  benefits: [
    { title: "Lương thưởng cạnh tranh, tháng lương 13", icon: "trending-up" },
    { title: "Bảo hiểm sức khỏe cao cấp toàn diện", icon: "shield-check" },
    { title: "Môi trường làm việc năng động, sáng tạo", icon: "users" },
    { title: "Cơ hội đào tạo và thăng tiến rõ ràng", icon: "target" },
    { title: "Chương trình chăm sóc sức khỏe tinh thần", icon: "heart" },
    { title: "Hỗ trợ ăn trưa và trang thiết bị làm việc", icon: "coffee" },
  ],
  coverImageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=2000&ixlib=rb-4.0.3",
};

// Map benefit index to an icon for visual aesthetics
const benefitIcons = [
  <TrendingUp className="h-6 w-6" key="1" />,
  <ShieldCheck className="h-6 w-6" key="2" />,
  <Users className="h-6 w-6" key="3" />,
  <Target className="h-6 w-6" key="4" />,
  <Heart className="h-6 w-6" key="5" />,
  <Coffee className="h-6 w-6" key="6" />,
  <Sparkles className="h-6 w-6" key="7" />,
];

export const CareerPagePreviewUI: React.FC<CareerPagePreviewUIProps> = ({
  data,
}) => {
  const [apiData, setApiData] = useState<CareerPageConfig | null>(null);
  const [isLoading, setIsLoading] = useState(!data);

  useEffect(() => {
    if (data) {
      setIsLoading(false);
      return;
    }
    
    careerPageService.getCareerPage()
      .then((res) => {
        setApiData(res);
      })
      .catch((err) => {
        console.error('Failed to load career page config', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [data]);

  const displayData = data || apiData || defaultMockData;

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><span className="animate-pulse font-medium text-slate-500">Đang tải...</span></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-200">
      {/* 1. Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] w-full overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={displayData.coverImageUrl || defaultMockData.coverImageUrl}
            alt="Career Cover"
            className="h-full w-full object-cover object-center"
          />
          {/* Gradient overlay for text readability - fading down to match page background */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/50 to-slate-50" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
          <div className="max-w-4xl space-y-6">
            <span className="inline-block rounded-full bg-indigo-500/20 px-5 py-2 text-sm font-semibold tracking-wide text-indigo-50 backdrop-blur-md border border-indigo-400/30 shadow-lg">
              Tuyển dụng 2026
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
              {displayData.title}
            </h1>
            <p className="mx-auto max-w-2xl text-lg font-medium text-slate-200 sm:text-xl md:text-2xl drop-shadow-md">
              {displayData.slogan}
            </p>
            
            <div className="pt-8">
              <button
                type="button"
                className="inline-flex items-center gap-2.5 rounded-full bg-indigo-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-indigo-600/30 transition-all hover:-translate-y-1 hover:bg-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/50"
              >
                Khám phá cơ hội nghề nghiệp
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. About Us Section (Two Columns) */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                Về chúng tôi
              </h2>
              <div className="h-1.5 w-24 rounded-full bg-indigo-600" />
            </div>
            <p className="whitespace-pre-line text-lg leading-relaxed text-slate-600">
              {displayData.aboutUs}
            </p>
            
            <div className="grid grid-cols-2 gap-6 pt-4">
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                <div className="text-4xl font-black text-indigo-600">10+</div>
                <div className="mt-2 text-sm font-semibold uppercase tracking-wider text-slate-500">Năm kinh nghiệm</div>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                <div className="text-4xl font-black text-indigo-600">500+</div>
                <div className="mt-2 text-sm font-semibold uppercase tracking-wider text-slate-500">Nhân sự tài năng</div>
              </div>
            </div>
          </div>

          <div className="relative">
            {/* Decorative elements behind image */}
            <div className="absolute -inset-4 z-0 rounded-3xl bg-indigo-100/50 blur-2xl" />
            <div className="absolute -bottom-10 -right-10 z-0 h-64 w-64 rounded-full bg-indigo-200/40 blur-3xl" />
            
            <img
              src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=1200&ixlib=rb-4.0.3"
              alt="Môi trường làm việc"
              className="relative z-10 w-full rounded-3xl object-cover shadow-2xl ring-1 ring-slate-900/5"
            />
          </div>
        </div>
      </section>

      {/* 3. Benefits & Core Values (Grid of Cards) */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              Chế độ phúc lợi & Giá trị cốt lõi
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Chúng tôi luôn nỗ lực mang đến những điều kiện làm việc tốt nhất để bạn yên tâm cống hiến và phát triển sự nghiệp.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {displayData.benefits.map((benefit, index) => {
              const Icon = benefitIcons[index % benefitIcons.length];
              
              return (
                <div
                  key={benefit.id || index}
                  className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-slate-50 p-8 transition-all hover:-translate-y-2 hover:bg-white hover:shadow-xl hover:shadow-indigo-100"
                >
                  <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                    {Icon}
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-slate-900">
                    {benefit.title}
                  </h3>
                  {benefit.description && (
                    <p className="text-base font-medium text-slate-600">
                      {benefit.description}
                    </p>
                  )}
                  
                  {/* Decorative corner accent */}
                  <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-indigo-50 opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Call to Action (CTA) */}
      <section className="relative overflow-hidden bg-indigo-900 py-24">
        {/* Abstract background shapes */}
        <div className="absolute inset-0 opacity-10">
          <svg className="absolute left-[20%] top-[20%] h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 animate-spin-slow" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="#ffffff" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,81.3,-46.3C90.8,-33.5,96.8,-18,97.1,-2.4C97.4,13.2,92.1,28.9,82.4,41.9C72.7,54.9,58.6,65.3,43.2,73.1C27.8,80.9,11.1,86.1,-4.7,89.5C-20.5,92.9,-35.4,94.5,-48.5,88.7C-61.6,82.9,-72.9,69.7,-81.4,55.1C-89.9,40.5,-95.6,24.5,-96.2,8.6C-96.8,-7.3,-92.3,-23,-83.4,-35.8C-74.5,-48.6,-61.2,-58.5,-47.5,-66.1C-33.8,-73.7,-19.7,-79,-4,-72.3C11.7,-65.6,23.5,-46.9,34.8,-53.4Z" transform="translate(100 100)" />
          </svg>
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Sẵn sàng bắt đầu hành trình mới?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-xl text-indigo-200">
            Hãy khám phá các vị trí đang mở và gia nhập đội ngũ của chúng tôi ngay hôm nay. Hàng ngàn cơ hội đang chờ đón bạn.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-bold text-indigo-900 shadow-xl transition-all hover:scale-105 hover:bg-indigo-50 focus:outline-none focus:ring-4 focus:ring-white/30"
            >
              Xem danh sách việc làm
              <ArrowRight className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full border-2 border-indigo-300/30 bg-indigo-800/30 px-8 py-4 text-lg font-bold text-white backdrop-blur-sm transition-all hover:bg-indigo-800 hover:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/50"
            >
              Đăng nhập / Đăng ký
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CareerPagePreviewUI;
