import React from "react";
import ChangePasswordForm from "../../components/ChangePassword/ChangePasswordForm";

export const ChangePasswordPage: React.FC = () => {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 px-4 py-10">
      <ChangePasswordForm />
    </div>
  );
};

export default ChangePasswordPage;
