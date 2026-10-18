import type { QuestionDifficulty } from '../services/questionService';

export interface GoodAnswerCriteria {
  keyPoints?: string[];
  excellentAnswer?: string; // Khung điểm 4.0 - 5.0
  averageAnswer?: string;   // Khung điểm 2.5 - 3.5
  redFlags?: string;        // Dấu hiệu cảnh báo (Điểm < 2.5)
}

export interface AskedInPreviousRoundInfo {
  isAsked: boolean;
  roundName: string; // Ví dụ: "Vòng Sàng lọc CV", "Vòng HR", "Vòng Kỹ thuật 1"
  interviewerName?: string;
  askedDate?: string;
  score?: number;
  notes?: string;
}

export interface SuggestedQuestionItem {
  id: string;
  content: string;
  difficulty: QuestionDifficulty;
  criterionId: string;
  criterionName: string;
  positionId?: string;
  positionName?: string;
  frameworkName?: string;
  answerHint?: string | null;
  goodAnswerCriteria?: GoodAnswerCriteria;
  askedInPreviousRound?: AskedInPreviousRoundInfo;
}

/**
 * Ngân hàng câu hỏi phỏng vấn chuẩn hóa theo từng vị trí & khung tiêu chí năng lực (AC 1 & AC 2)
 */
