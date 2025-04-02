/**
 * Home Page - Newsfeed Layout with LeftSidebar, Center Feed, RightSidebar
 */
import NewsFeed from "../components/feed/NewsFeed";
import LeftSidebar from "../components/LeftSidebar";
import RightSidebar from "../components/RightSidebar";

const Home = () => {
  return (
    <div className="flex min-h-screen pt-20 bg-gray-100 dark:bg-[#111]">
      {/* Left Sidebar */}
      <aside className="hidden lg:block w-[250px] pl-6">
        <LeftSidebar />
      </aside>

      {/* Center Feed */}
      <main className="flex-1 max-w-2xl mx-auto px-4">
        <NewsFeed />
      </main>

      {/* Right Sidebar */}
      <aside className="hidden xl:block w-[300px] pr-6">
        <RightSidebar />
      </aside>
    </div>
  );
};

export default Home;
