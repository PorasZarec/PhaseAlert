import React, { useState, useEffect } from "react";
import { supabase } from "../../services/supabaseClient";
import NewsCard from "../../components/shared/NewsCard"; // Adjust path if needed
import { Search } from "lucide-react";
import CATEGORIES from "../../data/HelperData"

const CommunityNewsTab = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("alerts") 
        .select(`*, profiles:author_id (full_name)`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNews(data || []);
    } catch (error) {
      console.error("Error fetching news:", error);
    } finally {
      setLoading(false);
    }
  };

  // Unified Filter Logic
  const filteredNews = news.filter((item) => {
    // Check Category
    let matchesCategory = true;
    if (activeCategory === "Urgent") {
        matchesCategory = item.is_urgent === true;
    } else if (activeCategory !== "All") {
        matchesCategory = item.category === activeCategory;
    }

    // Check Search (Title or Body)
    const query = searchQuery.toLowerCase();
    const matchesSearch = item.title.toLowerCase().includes(query) || 
                          (item.body && item.body.toLowerCase().includes(query));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-20">
      
      {/* --- HEADER & FILTERS --- */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 sticky top-0 z-10">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Community Updates</h2>
        
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Search updates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none duration-200"
          />
        </div>

        {/* Categories Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-xl text-sm font-medium transition-colors border 
                ${activeCategory === cat 
                  ? "bg-orange-600 text-white border-orange-600 shadow-sm" 
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* --- NEWS GRID --- */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      ) : filteredNews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNews.map((item) => (
            <NewsCard 
              key={item.id} 
              alert={item} 
              // We don't pass a footer here, so it defaults to "By [Author]"
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-200">
          <p>No updates found.</p>
        </div>
      )}
    </div>
  );
};

export default CommunityNewsTab;