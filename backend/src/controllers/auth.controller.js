import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import { genToken } from "../lib/genToken.js";
import cloudinary from "../lib/cloudinary.js";
import { generateVerificationToken, sendVerificationEmail, sendWelcomeEmail } from "../lib/emailService.js";

export const signup = async (req, res) => {
  try {
    const { fullName, firstName, lastName, email, password, username, interests, userType, bio, profilePic } = req.body;

    // Basic validation
    if (!firstName || !lastName || !email || !password || !username) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    if (username.length < 3) {
      return res.status(400).json({ message: "Username must be at least 3 characters" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email: email }, { username: username }] 
    });
    
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: "Email already exists" });
      }
      if (existingUser.username === username) {
        return res.status(400).json({ message: "Username already exists" });
      }
    }

    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Handle profile picture upload if provided
    let profilePicUrl = "";
    if (profilePic) {
      try {
        const uploadResult = await cloudinary.uploader.upload(profilePic, {
          folder: "profile_pics",
          transformation: [
            { width: 400, height: 400, crop: "fill", gravity: "face" },
            { quality: "auto", fetch_format: "auto" }
          ]
        });
        profilePicUrl = uploadResult.secure_url;
      } catch (uploadError) {
        console.error("Error uploading profile picture:", uploadError);
        // Continue with signup even if image upload fails
      }
    }

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const newUser = new User({
      fullName: fullName || `${firstName} ${lastName}`.trim(),
      firstName: firstName || "",
      lastName: lastName || "",
      email,
      username,
      password: hashedPassword,
      profilePic: profilePicUrl,
      interests: interests || [],
      userType: userType || 'both',
      bio: bio || "",
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
      isEmailVerified: false
    });

    await newUser.save();
    
    // Send verification email
    try {
      await sendVerificationEmail(email, verificationToken, newUser.fullName || firstName);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Continue with signup even if email fails
    }

    return res.status(201).json({
      success: true,
      message: "Account created successfully! Please check your email to verify your account.",
      user: {
        _id: newUser._id,
        fullName: newUser.fullName,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        username: newUser.username,
        profilePic: newUser.profilePic,
        bio: newUser.bio,
        interests: newUser.interests,
        userType: newUser.userType,
        isEmailVerified: newUser.isEmailVerified,
        createdAt: newUser.createdAt
      }
    });

  } catch (error) {
    console.error("Error in signup controller:", error);
    if (error.code === 11000) {
      // Handle duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        message: `${field === 'email' ? 'Email' : 'Username'} already exists` 
      });
    }
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }
    
    // Find user by email or username
    const user = await User.findOne({
      $or: [{ email: email }, { username: email }]
    });
    
    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password"
      });
    }
    
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({
        message: "Invalid email or password"
      });
    }
    
    // Check if user is blocked
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked. Please contact support for assistance.",
        isBlocked: true,
        blockReason: user.blockReason
      });
    }
    
    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in. Check your inbox for the verification link.",
        requiresVerification: true,
        email: user.email
      });
    }
    
    const token = genToken(user._id, res);
    
    // Also send token in response header as backup for cross-origin issues
    res.setHeader('Authorization', `Bearer ${token}`);
    
    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
      profilePic: user.profilePic,
      bio: user.bio,
      interests: user.interests,
      userType: user.userType,
      createdAt: user.createdAt,
      token: token // Include token in response body as well
    });

  } catch (error) {
    console.error("Error in login controller:", error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
}
export const logout = async (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === "production";
    
    res.cookie("jwt", "", { 
      maxAge: 0,
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "strict",
      domain: isProduction ? ".vercel.app" : undefined
    });
    
    return res.status(200).json({
      message: "Logged out successfully"
    });
  } catch (error) {
    console.error("Error in logout controller:", error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
}
export const updateProfile = async(req,res)=>{
  try{
    const { profilePic, bio, interests, userType, firstName, lastName } = req.body;
    const userId = req.user._id;
    
    const updateData = {};
    
    if (profilePic) {
      const uploadResult = await cloudinary.uploader.upload(profilePic, {
        folder: "profile_pics",
        transformation: [
          { width: 400, height: 400, crop: "fill", gravity: "face" },
          { quality: "auto", fetch_format: "auto" }
        ]
      });
      updateData.profilePic = uploadResult.secure_url;
    }
    
    if (bio !== undefined) updateData.bio = bio;
    if (interests !== undefined) updateData.interests = interests;
    if (userType !== undefined) updateData.userType = userType;
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    
    // Update fullName if firstName or lastName changed
    if (firstName !== undefined || lastName !== undefined) {
      const user = await User.findById(userId);
      const newFirstName = firstName !== undefined ? firstName : user.firstName;
      const newLastName = lastName !== undefined ? lastName : user.lastName;
      updateData.fullName = `${newFirstName} ${newLastName}`.trim();
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-password');
    
    res.status(200).json(updatedUser);
  }catch(error){
    console.error("Error in update profile controller:", error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

export const checkAuth = (req,res) =>{
  try{
    res.status(200).json(req.user);
  }catch(error){
    console.error("Error in check controller:", error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
}

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Verification token is required"
      });
    }
    
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token"
      });
    }
    
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();
    
    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.fullName);
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      // Continue even if welcome email fails
    }
    
    // Generate JWT token
    const jwtToken = genToken(user._id, res);
    
    res.setHeader('Authorization', `Bearer ${jwtToken}`);
    
    res.status(200).json({
      success: true,
      message: "Email verified successfully!",
      user: {
        _id: user._id,
        fullName: user.fullName,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username,
        profilePic: user.profilePic,
        bio: user.bio,
        interests: user.interests,
        userType: user.userType,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt
      },
      token: jwtToken
    });
    
  } catch (error) {
    console.error("Error in verifyEmail controller:", error);
    return res.status(500).json({ 
      success: false,
      message: "Internal server error" 
    });
  }
};

export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified"
      });
    }
    
    // Generate new verification token
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = verificationExpires;
    await user.save();
    
    // Send verification email
    await sendVerificationEmail(user.email, verificationToken, user.fullName);
    
    res.status(200).json({
      success: true,
      message: "Verification email sent successfully. Please check your inbox."
    });
    
  } catch (error) {
    console.error("Error in resendVerificationEmail controller:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send verification email. Please try again later."
    });
  }
};
  
