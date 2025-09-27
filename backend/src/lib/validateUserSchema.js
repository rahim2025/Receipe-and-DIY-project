import {z} from "zod";

export const validateUserSchema = z.object({
    fullName: z.string().min(1,"Name required").optional(),
    firstName: z.string().min(1,"First name required"),
    lastName: z.string().min(1,"Last name required"),
    email:z.string().email("Invalid email"),
    username: z.string().min(3,"Username must be at least 3 characters"),
    password:z.string().min(6,"Password must be at least 6 characters"),
    profilePic:z.string().optional(),
    bio: z.string().max(500,"Bio must be less than 500 characters").optional(),
    interests: z.array(z.enum(['cooking', 'baking', 'diy', 'home-decor', 'gardening', 'healthy'])).optional(),
    userType: z.enum(['foodie', 'crafter', 'both']).optional(),
});

