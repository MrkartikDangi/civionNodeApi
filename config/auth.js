const jwt = require("jsonwebtoken");
const generic = require("./genricFn/common")

module.exports = {
  authenticateJWT: function authenticateJWT(req, res, next) {
    const token = req.header("Authorization").split(" ")[1];;
    if (!token) {
      return generic.error(req, res, {
        status: 403,
        message: "Access denied. Token missing.",
      });
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          return generic.error(req, res, {
            status: 403,
            message: "Invalid token. Token has expired.",
          });
        }
        return generic.error(req, res, {
          status: 403,
          message: "Invalid token.",
        });
      }
      req.body.user = user;
      next();
    });
  },
  isBoss: function isBoss(req, res, next) {
    if (!req.body.user.isBoss) {
      return res.status(403).json({
        status: "error",
        message: "Access restricted to authorized managers",
      });
    }
    next();
  },
};
