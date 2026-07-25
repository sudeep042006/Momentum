import mongoose from 'mongoose';

const journalSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true
    },
    title: {
        type: String,
        default: ''

    },
    content: {
        type: String, 
        required: true,
    },
    type: {
        type: String, 
        enum: ['note', 'quote'],
        default: 'note'
    },
    isPublic: {
        type: Boolean,
        default: false
    }
}, {timestamps: true})

const journal = mongoose.model('Journal', journalSchema);

export default journal;