/**
 * SignUpCard Component
 * Contains heading and SignUpForm inside a styled card
 */

import SignUpForm from "./SignUpForm";
import { Link } from "react-router-dom";

const SignUpCard = () => {
  return (
    <div>
      <div className="text-center">
        <h1 className="text-2xl font-bold text-indigo-900">Join {import.meta.env.VITE_APP_NAME}</h1>
        <p className="text-sm text-gray-500 mt-1">Connect, Share, and Engage!</p>
      </div>

      <SignUpForm />

      <p className="text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link to="/signin" className="text-indigo-600 font-medium hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
};

export default SignUpCard;
