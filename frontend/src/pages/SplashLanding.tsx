import { motion } from "framer-motion";

const SplashLanding = () => {
  return (
    <div className="relative flex items-center justify-center h-screen bg-darkBackground text-white overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-neonPink blur-3xl opacity-30"></div>
        <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-neonBlue blur-3xl opacity-30"></div>
      </div>

      {/* Main Content */}
      <motion.div 
        className="relative z-10 text-center px-6 sm:px-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        {/* Logo / Title */}
        <motion.h1 
          className="text-6xl sm:text-7xl font-extrabold text-neonBlue uppercase tracking-wider"
          whileHover={{ textShadow: "0px 0px 15px #00E5FF" }}
        >
          HoloConnect
        </motion.h1>

        {/* Tagline */}
        <motion.p 
          className="mt-4 text-lg sm:text-xl text-gray-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          The Future of Social Media. <br />
          Powered by AI. Driven by Community.
        </motion.p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <motion.a 
            href="/signup"
            className="px-8 py-4 text-lg font-bold uppercase bg-neonPink text-white rounded-full shadow-neon transition-all duration-300 hover:shadow-glow"
            whileHover={{ scale: 1.1 }}
          >
            Get Started
          </motion.a>
          
          <motion.a 
            href="/explore"
            className="px-8 py-4 text-lg font-bold uppercase border border-neonBlue text-neonBlue rounded-full transition-all duration-300 hover:bg-neonBlue hover:text-black"
            whileHover={{ scale: 1.1 }}
          >
            Explore
          </motion.a>
        </div>
      </motion.div>
    </div>
  );
};

export default SplashLanding;
