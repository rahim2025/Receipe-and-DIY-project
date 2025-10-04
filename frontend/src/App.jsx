import { Navigate, Route, Routes } from "react-router-dom"
import { Navbar } from "./components/Navbar"
import HomePage from "./pages/HomePage"
import LoginPage from "./pages/LoginPage"
import SignUpPage from "./pages/SignupPage"
import ProfilePage from "./pages/ProfilePage"
import PostCreate from "./pages/PostCreate"

import DraftsPage from "./pages/DraftsPage"
import PostDetail from "./pages/PostDetail"
import BookmarksPage from "./pages/BookmarksPage"
import VendorsPage from "./pages/VendorsPage"
import PriceComparisonPage from "./pages/PriceComparisonPage"
import SearchAndDiscovery from "./pages/SearchAndDiscovery"
import AIAssistantPage from "./pages/AIAssistantPage"
import EmailVerificationPage from "./pages/EmailVerificationPage"
import AdminDashboard from "./pages/AdminDashboard"
import { useAuthStore } from "./store/useAuthStore"
import { useEffect } from "react"
import { Loader } from "lucide-react"
import LoadingOverlay from './components/LoadingOverlay';
import toast, { Toaster } from 'react-hot-toast';

const App = () => {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
  
  useEffect(() => {
    checkAuth();
  }, [checkAuth])
  
  if (isCheckingAuth && !authUser) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-gradient-to-br from-orange-50 via-rose-50 to-pink-50"> 
        <div className="text-center">
          <Loader className="animate-spin h-8 w-8 text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div>
      <LoadingOverlay />
      <Navbar />
      
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchAndDiscovery />} />
        <Route path="/post/:postId" element={<PostDetail />} />
        <Route path="/vendors" element={<VendorsPage />} />
        <Route path="/price-comparison" element={<PriceComparisonPage />} />
        <Route path="/ai-assistant" element={<AIAssistantPage /> } />
        <Route path="/verify-email" element={<EmailVerificationPage />} />
        
        {/* Auth routes */}
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
        
        {/* Protected routes */}
        {/* Primary post creation with step-by-step system */}
        <Route path="/create" element={authUser ? <PostCreate /> : <Navigate to="/login" />} />
        <Route path="/edit/:postId" element={authUser ? <PostCreate editMode={true} /> : <Navigate to="/login" />} />
        

        
        {/* Other protected routes */}
        <Route path="/drafts" element={authUser ? <DraftsPage /> : <Navigate to="/login" />} />
        <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
        <Route path="/bookmarks" element={authUser ? <BookmarksPage /> : <Navigate to="/login" />} />
        
        {/* Admin routes */}
        <Route path="/admin" element={authUser?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />} />
        
      </Routes>
      
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            color: '#374151',
          },
        }}
      />
    </div>
  )
}

export default App;