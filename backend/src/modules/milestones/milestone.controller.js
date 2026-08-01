import Milestone from './milestone.model.js';
import { encrypt, decrypt } from '../../utils/encryption.js';

const getMilestones = async (req, res) => {
    try {
        const milestones = await Milestone.find({ user: req.user.id }).sort({ targetDate: 1 });
        
        // Decrypt titles and descriptions
        const decryptedMilestones = milestones.map(m => {
            const mObj = m.toObject();
            if (mObj.iv && mObj.authTag) {
                try {
                    mObj.title = decrypt(mObj.title, mObj.iv, mObj.authTag);
                    if (mObj.description && mObj.description !== "") {
                        mObj.description = decrypt(mObj.description, mObj.iv, mObj.authTag);
                    }
                } catch(e) {
                    console.error("Decryption failed for milestone", mObj._id);
                }
            }
            return mObj;
        });

        res.status(200).json({ success: true, data: decryptedMilestones });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createMilestone = async (req, res) => {
    try {
        const { title, description, targetDate } = req.body;
        
        const encryptedTitle = encrypt(title);
        let encryptedDesc = { encryptedData: "", iv: encryptedTitle.iv, authTag: encryptedTitle.authTag };
        if (description) {
            encryptedDesc = encrypt(description);
        }

        const milestone = new Milestone({
            user: req.user.id,
            title: encryptedTitle.encryptedData,
            description: description ? encryptedDesc.encryptedData : "",
            targetDate,
            iv: encryptedTitle.iv,
            authTag: encryptedTitle.authTag
        });
        
        await milestone.save();
        
        const mObj = milestone.toObject();
        mObj.title = title;
        mObj.description = description || "";

        res.status(201).json({ success: true, data: mObj });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const toggleMilestone = async (req, res) => {
    try {
        const { id } = req.params;
        const milestone = await Milestone.findOne({ _id: id, user: req.user.id });
        
        if (!milestone) {
            return res.status(404).json({ success: false, message: "Milestone not found" });
        }

        milestone.isCompleted = !milestone.isCompleted;
        milestone.completedAt = milestone.isCompleted ? new Date() : null;
        await milestone.save();
        
        const mObj = milestone.toObject();
        if (mObj.iv && mObj.authTag) {
            try {
                mObj.title = decrypt(mObj.title, mObj.iv, mObj.authTag);
                if (mObj.description && mObj.description !== "") {
                    mObj.description = decrypt(mObj.description, mObj.iv, mObj.authTag);
                }
            } catch(e) {
                console.error("Decryption failed for milestone", mObj._id);
            }
        }

        res.status(200).json({ success: true, data: mObj });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteMilestone = async (req, res) => {
    try {
        const { id } = req.params;
        const milestone = await Milestone.findOneAndDelete({ _id: id, user: req.user.id });
        
        if (!milestone) {
            return res.status(404).json({ success: false, message: "Milestone not found" });
        }
        
        res.status(200).json({ success: true, message: "Milestone deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export default { getMilestones, createMilestone, toggleMilestone, deleteMilestone };
