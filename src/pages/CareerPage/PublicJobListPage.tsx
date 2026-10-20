import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Briefcase,
  Users,
  ShieldCheck,
  Target,
  TrendingUp,
  Sparkles,
  Coffee,
  Heart,
  ArrowRight,
} from 'lucide-react';
import type { JobPostingData } from '../../services/jobPostingService';
import { jobPostingService } from '../../services/jobPostingService';
import type { CareerPageConfig } from '../../services/careerPageService';
import { careerPageService } from '../../services/careerPageService';
import { useDebounce } from '../../hooks/useDebounce';
import PublicJobHeader from '../../components/CareerPage/PublicJobHeader';
import PublicJobHero from '../../components/CareerPage/PublicJobHero';
import PublicJobFilterBar, { type FilterState } from '../../components/CareerPage/PublicJobFilterBar';
import JobCard from '../../components/CareerPage/JobCard';
import JobCardSkeleton from '../../components/CareerPage/JobCardSkeleton';
import PublicJobEmptyState from '../../components/CareerPage/PublicJobEmptyState';
import PublicJobPagination from '../../components/CareerPage/PublicJobPagination';
import JobDetailModal from '../../components/CareerPage/JobDetailModal';
import PublicFooter from '../../components/CareerPage/PublicFooter';

const benefitIcons = [
  <TrendingUp className="h-6 w-6" key="1" />,
  <ShieldCheck className="h-6 w-6" key="2" />,
  <Users className="h-6 w-6" key="3" />,
  <Target className="h-6 w-6" key="4" />,
  <Heart className="h-6 w-6" key="5" />,
  <Coffee className="h-6 w-6" key="6" />,
];

const INITIAL_FILTERS: FilterState = {
  keyword: '',
  departmentId: 'ALL',
  workLocation: 'ALL',
  employmentType: 'ALL',
  level: 'ALL',
};

const DEFAULT_DEPARTMENTS = [
  { id: 'dept-tech', name: 'Khối Công nghệ & Sản phẩm' },
  { id: 'dept-ai', name: 'Trung tâm Nghiên cứu AI & Dữ liệu' },
  { id: 'dept-hr', name: 'Ban Quản trị Nguồn nhân lực' },
  { id: 'dept-mkt', name: 'Phòng Tiếp thị & Truyền thông' },
  { id: 'dept-sales', name: 'Phòng Kinh doanh B2B' },
];

const DEFAULT_LOCATIONS = [
  'Hà Nội',
  'TP. Hồ Chí Minh',
  'Đà Nẵng',
  'Làm việc từ xa (Remote)',
  'Linh hoạt (Hybrid)',
];

