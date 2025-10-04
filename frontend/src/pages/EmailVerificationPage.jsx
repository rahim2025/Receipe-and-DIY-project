import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader, CheckCircle, XCircle, Mail } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';
import { axiosInstance } from '../lib/axios';

const EmailVerificationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState('verifying');
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const { setAuthUser } = useAuthStore();
  
  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setVerificationStatus('error');
      return;
    }
    
    const verify = async () => {
      try {
        const response = await axiosInstance.post('/api/auth/verify-email', { token });
        
        if (response.data.success) {
          setVerificationStatus('success');
          
          // Set the authenticated user
          if (response.data.user) {
            setAuthUser(response.data.user);
          }
          
          toast.success('Email verified successfully!');
          
          // Redirect to home page after 2 seconds
          setTimeout(() => navigate('/'), 2000);
        } else {
          setVerificationStatus('error');
          toast.error(response.data.message || 'Verification failed');
        }
      } catch (error) {
        setVerificationStatus('error');
        toast.error(error.response?.data?.message || 'Verification failed');
      }
    };
    
    verify();
  }, [searchParams, navigate, setAuthUser]);
  
  const handleResendEmail = async () => {
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    
    setIsResending(true);
    try {
      const response = await axiosInstance.post('/api/auth/resend-verification', { email });
      
      if (response.data.success) {
        toast.success('Verification email sent! Please check your inbox.');
      } else {
        toast.error(response.data.message || 'Failed to send email');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send email');
    } finally {
      setIsResending(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-rose-50 to-pink-50 px-4 py-12">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center backdrop-blur-sm bg-opacity-95">
        {verificationStatus === 'verifying' && (
          <>
            <Loader className="animate-spin h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Verifying Email</h2>
            <p className="text-gray-600">Please wait while we verify your email address...</p>
          </>
        )}
        
        {verificationStatus === 'success' && (
          <>
            <div className="bg-green-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Email Verified!</h2>
            <p className="text-gray-600 mb-4">
              Your email has been verified successfully. Welcome to Recipe & DIY!
            </p>
            <div className="animate-pulse text-orange-500 font-medium">
              Redirecting to home page...
            </div>
          </>
        )}
        
        {verificationStatus === 'error' && (
          <>
            <div className="bg-red-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <XCircle className="h-12 w-12 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Verification Failed</h2>
            <p className="text-gray-600 mb-6">
              The verification link is invalid or has expired.
            </p>
            
            <div className="border-t border-gray-200 pt-6 mt-6">
              <div className="flex items-center justify-center mb-4">
                <Mail className="h-5 w-5 text-orange-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-800">Resend Verification Email</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Enter your email address to receive a new verification link
              </p>
              <div className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                />
                <button
                  onClick={handleResendEmail}
                  disabled={isResending}
                  className="w-full bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
                >
                  {isResending ? (
                    <>
                      <Loader className="animate-spin h-4 w-4 mr-2" />
                      Sending...
                    </>
                  ) : (
                    'Resend Verification Email'
                  )}
                </button>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => navigate('/signup')}
                className="text-orange-500 hover:text-orange-600 font-medium transition-colors"
              >
                Back to Signup
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EmailVerificationPage;
