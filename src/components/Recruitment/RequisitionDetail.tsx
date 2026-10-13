import React from 'react';
import { JobRequisitionDetailsUI, type JobRequisitionDetailsUIProps } from './JobRequisitionDetailsUI';
import { ApprovalActionUI } from './ApprovalActionUI';
import { JobReqStatusActionsUI } from './JobReqStatusActionsUI';

export interface RequisitionDetailProps extends JobRequisitionDetailsUIProps {
  requisitionId?: string | number;
  status?: string;
  onStatusChangeSuccess?: () => void;
  onApprovalSuccess?: () => void;
}

export const RequisitionDetail: React.FC<RequisitionDetailProps> = ({
  requisitionId,
  status,
  onStatusChangeSuccess,
  onApprovalSuccess,
  ...detailsProps
}) => {
  return (
    <div className="space-y-6">
      <JobRequisitionDetailsUI {...detailsProps} />
      
      {requisitionId && (
        <div className="mx-auto max-w-4xl space-y-6 px-4 sm:px-6 lg:px-8">
          {/* Action phê duyệt / Yêu cầu chỉnh sửa */}
          {(status === 'PENDING_APPROVAL' || status === 'PENDING') && (
            <ApprovalActionUI
              requestId={requisitionId}
              onSuccess={onApprovalSuccess}
            />
          )}

          {/* Quản lý trạng thái hoàn thành (FILLED) / tạm dừng / hủy */}
          <JobReqStatusActionsUI
            jobRequisitionId={requisitionId}
            onSuccess={onStatusChangeSuccess}
          />
        </div>
      )}
    </div>
  );
};

export { JobRequisitionDetailsUI };
export default RequisitionDetail;

