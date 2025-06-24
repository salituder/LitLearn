const mongoose = require('mongoose');
const AchievementSchema = new mongoose.Schema({
    code:        { type: String, required: true, unique: true }, 
    title:       { type: String, required: true },
    description: { type: String, required: true },
    xpReward:    { type: Number, default: 0 }
});
module.exports = mongoose.model('Achievement', AchievementSchema);