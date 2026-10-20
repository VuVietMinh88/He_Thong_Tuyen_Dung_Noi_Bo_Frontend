import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CandidateEvaluationSummaryView } from '../../components/Candidate/EvaluationSummary/CandidateEvaluationSummaryView';
import { useToast } from '../../components/notifications/useToast';
import type { FinalHiringDecisionRecord } from '../../types/candidateEvaluationSummary';

export const CandidateEvaluationSummaryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleBack = () => {
    navigate(-1);
  };

  const handleDecisionUpdated = (decision: FinalHiringDecisionRecord) => {
    let msg = 'Đã cập nhật quyết định tuyển dụng thành công.';
    if (decision.status === 'OFFER') {
      msg = `Đã phê duyệt đề nghị tuyển dụng (Offer: ${decision.offeredSalaryFormatted || ''}).`;
    } else if (decision.status === 'TALENT_POOL') {
      msg = `Đã lưu hồ sơ ứng viên vào Kho dữ liệu tiềm năng (${decision.talentPoolCategory || ''}).`;
    } else if (decision.status === 'REJECT') {
      msg = `Đã xác nhận từ chối hồ sơ ứng viên.`;
    }

    addToast({
      type: 'success',
      message: msg,
    });
  };

  return (
    <CandidateEvaluationSummaryView
      candidateId={id}
      onBack={handleBack}
      onDecisionUpdated={handleDecisionUpdated}
    />
  );
};

export default CandidateEvaluationSummaryPage;
