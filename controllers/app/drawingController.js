const generic = require("../../config/genricFn/common");
const { validationResult, matchedData } = require("express-validator");
const drawing = require("../../models/drawingModel")
const fs = require('fs').promises


exports.mergePdf = async (req, res) => {
    try {
        let filePaths
        console.log('res', req.files)
        if (!req.files.originalPdf || !req.files.originalPdf.length) {
            return generic.error(req, res, {
                message: "Please upload original pdf",
            });
        }
        if (!req.files.mergingPdf || !req.files.mergingPdf.length) {
            return generic.error(req, res, {
                message: "Please upload merging pdf",
            });
        }
        const originalPdf = req.files.originalPdf[0];
        const mergingPdf = req.files.mergingPdf[0];
        filePaths = [originalPdf.path, mergingPdf.path];

        const [originalBytes, mergingBytes] = await Promise.all([
            fs.readFile(originalPdf.path),
            fs.readFile(mergingPdf.path)
        ])
        let data = {
            originalBytes: originalBytes,
            mergingBytes: mergingBytes
        }
        const mergePdf = await generic.mergePdf(data)
        console.log('originalBytes', originalBytes)
        console.log('mergingBytes', mergingBytes)





    } catch (error) {
        console.log('error', error)
        return generic.error(req, res, {
            status: 500,
            message: "something went wrong!",
        });

    }
}