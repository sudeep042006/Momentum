import UserProfile from "./user.model.js";

const createProfile = async (userId, profileData) => {
    const profile = new UserProfile({
        user: userId,
        ...profileData
    });
    return await profile.save();
};

const getProfile = async (userId) => {
    return await UserProfile.findOne({ user: userId });
};

const updateProfile = async (userId, updateData) => {
    return await UserProfile.findOneAndUpdate(
        { user: userId },
        updateData,
        { new: true, runValidators: true }
    );
};

export default {
    createProfile,
    getProfile,
    updateProfile
};
