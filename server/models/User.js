const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username:    { type: String, required: true, unique: true, minlength: 3 },
    displayName: { type: String, required: true, minlength: 2 },
    email:       { type: String, required: true, unique: true, minlength: 4 },
    password:    { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    createdAt:   { type: Date, default: Date.now },
    role:        { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
    progress:    { type: Object, default: {} },
    xp:          { type: Number, default: 0 },
    level:       { type: Number, default: 1 },
    achievements: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Achievement', default: [] }],
    friends:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    messages:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
    class:       { type: mongoose.Schema.Types.ObjectId, ref: 'Class' }
});

module.exports = mongoose.model('User', UserSchema);