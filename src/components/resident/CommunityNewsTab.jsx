import React, { useState, useEffect } from "react";
import { supabase } from "../../services/supabaseClient";
import NewsCard from "../../components/shared/NewsCard"; 
import { Search } from "lucide-react";
import { CATEGORIES } from "../../data/HelperData";

const CommunityNewsTab = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States - Defaulting to "All" (Capitalized)
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

  // --- REFACTORED FILTER LOGIC ---
  const filteredNews = news.filter(item => {
    let matchesCategory = true;
  
    if (activeCategory === "Urgent") {
      // Special case for boolean check
      matchesCategory = item.is_urgent === true;
    } else if (activeCategory !== "All") {
      // Direct comparison: "News" === "News"
      // No .toLowerCase() needed anymore
      matchesCategory = item.category === activeCategory;
    }
  
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      item.title.toLowerCase().includes(q) ||
      item.body?.toLowerCase().includes(q);
  
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-20">
      
      {/* --- HEADER & FILTERS --- */}
        <h2 className="text-xl font-bold text-gray-800 mb-4">Community Updates</h2>
        <div className="sticky top-0 z-10 flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200 ">
          {/* Categories Pills */}
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto rounded-xl p-2 bg-gray-50">
            {CATEGORIES.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`px-4 py-2 font-medium rounded-md text-sm whitespace-nowrap transition-all
                  ${activeCategory === key ? 'bg-amber-100 text-amber-700 shadow-sm ring-1 ring-amber-200' : 'text-gray-500 hover:bg-white'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-grow md:flex-grow-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none w-full duration-200" />
            </div>
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
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-200">
          <p>No updates found.</p>
          {(activeCategory !== "All" || searchQuery) && (
            <button 
                onClick={() => { setActiveCategory("All"); setSearchQuery(""); }}
                className="text-orange-600 text-sm mt-2 hover:underline"
            >
                Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CommunityNewsTab;