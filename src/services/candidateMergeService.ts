import type {
  UnifiedCandidate,
  CandidateTag,
  InternalNote,
  ApplicationRecord,
} from '../types/candidate';
import type {
  DuplicateCandidateComparison,
  MergeCandidatesPayload,
  DuplicateCheckParams,
  MergeResultResponse,
  MergeHistoryRecord,
} from '../types/duplicateCandidate';
import axiosClient from '../utils/axiosClient';
import { MOCK_DUPLICATE_CANDIDATE } from './duplicateCandidateService';

const STORAGE_KEY_MERGE_HISTORY = 'smart_recruit_merge_history';
const STORAGE_KEY_CANDIDATES = 'smart_recruit_unified_candidates';

/**
 * Lỗi quá thời hạn hoàn tác 24 giờ (400 / 409)
 */
export class UndoExpiredError extends Error {
  status: number;
  constructor(
    message = 'Đã quá thời hạn 24 giờ kể từ thời điểm gộp, hồ sơ đã được chốt vĩnh viễn và không thể hoàn tác.'
  ) {
    super(message);
    this.name = 'UndoExpiredError';
    this.status = 409;
  }
}

/**
 * Lỗi không đủ quyền thao tác gộp / hoàn tác hồ sơ (403 Forbidden)
 */
export class MergePermissionDeniedError extends Error {
  status: number;
  constructor(
    message = 'Bạn không có quyền thực hiện gộp hoặc hoàn tác hồ sơ này (403 Forbidden).'
  ) {
    super(message);
    this.name = 'MergePermissionDeniedError';
    this.status = 403;
  }
}

