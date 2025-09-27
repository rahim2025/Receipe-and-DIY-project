import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
    fullName:{
        type:String,
        required:true
    },
    email:{
        type:String,
        unique:true,
        required:true
    },
    password:{
        type:String,
        minlength:6,
        required:true
    },
    profilePic:{
        type:String,
        default: "",
    },
    bio:{
        type:String,
        default: "",
        maxlength:500
    },
    interests:{
        type:[String],
        default:[],
        enum:['cooking', 'baking', 'diy', 'home-decor', 'gardening', 'healthy']
    },
    userType:{
        type:String,
        enum:['foodie', 'crafter', 'both'],
        default:'both'
    },
    username:{
        type:String,
        unique:true,
        required:true
    },
    firstName:{
        type:String,
        default:""
    },
    lastName:{
        type:String,
        default:""
    },
    
    // Location Information
    location: {
        city: {
            type: String,
            default: ""
        },
        state: {
            type: String,
            default: ""
        },
        country: {
            type: String,
            default: ""
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            index: '2dsphere'
        },
        timezone: {
            type: String,
            default: ""
        },
        displayLocation: {
            type: String,
            default: "" // e.g., "New York, NY, USA"
        }
    },
    
    // Privacy Settings
    locationPrivacy: {
        type: String,
        enum: ['public', 'city-only', 'private'],
        default: 'city-only'
    }
},
{timestamps:true}
);

const User = mongoose.model("User",userSchema);
export default User;