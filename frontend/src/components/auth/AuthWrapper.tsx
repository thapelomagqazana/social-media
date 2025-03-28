/**
 * AuthWrapper - Shared layout for SignIn/SignUp pages
 */
import { ReactNode } from "react";

const AuthWrapper = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 space-y-6">
        {children}
      </div>
    </div>
  );
};

export default AuthWrapper;
