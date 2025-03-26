/**
 * Splash Page - Landing page for the MERN Social app
 * Renders hero section, feature highlights, and call-to-action
 */

import HeroSection from "../components/splash/HeroSection";
import FeatureHighlights from "../components/splash/FeatureHighlights";
import CallToAction from "../components/splash/CallToAction";

const Splash = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900 text-white flex flex-col">
      <HeroSection />
      <FeatureHighlights />
      <CallToAction />
    </div>
  );
};

export default Splash;
