import { recordTaskCompletion, getActivityData } from "./daily.service.js";

const getHeatMap = async (req, res) => {
    const userId = req.user.id;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    try{
        const heatMap = await getActivityData(userId, startDate, endDate);
        if (!heatMap) {
            return res.status(404).json({ message: "Heat map not found" });
        }
        res.status(200).json({ data: heatMap });
    }catch(error){
        console.error("Error fetching heat map:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export default { getHeatMap };

