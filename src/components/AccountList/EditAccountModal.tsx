import React from 'react';
import type { UserAccount } from '../../types/account';
import { EditAccountPage } from '../../pages/AccountList/EditAccountPage';

export interface EditAccountModalProps {
  isOpen: boolean;
  account: UserAccount | null;
  onClose: () => void;
  onSave: (updatedAccount: UserAccount) => Promise<void> | void;
}

export const EditAccountModal: React.FC<EditAccountModalProps> = ({
  isOpen,
  account,
  onClose,
  onSave,
}) => {
  if (!isOpen || !account) return null;

  return (
    <EditAccountPage
      account={account}
      isOpen={isOpen}
      onClose={onClose}
      onSave={onSave}
    />
  );
};

export default EditAccountModal;
