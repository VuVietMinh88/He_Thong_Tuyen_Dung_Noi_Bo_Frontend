import React from "react";
import ResetPasswordForm from "../../components/ResetPassword/ResetPasswordForm";

export const ResetPasswordPage: React.FC = () => {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 px-4 py-10">
      <ResetPasswordForm />
    </div>
  );
};

export default ResetPasswordPage;
