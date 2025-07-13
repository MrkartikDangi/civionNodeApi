const generic = require("./genricFn/common")
const User = require("../models/userModel")
const moment = require("moment")

module.exports = {
  authenticateJWT: async (req, res, next) => {
    try {
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
      let authVerification = await generic.jwtVerify(token, process.env.JWT_SECRET)
      if (authVerification.status) {
        req.body.user = authVerification.data.userDetails
        let getUserDetails = await User.checkExistingUser({ filter: { userId: req.body.user.userId } })
        if (getUserDetails.length) {
          req.body.user.isBoss = getUserDetails[0]?.is_boss == '1' ? true : false
          req.body.user.latitude = getUserDetails[0]?.latitude
          req.body.user.longitude = getUserDetails[0]?.longitude
          req.body.user.dateTime = req.header("dateTime") ? moment(req.header("dateTime")).format('YYYY-MM-DD HH:mm:ss') : moment.utc(new Date()).format('YYYY-MM-DD HH:mm:ss')
        }
        next();

      }
    } catch (error) {
      return generic.error(req, res, {
        status: 403,
        message: 'Invalid token. Token has expired.',
      });
    }

  },
  isBoss: function isBoss(req, res, next) {
    if (!req.body.user.isBoss) {
      return generic.error(req, res, {
        status: 403,
        message: "Access restricted to authorized managers.",
      });
    }
    next();
  },
};
