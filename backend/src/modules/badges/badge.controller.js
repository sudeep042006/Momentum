import badgeService from "./badge.service.js";

const getBadge = async (req, res) => {
    try {
        const userId = req.user.id;
        const badge = await badgeService.getBadge(userId);
        res.status(200).json({ data: badge });
    } catch (error) {
        console.error("Error fetching badge:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export { getBadge };