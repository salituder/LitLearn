const jwt = require('jsonwebtoken');
module.exports = (req, res, next) => {
  if (!req.headers.authorization) return res.status(401).json({ message: "No auth" });
  const token = req.headers.authorization.slice(7) === 'Bearer '
    ? req.headers.authorization.substring(7)
    : req.headers.authorization.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};