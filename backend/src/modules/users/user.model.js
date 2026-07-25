import mongoose from 'mongoose';

const UserProfileSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    profilePic: {
        type: String,
        default: ""
    },
    tagline: {
        type: String,
        default: "Builder • Learner • Thinker"
    },
    followers: [{
        type: String
    }],
    following: [{
        type: String
    }]
}, { timestamps: true });

const UserProfile = mongoose.model('UserProfile', UserProfileSchema);
export default UserProfile;