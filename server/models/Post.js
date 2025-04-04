const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
    content: { type: String, required: true },
    author: { type: String, required: false}, // Username as string
    createdAt: { type: Date, default: Date.now }
});

const PostSchema = new Schema({
    title: { type: String, required: true },
    body: { type: String, required: true },
    author: { type: String, required: false }, // Username as string
    imageUrl: { type: String },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [CommentSchema],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', PostSchema);