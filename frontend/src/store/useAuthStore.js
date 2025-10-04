import {create} from "zustand"
import { axiosInstance } from "../lib/axios"
import toast from "react-hot-toast";

export const useAuthStore = create((set) =>({
    authUser:null,
    onlineUsers: [],
    isCheckingAuth:true,
    checkAuth: async()=>{
        try {
            const res = await axiosInstance.get("api/auth/check");
            set({authUser:res.data});
        } catch (error) {
            console.log("Error in check auth ",error)
            set({authUser:null});
        }finally{
            set({isCheckingAuth:false});
        }
    },

    isSigningUp :false,
    signup: async(data) =>{
        set({isSigningUp:true })
        try {
            console.log("Sending signup request with data:", data);
            const res = await axiosInstance.post("api/auth/signup",data);
            console.log("Signup response received:", res);
            console.log("Response status:", res.status);
            console.log("Response data:", res.data);
            
            // Handle new response format with email verification
            if (res.data && res.data.success) {
                // Don't set authUser yet - wait for email verification
                set({authUser: null});
                const message = res.data.message || "Account created! Please check your email to verify your account.";
                toast.success(message);
                return { success: true, message: message };
            } else if (res.data && res.data._id) {
                // Old format for backward compatibility (has user data directly)
                if (res.data.token) {
                    localStorage.setItem('jwt-token', res.data.token);
                }
                set({authUser:res.data})
                toast.success("Account created successfully! Welcome to Recipe & DIY!")
                return { success: true };
            } else {
                // Response received but unexpected format - still treat as success if status is 2xx
                console.warn("Unexpected response format but status is OK:", res.data);
                toast.success("Account created! Please check your email to verify your account.");
                return { success: true };
            }
        } catch (error) {
            console.error("Error in signup auth:", error);
            console.error("Error response:", error.response);
            console.error("Error message:", error.message);
            console.error("Error config:", error.config);
            
            const errorMessage = error.response?.data?.message || error.message || "Failed to create account";
            toast.error(errorMessage);
            // Throw error so the component can handle it
            throw new Error(errorMessage);
        }finally {
            set({ isSigningUp: false });
          }
    },
    isLoggingIn:false,
    login: async(data)=>{
        set({isLoggingIn:true});
        try {
            const res = await axiosInstance.post("api/auth/login",data)
            
            // Store token if provided in response
            if (res.data.token) {
                localStorage.setItem('jwt-token', res.data.token);
            }
            
            set({authUser:res.data})
            toast.success("Welcome back to CraftyCook!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to login")
        }finally{
            set({isLoggingIn:false});
        }
    },
    logout: async() =>{
        try {
            const res = await axiosInstance.post("api/auth/logout");
            
            // Clear stored token on logout
            localStorage.removeItem('jwt-token');
            
            set({authUser:null});
            toast.success("Logout successfully");   
        } catch (error) {
            console.log("Error in logout auth",error)
            toast.error(error.response?.data?.message || "Failed to logout")
        }
        
    },
    updateProfile: async (data) => {
        set({ isUpdatingProfile: true });
        try {
          const res = await axiosInstance.put("api/auth/update-profile", data);
          set({ authUser: res.data });
          toast.success("Profile updated successfully");
        } catch (error) {
          console.log("error in update profile:", error);
          toast.error(error.response.data.message);
        } finally {
          set({ isUpdatingProfile: false });
        }
      },
    
    // Set auth user directly (used for email verification)
    setAuthUser: (user) => {
        set({ authUser: user });
    },

}))