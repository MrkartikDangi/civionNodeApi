const generic = require("../../config/genricFn/common");
const { validationResult, matchedData } = require("express-validator");
const User = require("../../models/userModel")
const db = require("../../config/db")

exports.getLocationWeather = async (req, res) => {
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
    let existingUser = await User.checkExistingUser({ filter: { userId: req.body.user.userId } })
    if (!existingUser.length) {
      return generic.error(req, res, {
        message: `User not found`,
      });
    }
    const latitude = generic.parseCoordinate(req.body.latitude, "latitude");
    const longitude = generic.parseCoordinate(req.body.longitude, "longitude");

    let data = {
      latitude: latitude,
      longitude: longitude
    }
    let formattedAddress = await generic.getGeoCodeResponse(data)
    let weatherInfo = {
      temperature: null,
      condition: "Weather data unavailable",
      icon: null,
      lastUpdated: null,
    };
    weatherInfo = await generic.getWeatherInfo(data)

    data.userId = req.body.user.userId
    let updateUserLatLong = await User.updateUserLocation(data)
    if (updateUserLatLong.affectedRows) {
      db.commit()
      return generic.success(req, res, {
        message: "Weather Information",
        data: {
          location: {
            formattedAddress,
            coordinates: {
              latitude: parseFloat(latitude.toFixed(6)),
              longitude: parseFloat(longitude.toFixed(6)),
            },
          },
          weather: weatherInfo,
        }
      });
    } else {
      db.rollback()
      return generic.error(req, res, {
        message: "Failed to fetch and update user location",
      });
    }

  } catch (error) {
    db.rollback()
    return generic.error(req, res, {
      status: 500,
      message: `Something went wrong!`,
    });
  }
};
