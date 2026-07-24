import userService from "./user.service.js";
import cloudinary from "../../config/cloudinary.js";

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
        const { name, email } = req.body;
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

export default { createOrUpdateProfile, getProfile };