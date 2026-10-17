import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { OfferApprovalScreen } from '../../components/Offer/OfferApprovalScreen';

/**
 * Trang phê duyệt Offer dành cho các cấp Quản lý (Trưởng phòng / Giám đốc / CEO)
 * Jira Subtask: TKNHTTDNB1-498 (Story TKNHTTDNB1-72)
 */
export const OfferApprovalPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <OfferApprovalScreen
        offerId={id}
        onBack={handleBack}
      />
    </div>
  );
};

export default OfferApprovalPage;
