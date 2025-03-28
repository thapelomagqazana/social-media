/**
 * SignIn Page - wraps the SignInForm in a styled background
 */
import SignInForm from "../components/auth/SignInForm";
import AuthWrapper from "../components/auth/AuthWrapper";

const SignInPage = () => {
  return (
    <AuthWrapper>
      <SignInForm />
    </AuthWrapper>
  );
};

export default SignInPage;
