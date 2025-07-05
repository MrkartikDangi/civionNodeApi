const jwt = require("jsonwebtoken");
const generic = require("./genricFn/common")
const User = require("../models/userModel")

module.exports = {
  authenticateJWT: async (req, res, next) => {
    if (req.header("Authorization") == undefined) {
      return generic.error(req, res, {
        status: 403,
        message: "Access denied. Authorization key is missing in headers.",
      });
    }
    const token = req.header("Authorization").split(" ")[1];
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
    });
    let getUserDetails = await User.checkExistingUser({ filter: { userId: req.body.user.userId } })
    if (getUserDetails.length) {
      req.body.user.isBoss = getUserDetails[0]?.is_boss == '1' ? true : false
      req.body.user.latitude = getUserDetails[0]?.latitude
      req.body.user.longitude = getUserDetails[0]?.longitude
    }
    next();
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