export const PublicJobListPage: React.FC = () => {
  // 1. URL Query Params synchronization (AC2)
  const [searchParams, setSearchParams] = useSearchParams();

  const initialKeyword = searchParams.get('keyword') || '';
  const initialDepartment = searchParams.get('department') || searchParams.get('departmentId') || 'ALL';
  const initialLocation = searchParams.get('location') || searchParams.get('workLocation') || 'ALL';
  const initialWorkType = searchParams.get('workType') || searchParams.get('employmentType') || 'ALL';
  const initialLevel = searchParams.get('level') || 'ALL';
  const initialPage = Number(searchParams.get('page')) > 0 ? Number(searchParams.get('page')) : 1;

  // Page Configuration & Culture state
  const [careerConfig, setCareerConfig] = useState<CareerPageConfig | null>(null);

  // Job List State
  const [jobs, setJobs] = useState<JobPostingData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [pageSize] = useState<number>(6);

  // Local Keyword input state for instant user typing (zero lag)
  const [keywordInput, setKeywordInput] = useState<string>(initialKeyword);

  // 2. Debounce Keyword (450ms) per AC2
  const debouncedKeyword = useDebounce(keywordInput, 450);
  const isSearching = keywordInput.trim() !== debouncedKeyword.trim();

  // Filters State
  const [filters, setFilters] = useState<FilterState>({
    keyword: initialKeyword,
    departmentId: initialDepartment,
    workLocation: initialLocation,
    employmentType: initialWorkType,
    level: initialLevel,
  });
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');

  // Modal Detail State
  const [selectedJob, setSelectedJob] = useState<JobPostingData | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [modalApplyMode, setModalApplyMode] = useState<boolean>(false);

  // Section Refs for smooth scrolling
  const jobsSectionRef = useRef<HTMLElement>(null);
  const aboutSectionRef = useRef<HTMLElement>(null);
  const benefitsSectionRef = useRef<HTMLElement>(null);

  // Sync debounced keyword into filters
  useEffect(() => {
    setFilters((prev) => {
      if (prev.keyword !== debouncedKeyword) {
        return { ...prev, keyword: debouncedKeyword };
      }
      return prev;
    });
  }, [debouncedKeyword]);

  // Sync state to URL Query Parameters (AC2)
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedKeyword.trim()) {
      params.set('keyword', debouncedKeyword.trim());
    }
    if (filters.departmentId !== 'ALL') {
      params.set('department', filters.departmentId);
    }
    if (filters.workLocation !== 'ALL') {
      params.set('location', filters.workLocation);
    }
    if (filters.employmentType !== 'ALL') {
      params.set('workType', filters.employmentType);
    }
    if (filters.level !== 'ALL') {
      params.set('level', filters.level);
    }
    if (currentPage > 1) {
      params.set('page', String(currentPage));
    }

    setSearchParams(params, { replace: true });
  }, [debouncedKeyword, filters.departmentId, filters.workLocation, filters.employmentType, filters.level, currentPage, setSearchParams]);

  // Load Career Page Configuration (Hero, Culture, Benefits)
  useEffect(() => {
    let isMounted = true;
    careerPageService
      .getCareerPage()
      .then((data) => {
        if (isMounted) setCareerConfig(data);
      })
      .catch(() => {
        if (isMounted) {
          setCareerConfig({
            title: 'Gia nhập gia đình SmartRecruit',
            slogan: 'Nơi tài năng của bạn được tỏa sáng và phát triển không giới hạn.',
            aboutUs:
              'SmartRecruit là đơn vị tiên phong trong việc phát triển các giải pháp phần mềm quản trị nguồn nhân lực và tuyển dụng thông minh hàng đầu khu vực. Chúng tôi tin rằng con người là tài sản quý giá nhất, luôn kiến tạo môi trường làm việc cởi mở, minh bạch và tạo điều kiện bứt phá cho mỗi cá nhân.',
            coverImageUrl:
              'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=2000&ixlib=rb-4.0.3',
            benefits: [
              { title: 'Lương thưởng cạnh tranh, tháng 13 & thưởng hiệu quả', description: 'Đánh giá năng lực và tăng lương định kỳ 2 lần/năm.' },
              { title: 'Bảo hiểm sức khỏe cao cấp toàn diện', description: 'Gói chăm sóc y tế VIP cho nhân sự và hỗ trợ người thân.' },
              { title: 'Môi trường làm việc năng động, sáng tạo', description: 'Trang thiết bị hiện đại, không gian làm việc mở chuẩn quốc tế.' },
              { title: 'Cơ hội đào tạo & Lộ trình thăng tiến rõ ràng', description: 'Tài trợ 100% chứng chỉ chuyên môn và tham gia hội thảo quốc tế.' },
              { title: 'Chế độ làm việc linh hoạt (Hybrid / Remote)', description: 'Chủ động thời gian, cân bằng giữa công việc và cuộc sống.' },
              { title: 'Phụ cấp ăn trưa, teambuilding & du lịch hàng năm', description: 'Nhiều hoạt động văn hóa, gắn kết tập thể phong phú.' },
            ],
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 3. Fetch Jobs via getPublicJobs (AC3)
  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await jobPostingService.getPublicJobs({
        keyword: debouncedKeyword,
        department: filters.departmentId,
        location: filters.workLocation,
        workType: filters.employmentType,
        level: filters.level,
        page: currentPage,
        pageSize,
      });

      setJobs(response.items);
      setTotalCount(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Failed to load public jobs', error);
      setJobs([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedKeyword, filters.departmentId, filters.workLocation, filters.employmentType, filters.level, currentPage, pageSize]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Handler for filter field change
  const handleFilterChange = (key: keyof FilterState, value: string) => {
    if (key === 'keyword') {
      setKeywordInput(value);
    } else {
      setFilters((prev) => ({
        ...prev,
        [key]: value,
      }));
    }
    setCurrentPage(1);
  };

  // Reset all filters to default (AC1)
  const handleResetFilters = () => {
    setKeywordInput('');
    setFilters(INITIAL_FILTERS);
    setCurrentPage(1);
    setSearchParams({}, { replace: true });
  };

  // Scroll Helpers
  const scrollToJobs = () => {
    jobsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToAbout = () => {
    aboutSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToBenefits = () => {
    benefitsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Open detail modal
  const handleViewDetail = (job: JobPostingData) => {
    setSelectedJob(job);
    setModalApplyMode(false);
    setIsDetailModalOpen(true);
  };

  // Open direct application modal
  const handleApplyNow = (job: JobPostingData) => {
    setSelectedJob(job);
    setModalApplyMode(true);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* 1. Public Navigation Header */}
      <PublicJobHeader
        onScrollToJobs={scrollToJobs}
        onScrollToAbout={scrollToAbout}
        onScrollToBenefits={scrollToBenefits}
      />

      <main>
        {/* 2. Hero Banner & Culture Message (AC1) */}
        <PublicJobHero
          title={careerConfig?.title}
          slogan={careerConfig?.slogan}
          coverImageUrl={careerConfig?.coverImageUrl}
          searchKeyword={keywordInput}
          onSearchChange={(val) => handleFilterChange('keyword', val)}
          selectedLocation={filters.workLocation}
          onLocationChange={(val) => handleFilterChange('workLocation', val)}
          selectedDepartment={filters.departmentId}
          onDepartmentChange={(val) => handleFilterChange('departmentId', val)}
          departments={DEFAULT_DEPARTMENTS}
          locations={DEFAULT_LOCATIONS}
          totalJobsCount={totalCount > 0 ? totalCount : 12}
          onSearchSubmit={() => setCurrentPage(1)}
          onScrollToJobs={scrollToJobs}
        />

        {/* 3. Job List & Filter Section (AC1 & AC2) */}
        <section
          ref={jobsSectionRef}
          id="jobs-section"
          className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
        >
          {/* Section Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 border border-indigo-200/50 mb-2">
                  <Briefcase className="h-3.5 w-3.5" />
                  Vị trí tuyển dụng đang mở
                </span>
                <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                  Khám phá cơ hội nghề nghiệp phù hợp
                </h2>
                <p className="mt-2 text-sm text-slate-600 max-w-2xl">
                  Tìm kiếm vị trí mong muốn theo phòng ban, địa điểm hoặc hình thức làm việc. Hãy gia nhập đội ngũ của chúng tôi để cùng nhau kiến tạo tương lai.
                </p>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="mb-8">
            <PublicJobFilterBar
              filters={{ ...filters, keyword: keywordInput }}
              onFilterChange={handleFilterChange}
              onResetFilters={handleResetFilters}
              layout={layout}
              onLayoutChange={setLayout}
              totalResults={totalCount}
              departments={DEFAULT_DEPARTMENTS}
              locations={DEFAULT_LOCATIONS}
              isSearching={isSearching || isLoading}
            />
          </div>

          {/* Job Cards Grid / List (AC2 & AC3) */}
          {isLoading ? (
            <JobCardSkeleton layout={layout} count={pageSize} />
          ) : jobs.length === 0 ? (
            <PublicJobEmptyState
              onResetFilters={handleResetFilters}
              keyword={filters.keyword}
            />
          ) : layout === 'grid' ? (
            <div
              data-testid="job-cards-grid"
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  layout="grid"
                  onViewDetail={handleViewDetail}
                  onApplyNow={handleApplyNow}
                />
              ))}
            </div>
          ) : (
            <div data-testid="job-cards-list" className="space-y-4">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  layout="list"
                  onViewDetail={handleViewDetail}
                  onApplyNow={handleApplyNow}
                />
              ))}
            </div>
          )}

          {/* Pagination (AC3) */}
          {!isLoading && jobs.length > 0 && (
            <PublicJobPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalCount}
              pageSize={pageSize}
              onPageChange={(page) => {
                setCurrentPage(page);
                jobsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
              }}
            />
          )}
        </section>

        {/* 4. Company Culture & About Us Section (AC1) */}
        <section
          ref={aboutSectionRef}
          id="about-section"
          className="border-t border-slate-200/80 bg-white py-20 lg:py-24"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <div className="space-y-6">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3.5 py-1 text-xs font-bold text-indigo-700">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                  Văn hóa &amp; Môi trường làm việc
                </span>
                <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                  Nơi mỗi ý tưởng đều được lắng nghe và trân trọng
                </h2>
                <p className="whitespace-pre-line text-base leading-relaxed text-slate-600">
                  {careerConfig?.aboutUs ||
                    'Chúng tôi xây dựng một môi trường làm việc đề cao sự bình đẳng, đổi mới sáng tạo và tinh thần đồng đội. Tại SmartRecruit, mỗi thành viên đều có không gian tự do phát triển sở trường và được trao quyền để tạo nên những tác động tích cực.'}
                </p>

                {/* Highlight Stats */}
                <div className="grid grid-cols-2 gap-4 pt-2 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center">
                    <div className="text-3xl font-black text-indigo-600">500+</div>
                    <div className="mt-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Nhân sự tài năng
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center">
                    <div className="text-3xl font-black text-emerald-600">96%</div>
                    <div className="mt-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Độ hài lòng nhân viên
                    </div>
                  </div>
                  <div className="col-span-2 sm:col-span-1 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center">
                    <div className="text-3xl font-black text-purple-600">10+</div>
                    <div className="mt-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Năm phát triển
                    </div>
                  </div>
                </div>
              </div>

              {/* Culture Image with decorative frame */}
              <div className="relative">
                <div className="absolute -inset-4 rounded-3xl bg-indigo-100/60 blur-xl -z-10" />
                <img
                  src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=1200&ixlib=rb-4.0.3"
                  alt="Không gian làm việc văn hóa công ty"
                  className="w-full rounded-3xl object-cover shadow-2xl ring-1 ring-slate-900/5 aspect-4/3"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 5. Benefits & Core Values Section (AC1) */}
        <section
          ref={benefitsSectionRef}
          id="benefits-section"
          className="border-t border-slate-200/80 bg-slate-50/70 py-20 lg:py-24"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center mb-16">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                Chính sách phúc lợi 360°
              </span>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                Những đặc quyền dành riêng cho bạn
              </h2>
              <p className="mt-3 text-base text-slate-600">
                Chúng tôi cam kết mang lại đãi ngộ xứng đáng và sự an tâm tuyệt đối để bạn yên tâm cống hiến và thăng hoa trong sự nghiệp.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {(careerConfig?.benefits || []).map((benefit, index) => {
                const Icon = benefitIcons[index % benefitIcons.length];
                return (
                  <div
                    key={benefit.id || index}
                    className="group rounded-3xl border border-slate-200/80 bg-white p-7 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-50"
                  >
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
                      {Icon}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      {benefit.title}
                    </h3>
                    {benefit.description && (
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {benefit.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 6. Call to Action Banner */}
        <section className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 py-16 px-4 text-center text-white">
          <div className="relative z-10 mx-auto max-w-3xl space-y-5">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              Sẵn sàng đồng hành cùng chúng tôi?
            </h2>
            <p className="text-base sm:text-lg text-indigo-200">
              Cánh cửa cơ hội nghề nghiệp tại SmartRecruit luôn rộng mở chào đón bạn. Hãy khám phá và gửi hồ sơ ngay hôm nay!
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={scrollToJobs}
                className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-indigo-900 shadow-xl transition-all hover:scale-105 hover:bg-indigo-50"
              >
                <span>Xem tất cả vị trí đang tuyển</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* 7. Public Footer */}
      <PublicFooter />

      {/* 8. Job Detail & Application Modal */}
      <JobDetailModal
        job={selectedJob}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        initialApplyMode={modalApplyMode}
      />
    </div>
  );
};

export default PublicJobListPage;
