import React from "react";
import ForgotPasswordForm from "../../components/ForgotPassword/ForgotPasswordForm";

export const ForgotPasswordPage: React.FC = () => {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 px-4 py-10">
      <ForgotPasswordForm />
    </div>
  );
};

export default ForgotPasswordPage;
