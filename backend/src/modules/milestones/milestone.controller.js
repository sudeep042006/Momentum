import Milestone from './milestone.model.js';

const getMilestones = async (req, res) => {
    try {
        const milestones = await Milestone.find({ user: req.user.id }).sort({ targetDate: 1 });
        res.status(200).json({ success: true, data: milestones });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createMilestone = async (req, res) => {
    try {
        const { title, description, targetDate } = req.body;
        
        if (!title || !targetDate) {
            return res.status(400).json({ success: false, message: "Title and target date are required" });
        }

        const milestone = new Milestone({
            user: req.user.id,
            title,
            description,
            targetDate: new Date(targetDate)
        });

        await milestone.save();
        res.status(201).json({ success: true, data: milestone });
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
        if (milestone.isCompleted) {
            milestone.completedAt = new Date();
        } else {
            milestone.completedAt = null;
        }

        await milestone.save();
        res.status(200).json({ success: true, data: milestone });
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
