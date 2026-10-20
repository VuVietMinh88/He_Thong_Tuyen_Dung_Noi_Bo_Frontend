import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { InterviewSuggestedQuestions } from '../src/components/Interview/InterviewSuggestedQuestions';
import { DEFAULT_SUGGESTED_QUESTIONS, type SuggestedQuestionItem } from '../src/data/suggestedQuestionsData';

describe('InterviewSuggestedQuestions (S7-02 / TKNHTTDNB1-480)', () => {
  const customQuestions: SuggestedQuestionItem[] = [
    {
      id: 'custom-q-01',
      content: 'Bạn xử lý state management trong React bằng Redux Toolkit hoặc Zustand như thế nào?',
      difficulty: 'MEDIUM',
      criterionId: 'crit-tech-01',
      criterionName: 'Kiến thức chuyên môn cốt lõi',
      positionName: 'Frontend Developer',
      frameworkName: 'Khung năng lực Frontend',
      answerHint: 'Tập trung vào cấu trúc slice, immutability, selectors và middleware.',
      goodAnswerCriteria: {
        keyPoints: [
          'Sử dụng createSlice và Immer để viết reducer mutable một cách an toàn.',
          'Quản lý Async Thunk để gọi API và dispatch actions.',
        ],
        excellentAnswer: 'Phân tích được khi nào nên dùng local state, server state (React Query) và global client state.',
        averageAnswer: 'Chỉ biết viết slice cơ bản theo tài liệu.',
        redFlags: 'Đưa toàn bộ mọi dữ liệu form tạm thời vào global store.',
      },
      askedInPreviousRound: {
        isAsked: true,
        roundName: 'Vòng Sàng lọc CV',
        interviewerName: 'Nguyễn Thùy Linh',
        askedDate: '12/10/2026',
        notes: 'Ứng viên trả lời có kinh nghiệm dùng Redux Toolkit 2 năm.',
      },
    },
    {
      id: 'custom-q-02',
      content: 'Kể lại một lần bạn giải quyết xung đột với đồng nghiệp về kiến trúc hệ thống?',
      difficulty: 'EASY',
      criterionId: 'crit-tech-03',
      criterionName: 'Kỹ năng làm việc nhóm & Giao tiếp',
      positionName: 'Tất cả vị trí',
      frameworkName: 'Khung năng lực Nền tảng',
      goodAnswerCriteria: {
        keyPoints: ['Tôn trọng ý kiến khác biệt', 'Tìm kiếm giải pháp Win-Win'],
        excellentAnswer: 'Lắng nghe phản biện và dùng số liệu thực tế để thuyết phục.',
      },
    },
  ];

  describe('AC 1: Bộ lọc thông minh theo chức danh & Tiêu chí đánh giá (Filtering System)', () => {
    it('hiển thị đầy đủ tiêu đề, các dropdown lọc chức danh, tiêu chí năng lực, mức độ khó và tình trạng hỏi', () => {
      const html = renderToString(
        <InterviewSuggestedQuestions
          isOpen={true}
          onClose={() => {}}
          jobTitle="Frontend Developer"
          candidateName="Đặng Tuấn Anh"
          currentRoundName="Vòng Chuyên môn"
          initialQuestions={customQuestions}
        />,
      );

      // Tiêu đề & Thông tin ứng viên
      expect(html).toContain('Ngân hàng câu hỏi gợi ý');
      expect(html).toContain('Đặng Tuấn Anh');
      expect(html).toContain('Vòng Chuyên môn');

      // Bộ lọc Chức danh & Tiêu chí
      expect(html).toContain('Chức danh tuyển dụng');
      expect(html).toContain('Tiêu chí năng lực');
      expect(html).toContain('Mức độ khó');
      expect(html).toContain('Tình trạng câu hỏi');

      // Ô tìm kiếm
      expect(html).toContain('placeholder="Tìm theo nội dung câu hỏi, từ khóa kỹ thuật, gợi ý đáp án..."');
    });

    it('hiển thị thống kê nhanh số câu hỏi, câu đã hỏi vòng trước và vòng này', () => {
      const html = renderToString(
        <InterviewSuggestedQuestions
          isOpen={true}
          onClose={() => {}}
          initialQuestions={customQuestions}
        />,
      );

      expect(html).toContain('Hiển thị:');
      expect(html).toContain('Đã hỏi vòng trước:');
      expect(html).toContain('Đã hỏi vòng này:');
    });
  });

  describe('AC 2: Chi tiết câu hỏi, Gợi ý đáp án & Đánh dấu câu đã hỏi vòng trước (Question Details & Asked History)', () => {
    it('hiển thị huy hiệu cảnh báo "Đã hỏi ở vòng trước" rõ ràng kèm tên vòng phỏng vấn', () => {
      const html = renderToString(
        <InterviewSuggestedQuestions
          isOpen={true}
          onClose={() => {}}
          initialQuestions={customQuestions}
        />,
      );

      // Câu 1 đã hỏi ở Vòng Sàng lọc CV
      expect(html).toContain('Đã hỏi ở Vòng Sàng lọc CV');
      expect(html).toContain('Lưu ý tránh hỏi trùng: Câu hỏi đã được thực hiện tại Vòng Sàng lọc CV');
      expect(html).toContain('Nguyễn Thùy Linh');
    });

    it('nhận diện câu đã hỏi vòng trước thông qua previouslyAskedQuestionIds prop', () => {
      const questionsWithoutHistory: SuggestedQuestionItem[] = [
        {
          id: 'q-external-prev',
          content: 'Giải thích nguyên lý SOLID trong thiết kế hướng đối tượng?',
          difficulty: 'HARD',
          criterionId: 'crit-tech-01',
          criterionName: 'Kiến thức chuyên môn cốt lõi',
        },
      ];

      const html = renderToString(
        <InterviewSuggestedQuestions
          isOpen={true}
          onClose={() => {}}
          initialQuestions={questionsWithoutHistory}
          previouslyAskedQuestionIds={['q-external-prev']}
        />,
      );

      expect(html).toContain('Đã hỏi ở vòng trước');
    });

    it('cung cấp các nút thao tác nhanh: Đánh dấu đã hỏi, Sao chép câu hỏi, Xem gợi ý đáp án', () => {
      const html = renderToString(
        <InterviewSuggestedQuestions
          isOpen={true}
          onClose={() => {}}
          initialQuestions={customQuestions}
        />,
      );

      expect(html).toContain('Đánh dấu đã hỏi');
      expect(html).toContain('Sao chép');
      expect(html).toContain('Xem gợi ý đáp án tốt');
    });

    it('hiển thị chi tiết khung đánh giá năng lực, ý then chốt và dấu hiệu cảnh báo', () => {
      const html = renderToString(
        <InterviewSuggestedQuestions
          isOpen={true}
          onClose={() => {}}
          initialQuestions={customQuestions}
        />,
      );

      // Nội dung câu hỏi
      expect(html).toContain('Bạn xử lý state management trong React bằng Redux Toolkit hoặc Zustand như thế nào?');
      expect(html).toContain('Trung bình');
      expect(html).toContain('Kiến thức chuyên môn cốt lõi');
    });
  });

  describe('AC 3: Trải nghiệm người dùng & Giao diện Responsive (UX & UI)', () => {
    it('không render gì khi isOpen là false ở dạng drawer/modal', () => {
      const html = renderToString(
        <InterviewSuggestedQuestions
          isOpen={false}
          onClose={() => {}}
          variant="drawer"
          initialQuestions={customQuestions}
        />,
      );

      expect(html).toBe('');
    });

    it('hỗ trợ variant="inline" nhúng trực tiếp không cần isOpen', () => {
      const html = renderToString(
        <InterviewSuggestedQuestions
          variant="inline"
          initialQuestions={customQuestions}
        />,
      );

      expect(html).toContain('Ngân hàng câu hỏi gợi ý');
      expect(html).not.toContain('fixed inset-0');
    });

    it('hỗ trợ variant="modal" hiển thị dưới dạng hộp thoại trung tâm', () => {
      const html = renderToString(
        <InterviewSuggestedQuestions
          isOpen={true}
          onClose={() => {}}
          variant="modal"
          initialQuestions={customQuestions}
        />,
      );

      expect(html).toContain('role="dialog"');
      expect(html).toContain('max-w-4xl');
    });

    it('hiển thị thông báo khi không có câu hỏi nào khớp với bộ lọc', () => {
      const html = renderToString(
        <InterviewSuggestedQuestions
          isOpen={true}
          onClose={() => {}}
          initialQuestions={[]}
        />,
      );

      expect(html).toContain('Không tìm thấy câu hỏi phù hợp');
    });

    it('sử dụng ngân hàng câu hỏi mặc định phong phú khi không truyền initialQuestions', () => {
      expect(DEFAULT_SUGGESTED_QUESTIONS.length).toBeGreaterThanOrEqual(10);
      const html = renderToString(
        <InterviewSuggestedQuestions
          isOpen={true}
          onClose={() => {}}
        />,
      );

      expect(html).toContain('Frontend Developer');
      expect(html).toContain('Re-rendering trong React');
    });
  });
});
