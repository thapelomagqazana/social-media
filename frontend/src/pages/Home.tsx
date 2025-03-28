/**
 * Home.tsx - Main feed page
 */
// import Sidebar from "../components/Layout/Sidebar";
// import RightSidebar from "../components/Layout/RightSidebar";
// import NewsFeed from "../components/Feed/NewsFeed";

const Home = () => {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-[#111] dark:to-[#222]">
      {/* <Sidebar /> */}
      <main className="flex-1 max-w-3xl mx-auto px-4 py-6">
        {/* <NewsFeed /> */}
        <h1>Hi, welcome to MERN Social</h1>
      </main>
      {/* <RightSidebar /> */}
    </div>
  );
};

export default Home;
