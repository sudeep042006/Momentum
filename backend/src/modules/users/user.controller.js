import userService from "./user.service.js";
import cloudinary from "../../config/cloudinary.js";
import UserProfile from "./user.model.js";
import Journal from "../journals/journal.model.js";
import Badge from "../badges/badge.model.js";
import { getDashboardStats } from "../daily-lists/daily.service.js";

const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'momentum_profiles' },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        uploadStream.end(buffer);
    });
};

const createOrUpdateProfile = async (req, res) => {
    try {
        const { name, email, tagline } = req.body;
        const userId = req.user.id;
        
        let profilePicUrl = undefined;

        // If a file was uploaded, send it to Cloudinary
        if (req.file) {
            const uploadResult = await uploadToCloudinary(req.file.buffer);
            profilePicUrl = uploadResult.secure_url;
        }

        const existingProfile = await userService.getProfile(userId);
        
        if (existingProfile) {
            // Update existing
            const updateData = {};
            if (name) updateData.name = name;
            if (email) updateData.email = email;
            if (tagline !== undefined) updateData.tagline = tagline;
            if (profilePicUrl) updateData.profilePic = profilePicUrl;
            
            const updated = await userService.updateProfile(userId, updateData);
            return res.status(200).json({ message: "Profile updated successfully", data: updated });
        } else {
            // Create new
            if (!name || !email) {
                return res.status(400).json({ message: "Name and email are required to create a profile" });
            }
            
            const newProfile = await userService.createProfile(userId, {
                name,
                email,
                tagline: tagline || "Builder • Learner • Thinker",
                profilePic: profilePicUrl || ""
            });
            return res.status(201).json({ message: "Profile created successfully", data: newProfile });
        }

    } catch (error) {
        console.error("Error managing profile:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getProfile = async (req, res) => {
    try {
        const profile = await userService.getProfile(req.user.id);
        if (!profile) {
            return res.status(404).json({ message: "Profile not found" });
        }
        res.status(200).json({ data: profile });
    } catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const searchUsers = async (req, res) => {
    try {
        const query = req.query.q || '';
        const users = await UserProfile.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { user: { $regex: query, $options: 'i' } }
            ]
        }).limit(20);
        
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getPublicProfile = async (req, res) => {
    try {
        const { username } = req.params;
        
        const searchUsername = username.toLowerCase().replace(/\\s+/g, '');
        
        const users = await UserProfile.find({});
        const user = users.find(u => 
            u.user === username || 
            (u.name && u.name.toLowerCase().replace(/\\s+/g, '') === searchUsername)
        );

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const publicJournals = await Journal.find({ user: user.user, isPublic: true }).sort({ createdAt: -1 });
        const badges = await Badge.find({ user: user.user }).sort({ earnedAt: -1 });
        const stats = await getDashboardStats(user.user);
        
        // Get Heatmap data for the past year
        const today = new Date();
        const lastYear = new Date();
        lastYear.setDate(today.getDate() - 365);
        const startDateStr = lastYear.toISOString().split('T')[0];
        const endDateStr = today.toISOString().split('T')[0];
        const { getActivityData } = await import('../daily-lists/daily.service.js');
        const heatmapData = await getActivityData(user.user, startDateStr, endDateStr);

        res.status(200).json({
            success: true,
            data: {
                profile: user,
                journals: publicJournals,
                badges: badges,
                stats: stats,
                heatmap: heatmapData
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const followUser = async (req, res) => {
    try {
        const followerId = req.user.id; // User making the request
        const { username } = req.params; // Target user to follow (can be name or user id)
        
        const searchUsername = username.toLowerCase().replace(/\\s+/g, '');
        const allUsers = await UserProfile.find({});
        const targetUser = allUsers.find(u => 
            u.user === username || 
            (u.name && u.name.toLowerCase().replace(/\\s+/g, '') === searchUsername)
        );

        if (!targetUser) {
            return res.status(404).json({ success: false, message: 'Target user not found' });
        }

        if (targetUser.user === followerId) {
            return res.status(400).json({ success: false, message: 'You cannot follow yourself' });
        }

        // Get the follower's profile
        const followerProfile = await UserProfile.findOne({ user: followerId });
        
        if (!followerProfile) {
             return res.status(404).json({ success: false, message: 'Your profile not found' });
        }

        // Add target to following
        if (!followerProfile.following.includes(targetUser.user)) {
            followerProfile.following.push(targetUser.user);
            await followerProfile.save();
        }

        // Add follower to target's followers
        if (!targetUser.followers.includes(followerId)) {
            targetUser.followers.push(followerId);
            await targetUser.save();
        }

        res.status(200).json({ success: true, message: 'Successfully followed user' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const unfollowUser = async (req, res) => {
    try {
        const followerId = req.user.id; 
        const { username } = req.params; 
        
        const searchUsername = username.toLowerCase().replace(/\\s+/g, '');
        const allUsers = await UserProfile.find({});
        const targetUser = allUsers.find(u => 
            u.user === username || 
            (u.name && u.name.toLowerCase().replace(/\\s+/g, '') === searchUsername)
        );

        if (!targetUser) {
            return res.status(404).json({ success: false, message: 'Target user not found' });
        }

        const followerProfile = await UserProfile.findOne({ user: followerId });
        
        if (followerProfile) {
            followerProfile.following = followerProfile.following.filter(id => id !== targetUser.user);
            await followerProfile.save();
        }

        targetUser.followers = targetUser.followers.filter(id => id !== followerId);
        await targetUser.save();

        res.status(200).json({ success: true, message: 'Successfully unfollowed user' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getMe = async (req, res) => {
    try {
        const supabaseUser = req.user;
        const profile = await userService.getProfile(supabaseUser.id);
        
        // Merge Supabase user with MongoDB profile so frontend has all data
        const mergedUser = {
            ...supabaseUser,
            profilePic: profile?.profilePic || supabaseUser.user_metadata?.profilePic || "",
            name: profile?.name || supabaseUser.user_metadata?.name || "",
            tagline: profile?.tagline || "Builder • Learner • Thinker"
        };
        
        res.status(200).json({ data: mergedUser });
    } catch (error) {
        console.error("Error fetching me:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export default { createOrUpdateProfile, getProfile, searchUsers, getPublicProfile, followUser, unfollowUser, getMe };