const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.get('/', async (req, res) => {
    const top = await User.find()
        .sort({ xp: -1, level: -1 })
        .limit(10)
        .select('username displayName xp level');
    res.json(top);
});
module.exports = router;