export const candidateMergeService = {
  /**
   * 1. Gọi API phát hiện hồ sơ trùng theo Email và Số điện thoại (AC 1)
   */
  async checkDuplicateCandidates(
    params: DuplicateCheckParams
  ): Promise<DuplicateCandidateComparison | null> {
    const { email, phone, candidateId } = params;

    try {
      const endpoint = candidateId
        ? `/candidates/${candidateId}/duplicates`
        : '/candidates/duplicates/check';
      const response = await axiosClient.get<DuplicateCandidateComparison>(endpoint, {
        params: { email, phone },
      });
      if (response && response.data) {
        return response.data;
      }
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 403) {
        throw new MergePermissionDeniedError();
      }
      // Offline fallback
    }

    // Logic giả lập kiểm tra trùng:
    // So khớp với hồ sơ MOCK_DUPLICATE_CANDIDATE
    const targetEmail = (email || '').trim().toLowerCase();
    const targetPhone = (phone || '').replace(/\s+/g, '');

    const dupEmail = MOCK_DUPLICATE_CANDIDATE.email.toLowerCase();
    const dupPhone = MOCK_DUPLICATE_CANDIDATE.phone.replace(/\s+/g, '');

    const isEmailMatch = Boolean(targetEmail && targetEmail === dupEmail);
    const isPhoneMatch = Boolean(targetPhone && targetPhone === dupPhone);

    if (isEmailMatch || isPhoneMatch) {
      let primaryCandidate: UnifiedCandidate | null = null;
      if (candidateId) {
        try {
          const stored = localStorage.getItem(`${STORAGE_KEY_CANDIDATES}_${candidateId}`);
          if (stored) primaryCandidate = JSON.parse(stored);
        } catch {
          // Bỏ qua
        }
      }

      if (!primaryCandidate) {
        // Lấy mock mặc định CAN-2026-0891
        const defaultStored = localStorage.getItem(`${STORAGE_KEY_CANDIDATES}_can-demo-891`);
        if (defaultStored) {
          primaryCandidate = JSON.parse(defaultStored);
        }
      }

      if (primaryCandidate) {
        return {
          primaryCandidate,
          duplicateCandidate: MOCK_DUPLICATE_CANDIDATE,
          matchReason: isEmailMatch && isPhoneMatch ? 'BOTH' : isEmailMatch ? 'EMAIL' : 'PHONE',
          matchValue:
            isEmailMatch && isPhoneMatch
              ? `${primaryCandidate.email} & ${primaryCandidate.phone}`
              : isEmailMatch
              ? primaryCandidate.email
              : primaryCandidate.phone,
        };
      }
    }

    return null;
  },

  /**
   * 2. Lấy dữ liệu chi tiết của 2 hồ sơ để hiển thị đối chiếu side-by-side (AC 1 & AC 2)
   */
  async getDuplicateComparison(
    primaryId: string,
    duplicateId: string
  ): Promise<DuplicateCandidateComparison> {
    try {
      const response = await axiosClient.get<DuplicateCandidateComparison>(
        '/candidates/duplicates/compare',
        { params: { primaryId, duplicateId } }
      );
      if (response && response.data) {
        return response.data;
      }
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 403) {
        throw new MergePermissionDeniedError();
      }
    }

    // Fallback lấy từ LocalStorage
    let primary: UnifiedCandidate | null = null;
    let duplicate: UnifiedCandidate | null = null;

    try {
      const storedPrimary = localStorage.getItem(`${STORAGE_KEY_CANDIDATES}_${primaryId}`);
      if (storedPrimary) primary = JSON.parse(storedPrimary);
      const storedDup = localStorage.getItem(`${STORAGE_KEY_CANDIDATES}_${duplicateId}`);
      if (storedDup) duplicate = JSON.parse(storedDup);
    } catch {
      // Bỏ qua
    }

    if (!duplicate) duplicate = MOCK_DUPLICATE_CANDIDATE;
    if (!primary) {
      primary = {
        id: primaryId,
        candidateCode: 'CAN-2026-0891',
        fullName: 'Lê Quốc Bảo',
        email: 'bao.lequoc.tech@gmail.com',
        phone: '0918 234 567',
        currentTitle: 'Senior Frontend Engineer / Tech Lead',
        experienceYears: 5,
        rating: 4,
        coverLetter: 'Thư giới thiệu ứng tuyển ban đầu năm 2025',
        tags: [
          { id: 'tag-1', name: 'Senior React', colorClass: 'bg-indigo-50 text-indigo-700' },
          { id: 'tag-2', name: 'TypeScript', colorClass: 'bg-blue-50 text-blue-700' },
        ],
        notes: [],
        applications: [],
        currentApplicationId: 'app-01',
        createdAt: '2025-08-15T09:30:00.000Z',
        updatedAt: '2026-10-12T10:30:00.000Z',
      };
    }

    return {
      primaryCandidate: primary,
      duplicateCandidate: duplicate,
      matchReason: 'BOTH',
      matchValue: `${primary.email} & ${primary.phone}`,
    };
  },

  /**
   * 3. Gửi yêu cầu gộp hai hồ sơ và bảo toàn toàn bộ dữ liệu (AC 1 & AC 2)
   */
  async mergeCandidates(payload: MergeCandidatesPayload): Promise<MergeResultResponse> {
    const { primaryCandidateId, duplicateCandidateId, fieldSelections } = payload;

    try {
      const response = await axiosClient.post<MergeResultResponse>('/candidates/merge', payload);
      if (response && response.data) {
        return response.data;
      }
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 403) {
        throw new MergePermissionDeniedError();
      }
      if (status === 400 || status === 409) {
        const errorMsg =
          (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Dữ liệu hồ sơ không hợp lệ hoặc hồ sơ đang được xử lý trong tiến trình khác.';
        throw new Error(errorMsg);
      }
      // Offline fallback
    }

    // Lấy 2 hồ sơ gốc
    const comparison = await this.getDuplicateComparison(primaryCandidateId, duplicateCandidateId);
    const { primaryCandidate: primary, duplicateCandidate: duplicate } = comparison;

    // Hợp nhất các trường thông tin theo fieldSelections
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

    // Bảo toàn toàn bộ Lịch sử các đợt ứng tuyển (AC 2)
    const existingAppIds = new Set(primary.applications.map((a) => a.id));
    const mergedApplications: ApplicationRecord[] = [...primary.applications];

    for (const app of duplicate.applications) {
      if (!existingAppIds.has(app.id)) {
        mergedApplications.push(app);
      }
    }
    mergedApplications.sort(
      (a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
    );

    // Bảo toàn và hợp nhất toàn bộ Nhãn Tags
    const tagNames = new Set<string>();
    const mergedTags: CandidateTag[] = [];
    for (const tag of [...primary.tags, ...duplicate.tags]) {
      const lowerName = tag.name.trim().toLowerCase();
      if (!tagNames.has(lowerName)) {
        tagNames.add(lowerName);
        mergedTags.push(tag);
      }
    }

    // Bảo toàn và hợp nhất toàn bộ Ghi chú nội bộ
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
      primaryCandidateId,
      duplicateCandidateId,
      mergedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      canUndo: true,
      originalPrimary: primary,
      originalDuplicate: duplicate,
      fieldSelections,
    };

    // Lưu vào LocalStorage
    try {
      localStorage.setItem(
        `${STORAGE_KEY_CANDIDATES}_${primaryCandidateId}`,
        JSON.stringify(mergedCandidate)
      );
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
   * 4. Gọi API hoàn tác việc gộp hồ sơ trong thời hạn 24 giờ (AC 1 & AC 3)
   */
  async undoMergeCandidates(
    mergeHistoryIdOrCandidateId: string
  ): Promise<{ restoredPrimary: UnifiedCandidate; restoredDuplicate: UnifiedCandidate }> {
    try {
      const response = await axiosClient.post<{
        restoredPrimary: UnifiedCandidate;
        restoredDuplicate: UnifiedCandidate;
      }>(`/candidates/merge/${mergeHistoryIdOrCandidateId}/undo`);
      if (response && response.data) {
        return response.data;
      }
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 403) {
        throw new MergePermissionDeniedError();
      }
      if (status === 400 || status === 409) {
        throw new UndoExpiredError();
      }
      // Offline fallback
    }

    // Xử lý hoàn tác Offline
    const historyList: MergeHistoryRecord[] = JSON.parse(
      localStorage.getItem(STORAGE_KEY_MERGE_HISTORY) || '[]'
    );
    const recordIndex = historyList.findIndex(
      (r) =>
        r.id === mergeHistoryIdOrCandidateId ||
        r.primaryCandidateId === mergeHistoryIdOrCandidateId ||
        r.duplicateCandidateId === mergeHistoryIdOrCandidateId
    );

    if (recordIndex === -1) {
      throw new Error('Không tìm thấy thông tin bản ghi gộp hồ sơ để hoàn tác.');
    }

    const record = historyList[recordIndex];
    const now = new Date();
    const expiresAt = new Date(record.expiresAt);

    if (now > expiresAt || !record.canUndo) {
      throw new UndoExpiredError();
    }

    record.canUndo = false;
    historyList[recordIndex] = record;

    try {
      localStorage.setItem(STORAGE_KEY_MERGE_HISTORY, JSON.stringify(historyList));
      localStorage.setItem(
        `${STORAGE_KEY_CANDIDATES}_${record.originalPrimary.id}`,
        JSON.stringify(record.originalPrimary)
      );
      localStorage.setItem(
        `${STORAGE_KEY_CANDIDATES}_${record.originalDuplicate.id}`,
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
   * 5. Lấy bản ghi gộp còn hiệu lực (hoặc đã chốt) cho hồ sơ ứng viên (AC 3)
   */
  getMergeRecordForCandidate(candidateId: string): MergeHistoryRecord | null {
    try {
      const historyList: MergeHistoryRecord[] = JSON.parse(
        localStorage.getItem(STORAGE_KEY_MERGE_HISTORY) || '[]'
      );
      const record = historyList.find(
        (r) => r.primaryCandidateId === candidateId || r.duplicateCandidateId === candidateId
      );
      return record || null;
    } catch {
      return null;
    }
  },

  /**
   * 6. Tính toán thời gian hoàn tác còn lại trong khung 24 giờ (AC 3)
   */
  calculateRemainingTime(expiresAt: string): {
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
    text: string;
  } {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) {
      return {
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: true,
        text: 'Đã hết thời hạn hoàn tác (Chốt gộp vĩnh viễn)',
      };
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours} giờ`);
    if (minutes > 0 || hours > 0) parts.push(`${minutes} phút`);
    if (parts.length === 0) parts.push(`${seconds} giây`);

    return {
      hours,
      minutes,
      seconds,
      isExpired: false,
      text: parts.join(' '),
    };
  },

  /**
   * 7. Định dạng ngày giờ theo múi giờ Việt Nam (Asia/Ho_Chi_Minh)
   */
  formatVietnamDateTime(dateString: string): string {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(date);
    } catch {
      return dateString;
    }
  },
};

export default candidateMergeService;

