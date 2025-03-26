/**
 * Footer Component
 * Displays app copyright,
 * and adapts to all screen sizes
 */

const Footer = () => {
  return (
    <footer className="w-full bg-indigo-950 text-white py-6 px-4 sm:px-6 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
        <p className="text-sm text-center sm:text-left">
          © {new Date().getFullYear()} {import.meta.env.VITE_APP_NAME}. All rights reserved.
        </p>

        <p className="text-sm text-center sm:text-right">
          Designed & Built with 💜 by <span className="font-semibold">Thapelo Magqazana</span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
