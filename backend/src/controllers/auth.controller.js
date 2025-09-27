import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import { genToken } from "../lib/genToken.js";
import cloudinary from "../lib/cloudinary.js";

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
      bio: bio || ""
    });

    await newUser.save(); 
    genToken(newUser._id, res);

    return res.status(201).json({
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
      createdAt: newUser.createdAt
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
    
    genToken(user._id, res);
    
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
      createdAt: user.createdAt
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
    res.cookie("jwt", "", { 
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict"
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
  
