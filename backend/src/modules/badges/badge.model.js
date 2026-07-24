import mongoose from "mongoose";

const badgeSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true
    },
    total_streak: {
        type: Number,
        default: 0
    },
    badges: [{
        badge_name: String,
        badge_image: String,
        unlocked_at: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

const Badge = mongoose.model('Badge', badgeSchema);
export default Badge;