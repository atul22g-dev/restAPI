
const cronAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "Authorization header missing",
    });
  }

  const token = authHeader.replace("Bearer ", "");

  if (token !== process.env.CRON_SECRET) {
    return res.status(403).json({
      success: false,
      message: "Invalid token",
    });
  }

  next();
};
module.exports = {
  cronAuth
};