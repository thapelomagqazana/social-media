/**
 * SignUp Page
 * Renders full-screen layout with background gradient and SignUpCard
 * Adjusts for fixed navbar height to prevent overlap
 */

import SignUpCard from "../components/auth/SignUpCard";
import AuthWrapper from "../components/auth/AuthWrapper";

const SignUp = () => {
  return (
    <AuthWrapper>
      <SignUpCard />
    </AuthWrapper>
  );
};

export default SignUp;
