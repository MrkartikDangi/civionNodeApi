const MileageUser = require("../../models/MileageUserModel");
const Trip = require("../../models/mileageModel");
const generic = require("../../config/genricFn/common");
const User = require("../../models/userModel");
const moment = require("moment")
const { validationResult, matchedData } = require("express-validator");


// exports.calculateMileage = async (req, res) => {
//     try {
//         const { userId, startLocation, constructionSites } = req.body;
//         let user = await MileageUser.findOne({ userId });
//         if (!user) {
//             user = new MileageUser({ userId });
//             await user.save();
//         }

//         const HOME_DEDUCTIBLE = 100;
//         const RATE_PER_KM = 0.5;

//         let totalDistance = 0;
//         let totalPayable = 0;
//         const routeCoordinates = [];

//         if (constructionSites.length > 0) {
//             const firstLeg = await generic.calculateDistance(
//                 startLocation,
//                 constructionSites[0],
//             );
//             if (firstLeg.error) {
//                 return generic.error(req, res, {
//                     status: 400,
//                     message: firstLeg.error,
//                 });
//             }
//             const distance = await firstLeg.distance
//             totalDistance += distance;
//             totalPayable +=
//                 Math.max(distance - HOME_DEDUCTIBLE, 0) * RATE_PER_KM;
//             routeCoordinates.push(firstLeg.polyline);
//         }

//         for (let i = 0; i < constructionSites.length - 1; i++) {
//             const leg = await generic.calculateDistance(
//                 constructionSites[i],
//                 constructionSites[i + 1],
//             );
//             if (leg.error) {
//                 return generic.error(req, res, { status: 400, message: leg.error });
//             }
//             const ledDistance = await leg.distance
//             totalDistance += ledDistance;
//             totalPayable += ledDistance * RATE_PER_KM;
//             routeCoordinates.push(leg.polyline);
//         }

//         if (constructionSites.length > 0) {
//             const lastLeg = await generic.calculateDistance(
//                 constructionSites.slice(-1)[0],
//                 startLocation,
//             );
//             if (lastLeg.error) {
//                 return generic.error(req, res, { status: 400, message: lastLeg.error });
//             }
//             const lastLegDistance = await lastLeg.distance;
//             totalDistance += lastLegDistance
//             totalPayable +=
//                 Math.max(lastLegDistance - HOME_DEDUCTIBLE, 0) * RATE_PER_KM;
//             routeCoordinates.push(lastLeg.polyline);
//         }

//         const newTrip = new Trip({
//             user_id: user._id,
//             date: new Date(),
//             startLocation,
//             constructionSites,
//             totalDistance: parseFloat(totalDistance).toFixed(2),
//             expenses: parseFloat(totalPayable).toFixed(2),
//             routeCoordinates,
//         });

//         await newTrip.save();
//         return generic.success(req, res, {
//             message: "Trip saved successfully",
//             data: newTrip,
//         });
//     } catch (error) {
//         return generic.error(req, res, {
//             status: 500,
//             message: "Server error during mileage calculation",
//             details: error.message,
//         });
//     }
// };

exports.calculateMileage = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const x = matchedData(req);
        return generic.validationError(req, res, {
            message: "Validation failed",
            validationObj: errors.mapped(),
        });
    }
    try {
        const { userId, startLocation, endLocation,date, distance, duration, amount, coords } = req.body;
        const user = await User.findById(userId);
        if (!user) {
            return generic.error(req, res, { message: `User not found` });
        }

        const newTrip = new Trip({
            user_id: user._id,
            date: date,
            startLocation,
            endLocation,
            duration,
            totalDistance: distance,
            expenses: amount,
            routeCoordinates: coords,
        });

        await newTrip.save();
        return generic.success(req, res, {
            message: "Trip saved successfully",
            data: newTrip,
        });
    } catch (error) {
        return generic.error(req, res, {
            status: 500,
            message: "Server error during mileage calculation",
            details: error.message,
        });
    }
};
exports.getMileageHistory = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const x = matchedData(req);
        return generic.validationError(req, res, {
            message: "Validation failed",
            validationObj: errors.mapped(),
        });
    }
    try {
        const { startDate, endDate } = req.query;
        const user = await User.findById(req.params.userId);
        if (!user) {
            return generic.error(req, res, { message: `User not found` });
        }
        let query = { user_id: user._id };
        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }
        const trips = await Trip.find(query).sort({ date: -1 }).lean();

        return generic.success(req, res, {
            message: "Trip history fetched successfully",
            data: trips.map((trip) => ({
                ...trip,
                totalDistance: trip.totalDistance.toFixed(2),
                expenses: trip.expenses.toFixed(2),
            })),
        });
    } catch (error) {
        return generic.error(req, res, {
            status: 500,
            message: "Error fetching trip history",
            details: error.message,
        });
    }
};
