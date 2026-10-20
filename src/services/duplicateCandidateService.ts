import type {
  UnifiedCandidate,
  CandidateTag,
  InternalNote,
  ApplicationRecord,
} from '../types/candidate';
import type {
  DuplicateCandidateComparison,
  MergeFieldSelection,
  MergeHistoryRecord,
} from '../types/duplicateCandidate';
import axiosClient from '../utils/axiosClient';

const STORAGE_KEY_MERGE_HISTORY = 'smart_recruit_merge_history';

/**
 * Mock hồ sơ trùng (Trùng Email và Số điện thoại với CAN-2026-0891)
 */
export const MOCK_DUPLICATE_CANDIDATE: UnifiedCandidate = {
  id: 'can-dup-0942',
  candidateCode: 'CAN-2026-0942',
  fullName: 'Lê Quốc Bảo (Robert Le)',
  email: 'bao.lequoc.tech@gmail.com',
  phone: '0918 234 567',
  currentTitle: 'Lead Frontend Architect & Tech Lead',
  experienceYears: 6,
  rating: 5,
  coverLetter:
    'Chào Quý công ty, tôi cập nhật thêm năng lực xây dựng Design System và Micro-frontends tại dự án gần nhất. Tôi mong muốn ứng tuyển vị trí Tech Lead để phát triển sản phẩm quy mô lớn.',
  tags: [
    { id: 'tag-dup-1', name: 'Micro-frontends', colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { id: 'tag-dup-2', name: 'Design System', colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { id: 'tag-dup-3', name: 'Senior React', colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  ],
  notes: [
    {
      id: 'note-dup-1',
      content:
        'Hồ sơ nộp mới qua LinkedIn Career. Đã kiểm tra CV thấy năng lực cập nhật thêm nhiều kinh nghiệm quản lý nhóm 8 engineers.',
      authorName: 'Hoàng Thùy Linh',
      authorRole: 'Talent Acquisition Specialist',
      createdAt: '2026-10-14T07:15:00.000Z',
      category: 'SCREENING',
    },
  ],
  applications: [
    {
      id: 'app-2026-003',
      jobPostingId: 'jp-demo-501',
      jobCode: 'REQ-2026-105',
      jobTitle: 'Frontend Technical Lead (Enterprise Architecture)',
      departmentName: 'Khối Công nghệ & Sản phẩm',
      appliedAt: '2026-10-14T07:00:00.000Z',
      source: {
        type: 'CAREER_PAGE',
        label: 'Cổng nghề nghiệp (Career Page)',
      },
      recruiterId: 'usr-hr-001',
      recruiterName: 'Nguyễn Văn Minh',
      hiringManagerId: 'usr-mgr-002',
      hiringManagerName: 'Đặng Tuấn Anh',
      stage: 'NEW',
      cvFileName: 'CV_Robert_LeQuocBao_TechLead_2026_Updated.pdf',
      cvFileSize: 1024 * 920, // 920KB
      cvFileType: 'pdf',
      cvFileUrl: '/assets/sample-cv-updated.pdf',
      isCurrent: true,
    },
  ],
  currentApplicationId: 'app-2026-003',
  createdAt: '2026-10-14T07:00:00.000Z',
  updatedAt: '2026-10-14T07:15:00.000Z',
};

export const duplicateCandidateService = {
  /**
   * Phát hiện hồ sơ ứng viên trùng khớp Email hoặc Số điện thoại (AC 1)
   */
  async detectDuplicate(candidate: UnifiedCandidate): Promise<DuplicateCandidateComparison | null> {
    try {
      const response = await axiosClient.get<DuplicateCandidateComparison>(
        `/candidates/${candidate.id}/duplicates`
      );
      if (response && response.data) {
        return response.data;
      }
    } catch {
      // Offline fallback
    }

    // Kiểm tra giả lập: nếu là ứng viên demo thì phát hiện trùng hồ sơ MOCK_DUPLICATE_CANDIDATE
    if (
      candidate.email.toLowerCase() === MOCK_DUPLICATE_CANDIDATE.email.toLowerCase() ||
      candidate.phone.replace(/\s+/g, '') === MOCK_DUPLICATE_CANDIDATE.phone.replace(/\s+/g, '')
    ) {
      const isEmailMatch =
        candidate.email.toLowerCase() === MOCK_DUPLICATE_CANDIDATE.email.toLowerCase();
      const isPhoneMatch =
        candidate.phone.replace(/\s+/g, '') === MOCK_DUPLICATE_CANDIDATE.phone.replace(/\s+/g, '');

      return {
        primaryCandidate: candidate,
        duplicateCandidate: MOCK_DUPLICATE_CANDIDATE,
        matchReason: isEmailMatch && isPhoneMatch ? 'BOTH' : isEmailMatch ? 'EMAIL' : 'PHONE',
        matchValue: isEmailMatch && isPhoneMatch
          ? `${candidate.email} & ${candidate.phone}`
          : isEmailMatch
          ? candidate.email
          : candidate.phone,
      };
    }

    return null;
  },

  /**
   * Thực hiện Gộp hai hồ sơ thành một hồ sơ duy nhất (AC 2, AC 3 & AC 4)
   * Giữ lại toàn bộ lịch sử ứng tuyển, tệp CV, Tags và Notes từ cả hai hồ sơ.
   */
  async mergeCandidates(
    primary: UnifiedCandidate,
    duplicate: UnifiedCandidate,
    fieldSelections: MergeFieldSelection
  ): Promise<{ mergedCandidate: UnifiedCandidate; mergeRecord: MergeHistoryRecord }> {
    // 1. Hợp nhất thông tin theo lựa chọn của Recruiter
    const mergedFullName =
      fieldSelections.fullName === 'primary' ? primary.fullName : duplicate.fullName;
    const mergedEmail =
      fieldSelections.email === 'primary' ? primary.email : duplicate.email;
    const mergedPhone =
      fieldSelections.phone === 'primary' ? primary.phone : duplicate.phone;
    const mergedCurrentTitle =
      fieldSelections.currentTitle === 'primary' ? primary.currentTitle : duplicate.currentTitle;
    const mergedExperienceYears =
      fieldSelections.experienceYears === 'primary'
        ? primary.experienceYears
        : duplicate.experienceYears;
    const mergedCoverLetter =
      fieldSelections.coverLetter === 'primary' ? primary.coverLetter : duplicate.coverLetter;
    const mergedRating =
      fieldSelections.rating === 'primary' ? primary.rating : duplicate.rating;

    // 2. Bảo toàn toàn bộ Lịch sử các lần ứng tuyển (AC 3)
    const existingAppIds = new Set(primary.applications.map((a) => a.id));
    const mergedApplications: ApplicationRecord[] = [...primary.applications];

    for (const app of duplicate.applications) {
      if (!existingAppIds.has(app.id)) {
        mergedApplications.push(app);
      }
    }
    // Sắp xếp các lần ứng tuyển từ mới nhất đến cũ hơn theo appliedAt
    mergedApplications.sort(
      (a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
    );

    // 3. Bảo toàn và hợp nhất toàn bộ Nhãn Tags (loại bỏ trùng lặp tên)
    const tagNames = new Set<string>();
    const mergedTags: CandidateTag[] = [];

    for (const tag of [...primary.tags, ...duplicate.tags]) {
      const lowerName = tag.name.trim().toLowerCase();
      if (!tagNames.has(lowerName)) {
        tagNames.add(lowerName);
        mergedTags.push(tag);
      }
    }

    // 4. Bảo toàn và hợp nhất toàn bộ Ghi chú nội bộ Notes (sắp xếp mới nhất lên đầu)
    const existingNoteIds = new Set(primary.notes.map((n) => n.id));
    const mergedNotes: InternalNote[] = [...primary.notes];

    for (const note of duplicate.notes) {
      if (!existingNoteIds.has(note.id)) {
        mergedNotes.push(note);
      }
    }
    mergedNotes.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 giờ sau

    const mergedCandidate: UnifiedCandidate = {
      ...primary,
      fullName: mergedFullName,
      email: mergedEmail,
      phone: mergedPhone,
      currentTitle: mergedCurrentTitle,
      experienceYears: mergedExperienceYears,
      coverLetter: mergedCoverLetter,
      rating: mergedRating,
      applications: mergedApplications,
      tags: mergedTags,
      notes: mergedNotes,
      updatedAt: now.toISOString(),
    };

    const mergeRecord: MergeHistoryRecord = {
      id: `merge-${Date.now()}`,
      primaryCandidateId: primary.id,
      duplicateCandidateId: duplicate.id,
      mergedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      canUndo: true,
      originalPrimary: primary,
      originalDuplicate: duplicate,
      fieldSelections,
    };

    try {
      await axiosClient.post(`/candidates/${primary.id}/merge`, {
        duplicateCandidateId: duplicate.id,
        fieldSelections,
      });
    } catch {
      // Offline fallback
    }

    // Lưu vào LocalStorage
    try {
      localStorage.setItem(`smart_recruit_unified_candidates_${primary.id}`, JSON.stringify(mergedCandidate));
      const historyList: MergeHistoryRecord[] = JSON.parse(
        localStorage.getItem(STORAGE_KEY_MERGE_HISTORY) || '[]'
      );
      historyList.unshift(mergeRecord);
      localStorage.setItem(STORAGE_KEY_MERGE_HISTORY, JSON.stringify(historyList));
    } catch {
      // Bỏ qua
    }

    return { mergedCandidate, mergeRecord };
  },

  /**
   * Hoàn tác gộp hồ sơ trong vòng 24 giờ (AC 4)
   */
  async undoMerge(mergeRecordId: string): Promise<{
    restoredPrimary: UnifiedCandidate;
    restoredDuplicate: UnifiedCandidate;
  }> {
    const historyList: MergeHistoryRecord[] = JSON.parse(
      localStorage.getItem(STORAGE_KEY_MERGE_HISTORY) || '[]'
    );
    const recordIndex = historyList.findIndex((r) => r.id === mergeRecordId);

    if (recordIndex === -1) {
      throw new Error('Không tìm thấy thông tin bản ghi gộp hồ sơ này.');
    }

    const record = historyList[recordIndex];
    const now = new Date();
    const expiresAt = new Date(record.expiresAt);

    if (now > expiresAt || !record.canUndo) {
      throw new Error('Đã quá thời hạn 24 giờ kể từ thời điểm gộp. Không thể hoàn tác.');
    }

    try {
      await axiosClient.post(`/candidates/merge/${mergeRecordId}/undo`);
    } catch {
      // Offline fallback
    }

    // Khôi phục trạng thái ban đầu
    record.canUndo = false;
    historyList[recordIndex] = record;
    try {
      localStorage.setItem(STORAGE_KEY_MERGE_HISTORY, JSON.stringify(historyList));
      localStorage.setItem(
        `smart_recruit_unified_candidates_${record.originalPrimary.id}`,
        JSON.stringify(record.originalPrimary)
      );
      localStorage.setItem(
        `smart_recruit_unified_candidates_${record.originalDuplicate.id}`,
        JSON.stringify(record.originalDuplicate)
      );
    } catch {
      // Bỏ qua
    }

    return {
      restoredPrimary: record.originalPrimary,
      restoredDuplicate: record.originalDuplicate,
    };
  },

  /**
   * Lấy bản ghi gộp còn hiệu lực hoàn tác (trong vòng 24 giờ) cho một hồ sơ
   */
  getActiveMergeRecord(candidateId: string): MergeHistoryRecord | null {
    try {
      const historyList: MergeHistoryRecord[] = JSON.parse(
        localStorage.getItem(STORAGE_KEY_MERGE_HISTORY) || '[]'
      );
      const record = historyList.find(
        (r) => (r.primaryCandidateId === candidateId || r.duplicateCandidateId === candidateId) && r.canUndo
      );
      if (!record) return null;

      const now = new Date();
      const expiresAt = new Date(record.expiresAt);
      if (now <= expiresAt) {
        return record;
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Tính toán thời gian hoàn tác còn lại (giờ và phút)
   */
  calculateRemainingTime(expiresAt: string): { hours: number; minutes: number; isExpired: boolean; text: string } {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) {
      return { hours: 0, minutes: 0, isExpired: true, text: 'Hết hạn hoàn tác' };
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return {
      hours,
      minutes,
      isExpired: false,
      text: hours > 0 ? `${hours} giờ ${minutes} phút` : `${minutes} phút`,
    };
  },
};

export default duplicateCandidateService;

