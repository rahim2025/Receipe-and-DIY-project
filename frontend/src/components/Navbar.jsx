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
        <div className="max-w-7xl mx-auto px-6 h-16">
          <div className="flex items-center justify-between h-full">
            {/* Brand */}
            <Link
              to="/"
              className="flex items-center gap-3 hover:scale-105 transition-transform duration-300"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-400 to-violet-500 flex items-center justify-center shadow-md">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-extrabold text-white tracking-wide font-['Poppins']">
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
                  <Link to="/bookmarks" className="nav-link">
                    <Bookmark className="w-4 h-4" /> Saved
                  </Link>
                  <Link to="/drafts" className="nav-link">
                    <FileText className="w-4 h-4" /> Drafts
                  </Link>
                </>
              )}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all duration-300"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-white" />
                ) : (
                  <Menu className="w-5 h-5 text-white" />
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
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-violet-500 p-0.5 hover:scale-105 transition-transform duration-300 focus:outline-none focus:ring-2 focus:ring-teal-400/50"
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
                      className="absolute right-0 mt-3 w-60 z-[200] glass-panel p-2 rounded-2xl shadow-2xl animate-fadeIn"
                      role="menu"
                    >
                      <div className="px-3 py-2 mb-2 border-b border-white/10">
                        <p className="text-sm font-semibold text-white truncate">{authUser.username}</p>
                        {authUser.email && (
                          <p className="text-xs text-white/50 truncate">{authUser.email}</p>
                        )}
                      </div>
                      <ul className="space-y-1">
                        <li>
                          <Link
                            to="/profile"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/80 hover:bg-white/10 transition-colors"
                          >
                            <User className="w-4 h-4 text-blue-300" /> Profile
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/create"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/80 hover:bg-white/10 transition-colors"
                          >
                            <Plus className="w-4 h-4 text-green-300" /> Create Post
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/quick-create"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/80 hover:bg-white/10 transition-colors"
                          >
                            <Zap className="w-4 h-4 text-yellow-300" /> Quick Create
                          </Link>
                        </li>
                      </ul>
                      <div className="my-2 h-px bg-white/10"></div>
                      <button
                        onClick={() => { logout(); setShowUserMenu(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="nav-link px-4">
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="px-5 py-2 rounded-full bg-gradient-to-r from-teal-400 to-violet-500 text-white font-medium shadow-md hover:shadow-lg transition-all duration-300"
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
        <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between">
          <div className="flex gap-3 overflow-x-auto">
            {["all", "recipe", "diy"].map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat
                    ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
          <Link
            to="/create"
            className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-teal-400 to-violet-500 text-white text-sm font-medium shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" /> Share
          </Link>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden backdrop-blur-xl bg-white/5 border-t border-white/10 animate-slideDown">
          <div className="max-w-7xl mx-auto px-6 py-4 space-y-3">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search recipes, crafts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-12 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none"
              />
            </form>
            <nav className="flex flex-col gap-2">
              <Link to="/" className="mobile-link">
                <Home className="w-5 h-5" /> Home
              </Link>
              <Link to="/vendors" className="mobile-link">
                <Store className="w-5 h-5" /> Vendors
              </Link>
              <Link to="/price-comparison" className="mobile-link">
                <DollarSign className="w-5 h-5" /> Compare
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};


export default Navbar;