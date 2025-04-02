const RightSidebar = () => (
    <div className="space-y-6 sticky top-20 text-sm text-gray-800 dark:text-gray-200">
      <section>
        <h4 className="font-semibold mb-2">Who to Follow</h4>
        <ul className="space-y-1">
          <li>🎯 <span className="hover:text-indigo-500">thapelo_dev</span></li>
          <li>🚀 <span className="hover:text-indigo-500">code_magic</span></li>
        </ul>
      </section>
  
      <section>
        <h4 className="font-semibold mb-2">Trending Topics</h4>
        <ul className="space-y-1 text-indigo-500">
          <li>#buildInPublic</li>
          <li>#mernSocial</li>
          <li>#100DaysOfCode</li>
        </ul>
      </section>
    </div>
  );
  
  export default RightSidebar;
  