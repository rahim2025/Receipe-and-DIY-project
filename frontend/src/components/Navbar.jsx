import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import {
  LogOut,
  ChefHat,
  User,
  Plus,
  FileText,
  Home,
  Zap,
  Bookmark,
  Store,
  DollarSign,
  Search,
  Menu,
  X,
  Sparkles,
  Shield,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

export const Navbar = () => {
  const { logout, authUser } = useAuthStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setIsMobileMenuOpen(false);
    }
  };

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    window.dispatchEvent(
      new CustomEvent("categoryChange", { detail: { category } })
    );
  };

  return (
    <header className="fixed w-full top-0 z-50">
      {/* Main Navbar */}
      <div className="backdrop-blur-xl bg-white/10 border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            {/* Brand */}
            <Link
              to="/"
              className="flex items-center gap-2 sm:gap-3 hover:scale-105 transition-transform duration-300"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-teal-400 to-violet-500 flex items-center justify-center shadow-md">
                <ChefHat className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
              </div>
              <h1 className="text-base sm:text-lg md:text-xl font-extrabold text-white tracking-wide font-['Poppins']">
                CraftyCook
              </h1>
            </Link>

            {/* Desktop Links */}
            <nav className="hidden lg:flex items-center gap-3">
              <Link to="/" className="nav-link">
                <Home className="w-4 h-4" /> Home
              </Link>
              <Link to="/vendors" className="nav-link">
                <Store className="w-4 h-4" /> Vendors
              </Link>
              <Link to="/price-comparison" className="nav-link">
                <DollarSign className="w-4 h-4" /> Compare
              </Link>
              {authUser && (
                <>
                  <Link to="/ai-assistant" className="nav-link">
                    <Sparkles className="w-4 h-4" /> AI Assistant
                  </Link>
                  <Link to="/bookmarks" className="nav-link">
                    <Bookmark className="w-4 h-4" /> Bookmarked
                  </Link>
                  <Link to="/drafts" className="nav-link">
                    <FileText className="w-4 h-4" /> Drafts
                  </Link>
                </>
              )}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden min-w-[44px] min-h-[44px] w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all duration-300 touch-target"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-white" />
                ) : (
                  <Menu className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-white" />
                )}
              </button>

              {/* Desktop Create */}
              {authUser && (
                <Link
                  to="/create"
                  className="hidden lg:flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  <Plus className="w-4 h-4" /> Create
                </Link>
              )}

              {/* User Menu / Auth */}
              {authUser ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(prev => !prev)}
                    aria-haspopup="true"
                    aria-expanded={showUserMenu}
                    className="min-w-[44px] min-h-[44px] w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-teal-400 to-violet-500 p-0.5 hover:scale-105 transition-transform duration-300 focus:outline-none focus:ring-2 focus:ring-teal-400/50 touch-target"
                  >
                    <img
                      src={
                        authUser.profilePic ||
                        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face"
                      }
                      alt={authUser.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </button>
                  {showUserMenu && (
                    <div
                      className="fixed top-20 sm:top-24 right-3 sm:right-6 w-64 sm:w-72 md:w-80 z-[9999] bg-gray-900 backdrop-blur-xl border-2 border-white/40 p-3 sm:p-4 rounded-2xl shadow-2xl animate-fadeIn"
                      role="menu"
                      style={{ backgroundColor: 'rgba(17, 24, 39, 0.98)' }}
                    >
                      <div className="px-3 py-3 mb-2 border-b border-white/30 bg-slate-800/50 rounded-lg">
                        <p className="text-base font-bold text-white truncate" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>{authUser.username}</p>
                        {authUser.email && (
                          <p className="text-sm text-gray-200 font-medium truncate mt-1" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>{authUser.email}</p>
                        )}
                      </div>
                      <ul className="space-y-1">
                        <li>
                          <Link
                            to="/profile"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white font-medium hover:bg-white/20 transition-colors"
                          >
                            <User className="w-4 h-4 text-blue-300" /> Profile
                          </Link>
                        </li>
                        {authUser?.role === 'admin' && (
                          <li>
                            <Link
                              to="/admin"
                              onClick={() => setShowUserMenu(false)}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white font-medium hover:bg-white/20 transition-colors"
                            >
                              <Shield className="w-4 h-4 text-purple-300" /> Admin Dashboard
                            </Link>
                          </li>
                        )}
                        <li>
                          <Link
                            to="/ai-assistant"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white font-medium hover:bg-white/20 transition-colors"
                          >
                            <Sparkles className="w-4 h-4 text-purple-300" /> AI Assistant
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/create"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white hover:bg-white/20 transition-colors"
                          >
                            <Plus className="w-4 h-4 text-green-300" /> 
                            <div>
                              <div className="font-semibold">Create Step-by-Step</div>
                              <div className="text-xs text-white/80">Detailed guide with steps</div>
                            </div>
                          </Link>
                        </li>
        
                      </ul>
                      <div className="my-2 h-px bg-white/30"></div>
                      <button
                        onClick={() => { logout(); setShowUserMenu(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-300 font-medium hover:bg-red-500/20 transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Link to="/login" className="nav-link px-3 sm:px-4 text-sm sm:text-base touch-target">
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="px-3 sm:px-4 md:px-5 py-2 rounded-full bg-gradient-to-r from-teal-400 to-violet-500 text-white font-medium shadow-md hover:shadow-lg transition-all duration-300 text-sm sm:text-base touch-target"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Category Bar */}
      <div className="backdrop-blur-xl bg-white/5 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-1 flex items-center justify-between">
          <div className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide">
            {["all", "recipe", "diy"].map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap touch-target ${
                  activeCategory === cat
                    ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden backdrop-blur-xl bg-white/5 border-t border-white/10 animate-slideDown">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 space-y-2 sm:space-y-3">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search recipes, crafts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-10 sm:pr-12 py-2.5 sm:py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none text-sm sm:text-base"
              />
            </form>
            <nav className="flex flex-col gap-1.5 sm:gap-2">
              <Link to="/" className="mobile-link">
                <Home className="w-5 h-5" /> Home
              </Link>
              <Link to="/vendors" className="mobile-link">
                <Store className="w-5 h-5" /> Vendors
              </Link>
              <Link to="/price-comparison" className="mobile-link">
                <DollarSign className="w-5 h-5" /> Compare
              </Link>
              {authUser && (
                <>
                  <Link to="/create" className="mobile-link bg-gradient-to-r from-green-500/20 to-teal-500/20">
                    <Plus className="w-5 h-5" /> Create Step-by-Step
                  </Link>
                  <Link to="/ai-assistant" className="mobile-link">
                    <Sparkles className="w-5 h-5" /> AI Assistant
                  </Link>
                  {authUser.role === 'admin' && (
                    <Link to="/admin" className="mobile-link bg-gradient-to-r from-purple-500/20 to-pink-500/20">
                      <Shield className="w-5 h-5" /> Admin Dashboard
                    </Link>
                  )}
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};


export default Navbar;