export const DEFAULT_SUGGESTED_QUESTIONS: SuggestedQuestionItem[] = [
  // ==================== FRONTEND DEVELOPER ====================
  {
    id: 'sug-fe-01',
    content: 'Bạn hãy giải thích cơ chế Re-rendering trong React và các chiến lược tối ưu hóa hiệu năng (memo, useMemo, useCallback, code splitting)?',
    difficulty: 'MEDIUM',
    criterionId: 'crit-tech-01',
    criterionName: 'Kiến thức chuyên môn cốt lõi',
    positionName: 'Frontend Developer',
    frameworkName: 'Khung năng lực Kỹ thuật Frontend',
    answerHint: 'Tập trung vào Virtual DOM, Reconciliation, khi nào component re-render và tránh premature optimization.',
    goodAnswerCriteria: {
      keyPoints: [
        'Component re-render khi state, props hoặc context thay đổi; component cha re-render thì component con mặc định re-render theo.',
        'Sự khác biệt giữa React.memo (props shallow compare), useMemo (memoize giá trị tính toán tốn kém), useCallback (memoize tham chiếu hàm).',
        'Code splitting với React.lazy() và Suspense để giảm Initial Bundle Size.',
      ],
      excellentAnswer: 'Ứng viên phân tích sâu nguyên nhân re-render thừa (object reference thay đổi), biết dùng React Profiler hoặc Chrome DevTools để đo đạc chỉ số INP/LCP, chỉ ra tác hại của việc lạm dụng useMemo/useCallback khi không cần thiết, và liên hệ bài toán ảo hóa danh sách lớn (Windowing/Virtualization).',
      averageAnswer: 'Nêu được định nghĩa re-render và cú pháp cơ bản của useMemo/useCallback nhưng chưa phân tích rõ chi phí so sánh shallow compare hay cách đo lường hiệu năng thực tế.',
      redFlags: 'Cho rằng dùng useCallback giúp hàm chạy nhanh hơn hoặc bọc mọi component trong React.memo một cách vô tội vạ.',
    },
    askedInPreviousRound: {
      isAsked: true,
      roundName: 'Vòng Sàng lọc CV',
      interviewerName: 'Nguyễn Thùy Linh (Recruiter)',
      askedDate: '12/10/2026',
      notes: 'Ứng viên đã trả lời ở mức khái niệm cơ bản về Virtual DOM trong buổi sơ vấn qua điện thoại.',
    },
  },
  {
    id: 'sug-fe-02',
    content: 'Trong TypeScript, bạn phân biệt giữa `type` và `interface` như thế nào? Khi nào nên sử dụng Declaration Merging và Generic Constraints (`extends`)?',
    difficulty: 'HARD',
    criterionId: 'crit-tech-01',
    criterionName: 'Kiến thức chuyên môn cốt lõi',
    positionName: 'Frontend Developer',
    frameworkName: 'Khung năng lực Kỹ thuật Frontend',
    answerHint: 'So sánh tính năng mở rộng (extends vs intersection &), declaration merging trong interface, union/primitive trong type.',
    goodAnswerCriteria: {
      keyPoints: [
        'Interface hỗ trợ Declaration Merging (hữu ích khi viết thư viện hoặc mở rộng Window/Third-party).',
        'Type hỗ trợ Union, Tuple, Mapped Types, Conditional Types phức tạp mà interface không làm được.',
        'Generic Constraints (`<T extends Record<string, unknown>>`) giúp thu hẹp phạm vi kiểu dữ liệu an toàn.',
      ],
      excellentAnswer: 'Trình bày rành mạch, đưa ra quy chuẩn rõ ràng cho team (ví dụ: dùng interface cho Object/Component Props định nghĩa API, dùng type cho Unions/Utility Types), giải thích được cơ chế Type Narrowing và discriminated unions.',
      averageAnswer: 'Chỉ nêu được interface dùng để định nghĩa object còn type dùng cho kiểu nguyên thủy hoặc gộp kiểu.',
      redFlags: 'Không hiểu Generic trong TypeScript là gì hoặc có thói quen lạm dụng `any`/`as unknown as X`.',
    },
  },
  {
    id: 'sug-fe-03',
    content: 'Hãy mô tả một bài toán xử lý Race Condition trong ứng dụng React (ví dụ: người dùng gõ tìm kiếm liên tục hoặc chuyển tab nhanh) và cách bạn giải quyết?',
    difficulty: 'HARD',
    criterionId: 'crit-tech-02',
    criterionName: 'Tư duy logic & Giải quyết vấn đề',
    positionName: 'Frontend Developer',
    frameworkName: 'Khung năng lực Kỹ thuật Frontend',
    answerHint: 'Đề cập AbortController, cleanup function trong useEffect, hoặc các thư viện như React Query/SWR với cancellation token.',
    goodAnswerCriteria: {
      keyPoints: [
        'Khái niệm Race Condition: Request gửi trước về sau request gửi sau, dẫn đến ghi đè dữ liệu cũ lên kết quả mới.',
        'Sử dụng `AbortController.signal` truyền vào `fetch` hoặc `axios` để hủy bỏ request cũ khi component unmount hoặc query thay đổi.',
        'Sử dụng flag boolean `let isCurrent = true` trong useEffect cleanup hoặc dùng thư viện quản lý server-state.',
      ],
      excellentAnswer: 'Phân tích cả 2 khía cạnh: network-level cancellation (tiết kiệm băng thông) và application-level stale-while-revalidate, chia sẻ ví dụ thực tế đã gặp và cách debug bằng Network tab.',
      averageAnswer: 'Biết dùng debounce để giảm số lượng request nhưng chưa xử lý triệt để trường hợp request trễ trả về.',
      redFlags: 'Không hiểu khái niệm Race Condition trong Web hoặc nghĩ chỉ cần setTimeout là xử lý được.',
    },
    askedInPreviousRound: {
      isAsked: true,
      roundName: 'Vòng Đánh giá Năng lực Kỹ thuật 1',
      interviewerName: 'Phạm Hải Nam (Senior Dev)',
      askedDate: '15/10/2026',
      notes: 'Ứng viên đã trả lời đúng hướng AbortController nhưng chưa viết code mẫu.',
    },
  },

  // ==================== BACKEND ENGINEER ====================
  {
    id: 'sug-be-01',
    content: 'Bạn thiết kế hệ thống Caching đa tầng (Multi-level Caching) như thế nào để xử lý sự cố Cache Penetration (xuyên thủng), Cache Breakdown (sụp đổ) và Cache Avalanche (tuyết lở)?',
    difficulty: 'HARD',
    criterionId: 'crit-tech-01',
    criterionName: 'Kiến thức chuyên môn cốt lõi',
    positionName: 'Backend Engineer',
    frameworkName: 'Khung năng lực Kỹ thuật Backend',
    answerHint: 'Redis, Bloom Filter, Mutex lock/Distributed lock, Random TTL để tránh hết hạn đồng loạt.',
    goodAnswerCriteria: {
      keyPoints: [
        'Cache Penetration: Truy vấn key không tồn tại cả ở cache lẫn DB -> Giải pháp: Bloom Filter hoặc lưu giá trị Null có TTL ngắn.',
        'Cache Breakdown: Một Hot Key hết hạn tại thời điểm có lượng lớn request đồng thời -> Giải pháp: Distributed Lock (Redlock) hoặc cập nhật bất đồng bộ.',
        'Cache Avalanche: Hàng loạt key cùng hết hạn cùng lúc làm nghẽn DB -> Giải pháp: Thêm giá trị ngẫu nhiên (Jitter) vào TTL.',
      ],
      excellentAnswer: 'Phân tích trọn vẹn cả 3 kịch bản, nêu chiến lược Cache Invalidation (Cache-Aside, Write-Through, Write-Behind) và cách đảm bảo tính nhất quán dữ liệu (Data Consistency).',
      averageAnswer: 'Nêu được cách dùng Redis cơ bản và TTL nhưng lẫn lộn giữa Cache Breakdown và Cache Avalanche.',
      redFlags: 'Không biết cách xử lý khi Redis bị sập hoặc nghĩ cache luôn tự động nhất quán với database.',
    },
  },
  {
    id: 'sug-be-02',
    content: 'Khi thiết kế RESTful API cho chức năng chuyển khoản hoặc thanh toán, bạn áp dụng kỹ thuật Idempotency (tính lũy thừa) như thế nào để đảm bảo không bị trừ tiền 2 lần?',
    difficulty: 'MEDIUM',
    criterionId: 'crit-tech-02',
    criterionName: 'Tư duy logic & Giải quyết vấn đề',
    positionName: 'Backend Engineer',
    frameworkName: 'Khung năng lực Kỹ thuật Backend',
    answerHint: 'Idempotency Key trong Header, Unique constraint trong DB, cơ chế State Machine và Distributed Lock.',
    goodAnswerCriteria: {
      keyPoints: [
        'Idempotency-Key được sinh từ phía client cho mỗi thao tác giao dịch duy nhất.',
        'Server kiểm tra Idempotency Key trong Redis hoặc bảng giao dịch; nếu đang xử lý thì chặn, nếu đã xong thì trả về kết quả lưu trữ trước đó.',
        'Database Unique Constraint cho `transaction_ref_id` để ngăn ngừa duplicate insert ở tầng lưu trữ.',
      ],
      excellentAnswer: 'Mô tả chi tiết flow xử lý request retry an toàn của mạng, cách xử lý timeout từ Payment Gateway đối tác, và cơ chế hoàn tiền (Compensating Transaction) khi xảy ra lỗi giữa chừng.',
      averageAnswer: 'Chỉ trả lời được việc kiểm tra trạng thái đơn hàng trong database trước khi cập nhật.',
      redFlags: 'Chưa từng nghe qua khái niệm Idempotency hoặc cho rằng chỉ cần frontend disable nút bấm là đủ.',
    },
    askedInPreviousRound: {
      isAsked: true,
      roundName: 'Vòng Sàng lọc CV',
      interviewerName: 'Trần Văn Phỏng Vấn (HR)',
      askedDate: '14/10/2026',
      notes: 'Ứng viên nói có kinh nghiệm làm cổng thanh toán nhưng chưa hỏi sâu kỹ thuật.',
    },
  },

  // ==================== QA / TESTER ====================
  {
    id: 'sug-qa-01',
    content: 'Khi nhận được yêu cầu kiểm thử một tính năng phức tạp nhưng tài liệu đặc tả (SRS) thiếu sót hoặc chưa rõ ràng, bạn sẽ tiếp cận và xây dựng test cases như thế nào?',
    difficulty: 'MEDIUM',
    criterionId: 'crit-tech-02',
    criterionName: 'Tư duy logic & Giải quyết vấn đề',
    positionName: 'QA / QC Engineer',
    frameworkName: 'Khung năng lực Kiểm thử Chất lượng',
    answerHint: 'Chủ động phỏng vấn PO/BA, áp dụng Exploratory Testing, phân tích luồng nghiệp vụ tương đương và ghi chú giả định (assumptions).',
    goodAnswerCriteria: {
      keyPoints: [
        'Chủ động đặt câu hỏi làm rõ với Product Owner / Business Analyst thay vì chờ đợi.',
        'Tạo bảng câu hỏi / danh sách giả định nghiệp vụ (Assumptions Log) và xin xác nhận trước khi viết test cases.',
        'Áp dụng kỹ thuật phân vùng tương đương (Equivalence Partitioning) và phân tích giá trị biên (Boundary Value Analysis).',
      ],
      excellentAnswer: 'Thể hiện tư duy Quality Engineering chủ động: tham gia từ khâu refinement/kick-off, tổ chức 3 Amigos (BA - Dev - QA), phân tích rủi ro và xác định phạm vi kiểm thử hồi quy (Regression Testing).',
      averageAnswer: 'Nói rằng sẽ tự test thử tính năng trên staging rồi hỏi dev xem tính năng hoạt động ra sao.',
      redFlags: 'Thụ động từ chối test vì lý do "không có tài liệu thì không làm được" hoặc đổ lỗi cho BA.',
    },
  },
  {
    id: 'sug-qa-02',
    content: 'Bạn hãy phân biệt giữa Regression Testing, Smoke Testing và Sanity Testing? Khi nào nên tự động hóa (Automation Test) thay vì làm Manual?',
    difficulty: 'EASY',
    criterionId: 'crit-tech-01',
    criterionName: 'Kiến thức chuyên môn cốt lõi',
    positionName: 'QA / QC Engineer',
    frameworkName: 'Khung năng lực Kiểm thử Chất lượng',
    answerHint: 'Khác biệt về phạm vi (scope) và thời điểm thực hiện; tiêu chí ROI khi triển khai Automation Test.',
    goodAnswerCriteria: {
      keyPoints: [
        'Smoke test: Kiểm tra luồng chính (Happy Path) sau mỗi bản build để đảm bảo hệ thống có thể test tiếp.',
        'Sanity test: Kiểm tra nhanh sau khi fix bug hoặc sửa một module cụ thể.',
        'Regression test: Kiểm tra toàn diện để đảm bảo tính năng mới không làm hỏng tính năng cũ.',
        'Tự động hóa khi test suite chạy lặp đi lặp lại nhiều lần, tính năng đã ổn định, dữ liệu test lớn.',
      ],
      excellentAnswer: 'Phân tích ROI của automation testing, biết chọn lọc Test Pyramid (Unit -> Integration -> E2E), không cố tự động hóa 100% các tính năng UI thường xuyên thay đổi.',
      averageAnswer: 'Phân biệt được cơ bản nhưng chưa giải thích rõ khi nào thì KHÔNG nên làm automation test.',
      redFlags: 'Nghĩ rằng Smoke Test và Regression Test là một, hoặc cho rằng Automation test có thể thay thế hoàn toàn Manual test.',
    },
    askedInPreviousRound: {
      isAsked: true,
      roundName: 'Vòng Phỏng vấn Nhân sự (HR)',
      interviewerName: 'Hoàng Mai Phương (HR Lead)',
      askedDate: '13/10/2026',
      notes: 'Đã hỏi lý thuyết cơ bản, ứng viên trả lời lưu loát.',
    },
  },

  // ==================== QUẢN LÝ / TECH LEAD ====================
  {
    id: 'sug-lead-01',
    content: 'Khi xảy ra bất đồng ý kiến gay gắt về mặt giải pháp kỹ thuật giữa hai kỹ sư Senior trong đội ngũ, bạn sẽ đứng ra giải quyết như thế nào để vừa chốt được phương án tốt nhất vừa giữ được tinh thần đoàn kết?',
    difficulty: 'MEDIUM',
    criterionId: 'crit-lead-02',
    criterionName: 'Năng lực lãnh đạo & Quản lý đội ngũ',
    positionName: 'Quản lý / Tech Lead',
    frameworkName: 'Khung năng lực Lãnh đạo & Quản lý',
    answerHint: 'Lắng nghe khách quan, đưa ra ma trận tiêu chí đánh giá (Pros/Cons, chi phí bảo trì, thời gian deliver), làm PoC nếu cần, cam kết Disagree and Commit.',
    goodAnswerCriteria: {
      keyPoints: [
        'Tách biệt con người ra khỏi vấn đề: Tập trung vào bài toán kinh doanh và mục tiêu dự án, không mang tính cá nhân.',
        'Tạo bảng tiêu chí so sánh cụ thể: Performance, Maintainability, Time to Market, Team Familiarity.',
        'Khuyến khích làm PoC (Proof of Concept) ngắn hạn để số liệu thực tế chứng minh.',
        'Áp dụng nguyên tắc "Disagree and Commit": Sau khi quyết định được chốt, toàn đội ngũ cùng dốc sức thực thi.',
      ],
      excellentAnswer: 'Thể hiện EQ cao và kỹ năng điều phối cuộc họp tranh luận lành mạnh, biến xung đột thành cơ hội học hỏi kỹ thuật, tôn trọng năng lực của cả hai phía và theo dõi động lực sau quyết định.',
      averageAnswer: 'Nói rằng mình là sếp nên sẽ tự quyết định phương án mình thích rồi bắt mọi người nghe theo.',
      redFlags: 'Đùn đẩy trách nhiệm lên cấp trên hoặc dùng quyền lực áp đặt thô bạo khiến thành viên bất mãn.',
    },
  },

  // ==================== TIÊU CHÍ CHUNG CHO MỌI VỊ TRÍ ====================
  {
    id: 'sug-gen-01',
    content: 'Bạn hãy kể lại một sự cố lỗi nghiêm trọng (Production Incident) hoặc một lần phạm sai lầm kỹ thuật mà bạn từng gặp phải? Bạn đã khắc phục và rút ra bài học gì?',
    difficulty: 'MEDIUM',
    criterionId: 'crit-tech-02',
    criterionName: 'Tư duy logic & Giải quyết vấn đề',
    positionName: 'Tất cả vị trí',
    frameworkName: 'Khung năng lực Nền tảng',
    answerHint: 'Phương pháp STAR (Situation, Task, Action, Result), tinh thần chịu trách nhiệm và văn hóa Blameless Post-mortem.',
    goodAnswerCriteria: {
      keyPoints: [
        'Mô tả trung thực tình huống sự cố, tác động tới người dùng và cách phản ứng bình tĩnh.',
        'Các bước cô lập sự cố, rollback hoặc áp dụng hotfix khẩn cấp để giảm thiểu thiệt hại.',
        'Quy trình Root Cause Analysis (5 Whys) và giải pháp phòng ngừa dài hạn (bổ sung alert, unit test, review quy trình).',
      ],
      excellentAnswer: 'Trung thực nhận lỗi, không đổ lỗi cho đồng nghiệp hay hoàn cảnh, thể hiện tư duy học hỏi từ thất bại, xây dựng quy chuẩn tự động hóa để lỗi tương tự không thể tái diễn.',
      averageAnswer: 'Kể một lỗi rất nhỏ và chung chung như quên semicolon hoặc đổ lỗi hoàn toàn cho người khác.',
      redFlags: 'Tuyên bố mình chưa bao giờ phạm sai lầm hoặc đổ lỗi do khách hàng/do sếp ép deadline.',
    },
  },
  {
    id: 'sug-gen-02',
    content: 'Khi gặp một yêu cầu thay đổi gấp từ phía Ban Giám đốc hoặc Khách hàng sát ngày bàn giao (Deadline), bạn sẽ sắp xếp và đàm phán lại khối lượng công việc như thế nào?',
    difficulty: 'EASY',
    criterionId: 'crit-tech-03',
    criterionName: 'Kỹ năng làm việc nhóm & Giao tiếp',
    positionName: 'Tất cả vị trí',
    frameworkName: 'Khung năng lực Nền tảng',
    answerHint: 'Đánh giá mức độ ưu tiên, đàm phán phạm vi (Scope negotiation), minh bạch rủi ro và giải pháp thay thế.',
    goodAnswerCriteria: {
      keyPoints: [
        'Đánh giá tác động (Impact Analysis) đến deadline hiện tại và các tính năng đang làm dở.',
        'Đàm phán giải pháp Win-Win: Đưa ra lựa chọn cắt giảm phạm vi (Scope Trimming) của tính năng ít quan trọng hơn.',
        'Minh bạch rủi ro về chất lượng (Tech Debt, Testing time) thay vì mù quáng hứa hẹn.',
      ],
      excellentAnswer: 'Thể hiện kỹ năng giao tiếp chuyên nghiệp với các bên liên quan, chủ động đề xuất giải pháp khả thi nhất kèm theo kế hoạch dự phòng (Plan B), bảo vệ sức khỏe đội ngũ.',
      averageAnswer: 'Chỉ nói là sẽ cố gắng làm thêm giờ (OT) cật lực để kịp chạy deadline.',
      redFlags: 'Phản ứng tiêu cực, càu nhàu chống đối hoặc hứa làm được mà không kiểm tra khả thi.',
    },
    askedInPreviousRound: {
      isAsked: true,
      roundName: 'Vòng Phỏng vấn Nhân sự (HR)',
      interviewerName: 'Hoàng Mai Phương (HR Lead)',
      askedDate: '13/10/2026',
      notes: 'Ứng viên trả lời có kinh nghiệm làm việc linh hoạt và đàm phán phạm vi tốt.',
    },
  },
  {
    id: 'sug-gen-03',
    content: 'Bạn học hỏi và cập nhật kiến thức công nghệ mới như thế nào trong thời gian rảnh rỗi? Chia sẻ một công nghệ hoặc công cụ mới bạn vừa tìm hiểu gần đây?',
    difficulty: 'EASY',
    criterionId: 'crit-tech-04',
    criterionName: 'Độ phù hợp văn hóa & Tinh thần học hỏi',
    positionName: 'Tất cả vị trí',
    frameworkName: 'Khung năng lực Nền tảng',
    answerHint: 'Nguồn học tập uy tín (Official Docs, RFC, GitHub, Tech Blogs), dự án pet-project thực hành.',
    goodAnswerCriteria: {
      keyPoints: [
        'Kênh tiếp cận thông tin có chọn lọc và uy tín (GitHub Trending, Official Release Notes, Tech Conferences).',
        'Có thói quen thực hành (hands-on) qua pet project hoặc đóng góp open-source thay vì chỉ đọc lý thuyết.',
        'Chia sẻ kiến thức lại cho cộng đồng hoặc đồng nghiệp trong nhóm.',
      ],
      excellentAnswer: 'Nhiệt huyết chia sẻ về công nghệ mới vừa học, phân tích được ưu/nhược điểm thực tế và khả năng áp dụng vào sản phẩm công ty.',
      averageAnswer: 'Chỉ kể tên một công nghệ nổi tiếng nhưng không giải thích được nó giải quyết bài toán gì.',
      redFlags: 'Nói rằng chỉ học khi công ty yêu cầu hoặc đã vài năm không tìm hiểu thêm điều gì mới.',
    },
  },
];

