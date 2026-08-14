import Journal from "./journal.model.js";
import { encrypt, decrypt } from '../../utils/encryption.js';

const decryptJournal = (journal) => {
    if (!journal) return journal;
    const jObj = journal.toObject ? journal.toObject() : journal;
    
    if (jObj.iv && jObj.authTag && jObj.title) {
        try { jObj.title = decrypt(jObj.title, jObj.iv, jObj.authTag); } catch (e) { console.error("Failed to decrypt journal title", jObj._id); }
    }
    if (jObj.contentIv && jObj.contentAuthTag && jObj.content) {
        try { jObj.content = decrypt(jObj.content, jObj.contentIv, jObj.contentAuthTag); } catch (e) { console.error("Failed to decrypt journal content", jObj._id); }
    }
    
    return jObj;
};

export const createJournal = async (userId, journalData) => {
    const payload = { ...journalData, user: userId };
    
    if (payload.title) {
        const encryptedTitle = encrypt(payload.title);
        payload.title = encryptedTitle.encryptedData;
        payload.iv = encryptedTitle.iv;
        payload.authTag = encryptedTitle.authTag;
    }
    
    if (payload.content) {
        const encryptedContent = encrypt(payload.content);
        payload.content = encryptedContent.encryptedData;
        payload.contentIv = encryptedContent.iv;
        payload.contentAuthTag = encryptedContent.authTag;
    }

    const newJournal = new Journal(payload);
    const saved = await newJournal.save();
    return decryptJournal(saved);
};

export const getJournals = async(userId) => {
    const journals = await Journal.find({ user: userId }).sort({ createdAt: -1});
    return journals.map(decryptJournal);
};

export const updateJournal = async (userId, journalId, updateData) => {
    if (updateData.title) {
        const encryptedTitle = encrypt(updateData.title);
        updateData.title = encryptedTitle.encryptedData;
        updateData.iv = encryptedTitle.iv;
        updateData.authTag = encryptedTitle.authTag;
    }
    
    if (updateData.content) {
        const encryptedContent = encrypt(updateData.content);
        updateData.content = encryptedContent.encryptedData;
        updateData.contentIv = encryptedContent.iv;
        updateData.contentAuthTag = encryptedContent.authTag;
    }

    const updated = await Journal.findOneAndUpdate(
        {_id: journalId, user: userId},
        updateData,
        {new: true, runValidators: true}
    );
    return decryptJournal(updated);
};

export const deleteJournal = async (userId, journalId) => {
    const deleted = await Journal.findOneAndDelete({ _id: journalId, user: userId });
    return decryptJournal(deleted);
};