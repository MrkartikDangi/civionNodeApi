const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const generic = require("../../config/genricFn/common");
const { validationResult, matchedData } = require("express-validator");
const User = require("../../models/userModel");
const Email = require("../../models/registeredEmail");
const db = require("../../config/db")

exports.registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const x = matchedData(req);
    return generic.validationError(req, res, {
      message: "Validation failed",
      validationObj: errors.mapped(),
    });
  }
  try {
    db.beginTransaction()
    req.body.email = req.body.email.toLowerCase()
    const regex = /^[a-zA-Z0-9._%+-]+@kps\.ca$/;
    const isValidEmail = regex.test(req.body.email);
    if (!isValidEmail) {
      return generic.error(req, res, {
        message: `${req.body.email} :- Invalid email. Only emails from the domain 'kps.ca' are allowed`,
      });
    }
    const checkCompanyEmail = await Email.checkExisitingMail(req.body)
    if (checkCompanyEmail.length) {
      const existingUser = await User.checkExisitingUser(req.body)
      if (existingUser.length) {
        db.rollback()
        return generic.error(req, res, {
          message: "User already exists",
        });
      }
      req.body.hashedPassword = await bcrypt.hash(req.body.password, 10);
      const createUser = await User.createUser(req.body)
      if (createUser.insertId) {
        db.commit()
        return generic.success(req, res, {
          message: "User registered successfully",
          data: {
            id: createUser.insertId
          },
        });

      } else {
        db.rollback()
        return generic.error(req, res, {
          message: "failed to register user"
        });
      }

    } else {
      db.rollback()
      return generic.error(req, res, {
        message: `${req.body.email} :- this company email is not registered kindly contact to support team`,
      });
    }
  } catch (error) {
    db.rollback()
    return generic.error(req, res, {
      status: 500,
      message: "Something went wrong !"
    });
  }
};
exports.updateLocation = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const x = matchedData(req);
    return generic.validationError(req, res, {
      message: "Validation failed",
      validationObj: errors.mapped(),
    });
  }

  try {
    db.beginTransaction()
    const checkExisitingUser = await User.checkExisitingUser(req.body);
    if (!checkExisitingUser.length) {
      return generic.error(req, res, { message: `User not found` });
    }
    const updateUserLocation = await User.updateUserLocation(req.body)
    if (updateUserLocation.affectedRows) {
      db.commit()
      return generic.success(req, res, {
        message: "User location updated successfully",
      });
    } else {
      db.rollback()
      return generic.error(req, res, {
        message: "failed to update user location"
      });
    }
  } catch (error) {
    db.rollback()
    return generic.error(req, res, {
      status: 500,
      message: "Something went wrong !"
    });
  }
};
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const x = matchedData(req);
    return generic.validationError(req, res, {
      message: "Validation failed",
      validationObj: errors.mapped(),
    });
  }
  try {
    req.body.email = req.body.email.toLowerCase()
    const regex = /^[a-zA-Z0-9._%+-]+@kps\.ca$/;
    const isValidEmail = regex.test(req.body.email);
    if (!isValidEmail) {
      return generic.error(req, res, {
        message: `${req.body.email} :- Invalid email. Only emails from the domain 'kps.ca' are allowed`,
      });
    }
    const existingEmailVerifiedByCompany = await Email.checkExisitingMail(req.body)

    if (existingEmailVerifiedByCompany.length) {
      const user = await User.checkExisitingUser(req.body);
      if (!user.length) {
        return generic.error(req, res, { message: "User not found" });
      }
      const isMatch = await bcrypt.compare(req.body.password, user[0].password);
      if (!isMatch) {
        return generic.error(req, res, {
          message: "Invalid email or password",
        });
      }
      let isBoss = existingEmailVerifiedByCompany[0].isBoss == 1 ? true : false

      const token = jwt.sign(
        { userId: user[0].id, isBoss },
        process.env.JWT_SECRET,
        { expiresIn: "24h" },
      );
      return generic.success(req, res, {
        message: "User logged in successfully",
        data: {
          token: token,
          userId: user._id,
          userName: user.username,
          isBoss: isBoss
        },
      });
    } else {
      return generic.error(req, res, {
        message: `${req.body.email} :- email is not verified by company`,
      });
    }
  } catch (error) {
    return generic.error(req, res, {
      status: 500,
      message: "Something went wrong !"
    });
  }
};
exports.forgotPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const x = matchedData(req);
    return generic.validationError(req, res, {
      message: "Validation failed",
      validationObj: errors.mapped(),
    });
  }
  try {
    db.beginTransaction()
    req.body.email = req.body.email.toLowerCase()
    const user = await User.checkExisitingUser(req.body);
    if (!user) {
      return generic.error(req, res, { message: "User not found" });
    }
    const code = Math.floor(1000 + Math.random() * 9000);
    const expiration = new Date();
    expiration.setMinutes(expiration.getMinutes() + 10);

    let updatedCode = {
      id: user[0].id,
      verificationCode: code,
      codeExpiration: expiration
    }
    let updateCodeDetails = await User.updateCodeDetails(updatedCode)
    if (updateCodeDetails.affectedRows) {
      let data = {
        to: req.body.email,
        subject: `Password Reset Verification Code`,
        text: `Your verification code is: ${code}`,
      };
      let result = await generic.sendEmails(data);
      if (result) {
        db.commit()
        return generic.success(req, res, {
          message: "Verification code sent to email",
        });
      } else {
        db.rollback()
        return generic.error(req, res, {
          message: "failed to send forgot password code mail",
          error: result,
        });
      }
    } else {
      db.rollback()
      return generic.error(req, res, {
        message: "failed to update user code details",
      });
    }
  } catch (error) {
    return generic.error(req, res, {
      status: 500,
      message: "Something went wrong !"
    });
  }
};
exports.verifyCode = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const x = matchedData(req);
    return generic.validationError(req, res, {
      message: "Validation failed",
      validationObj: errors.mapped(),
    });
  }
  try {
    req.body.email = req.body.email.toLowerCase()
    const user = await User.checkExisitingUser(req.body);
    if (!user.length) {
      return generic.error(req, res, { message: "User not found" });
    }

    if (user[0].verificationCode !== req.body.code) {
      return generic.error(req, res, {
        message: "Invalid code",
        error: "Invalid code",
      });
    }

    if (new Date() > user[0].codeExpiration) {
      return generic.error(req, res, {
        message: "Code has expired",
        error: "Code has expired",
      });
    }
    return generic.success(req, res, {
      message: "Code verified successfully",
    });
  } catch (error) {
    return generic.error(req, res, {
      status: 500,
      message: "Something went wrong !"
    });
  }
};
exports.resetPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const x = matchedData(req);
    return generic.validationError(req, res, {
      message: "Validation failed",
      validationObj: errors.mapped(),
    });
  }
  try {
    db.beginTransaction()
    req.body.email = req.body.email.toLowerCase()
    const user = await User.checkExisitingUser(req.body);
    if (!user.length) {
      return generic.error(req, res, { message: "User not found" });
    }

    if (req.body.newPassword.length < 8) {
      return generic.error(req, res, {
        message: "Password must be at least 8 characters long",
      });
    }

    const hashedPassword = await bcrypt.hash(req.body.newPassword, 10);
    let data = {
      id: user[0].id,
      password: hashedPassword
    }
    let updateUserPassword = await User.updateUserPassword(data)
    if (updateUserPassword.affectedRows) {
      db.commit()
      return generic.success(req, res, {
        message: "Password reset successfully ",
      });
    } else {
      db.rollback()
      return generic.error(req, res, {
        message: "failed to reset user password",
      });

    }

  } catch (error) {
    db.rollback()
    return generic.error(req, res, {
      status: 500,
      message: "Something went wrong !"
    });
  }
};
exports.profile = async (req, res) => {
  try {
    const user = await User.checkExisitingUser({ userId: req.body.user.userId });
    if (!user.length) {
      return generic.error(req, res, { message: "User not found" });
    }
    const isBoss = req.body.user.isBoss;
    return generic.success(req, res, {
      message: "Login user profile details",
      data: {
        username: user[0].username,
        email: user[0].email,
        isBoss: isBoss,
        latitude: user[0].latitude ?? '',
        longitude: user[0].longitude ?? '',
      },
    });
  } catch (error) {
    return generic.error(req, res, {
      status: 500,
      message: "Something went wrong !"
    });
  }
};
exports.addCompanyEmail = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const x = matchedData(req);
    return generic.validationError(req, res, {
      message: "Validation failed",
      validationObj: errors.mapped(),
    });
  }

  try {
    db.beginTransaction()
    let checkIsAdmin = req.body.user.isBoss;
    req.body.email = req.body.email.toLowerCase()
    if (checkIsAdmin) {
      const regex = /^[a-zA-Z0-9._%+-]+@kps\.ca$/;
      const isValidEmail = regex.test(req.body.email);
      if (!isValidEmail) {
        db.rollback()
        return generic.error(req, res, {
          message: `${req.body.email} :- Invalid email. Only emails from the domain 'kps.ca' are allowed`,
        });
      }
      const existingEmail = await Email.checkExisitingMail(req.body)
      if (!existingEmail.length) {
        let result = await Email.addCompanyEmail(req.body);
        if (result.insertId) {
          db.commit()
          return generic.success(req, res, {
            message: "email registered successfully",
            data: req.body.email,
          });
        } else {
          db.rollback()
          return generic.error(req, res, {
            message: `Failed to register ${email}`,
          });
        }
      } else {
        db.rollback()
        return generic.error(req, res, {
          message: `${req.body.email} is already exists`,
        });
      }
    } else {
      db.rollback()
      return generic.error(req, res, {
        message: `You do not have access to perform this operation!`,
        error: "access denied",
      });
    }
  } catch (error) {
    db.rollback()
    return generic.error(req, res, {
      status: 500,
      message: "Something went wrong !"
    });
  }
};
