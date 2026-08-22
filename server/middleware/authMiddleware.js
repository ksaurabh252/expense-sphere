const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const reqHeader = req.headers.authorization;

    if (!reqHeader) {
      return res.status(401).json({ message: "no token provided" });
    }

    const token = reqHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        message: "Invalid authorization header",
      });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("DECODED:", decoded);
    console.log("USER ID:", decoded.id);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = authMiddleware;
