import Journal from "./journal.model.js";

export const createJournal = async (userId, journalData) => {
    const newJournal = new Journal({
        ...journalData, user: userId 
    })

    return await newJournal.save();
};

export const getJournals = async(userId) => {
    return await Journal.find({ user: userId }).sort({ createdAt: -1});
};

export const updateJournal = async (userId, journalId, updateData) => {
    return await Journal.findOneAndUpdate(
        {_id: journalId, user: userId},
        updateData,
        {new: true, runValidators: true}
    );
};

export const deleteJournal = async (userId, journalId) => {
    return await Journal.findOneAndDelete({ _id: journalId, user: userId });
};