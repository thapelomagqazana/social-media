/**
 * ProfileSetup Page
 * Users land here after sign-up to set up their profile
 */

import SetupForm from "../components/profileSetup/SetupForm";

const ProfileSetup = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900 text-white flex items-center justify-center p-6 pt-24">
      <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-2xl p-8 w-full max-w-2xl">
        <SetupForm />
      </div>
    </div>
  );
};

export default ProfileSetup;
