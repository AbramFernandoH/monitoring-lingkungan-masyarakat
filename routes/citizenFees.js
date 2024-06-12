require('dotenv').config();
const ExcelJS = require("exceljs");
const express = require('express');
const router = express.Router();
const { DateTime } = require('luxon');
const CitizenFees = require('../model/citizenFees');
const { isLoggedIn, isAdmin } = require('../middleware');

router.route('/')
    .get(isLoggedIn, async (req, res) => {
        try {
            const { skip } = req.query
            const currentSkip = skip ? Number(skip) : 0
            const currentUrl = process.env.ENVIROMENT === 'development' ? `${req.protocol}://${req.hostname}:${process.env.PORT}${req.path}citizen-fees` : `${req.protocol}://${req.hostname}${req.path}citizen-fees`
    
            const query = !req.user.admin ? {
                "owner": req.user._id
            } : {}
            const limit = 10
            const listFeesDb = await CitizenFees.find(query).limit(limit).skip(currentSkip);
            const listFees = listFeesDb.map(({ _id, headOfFamilyName, dateOfTransaction, transactionValue, months }) => ({
                id: _id,
                headOfFamilyName,
                dateOfTransaction: DateTime.fromJSDate(dateOfTransaction).toFormat('dd LLLL yyyy'),
                transactionValue,
                months: months.length > 1 ? months.map(({ year, month }) => DateTime.fromObject({
                    year,
                    month,
                }).toFormat('LLL yyyy')).filter((_, idx) => idx === 0 || idx === months.length - 1).join(' - ') : DateTime.fromObject({
                    year: months[0].year,
                    month: months[0].month,
                }).toFormat('LLL yyyy')
            }))
            const totalFees = await CitizenFees.countDocuments(query);

            res.render('citizen-fees', { headTitle: 'List Iuran', listFees, totalFees, currentUrl, skip: currentSkip, limit });
        } catch (e) {
            console.log(e);

            res.redirect('/dashboard')
        }
    })

router.route('/export')
    .post(isLoggedIn, async (req, res) => {
        try {
            const query = !req.user.admin ? {
                "owner": req.user._id
            } : {}

            // Fetch CitizenFees data
            const citizenFees = await CitizenFees.find(query).populate('owner');
    
            // Create a new workbook
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Iuran');
    
            // Define worksheet headers
            worksheet.columns = [
                { header: "Nama KK", key: "headOfFamilyName", width: 30 }, 
                { header: "Tanggal Transaksi", key: "dateOfTransaction", width: 15 }, 
                { header: "Nilai Transaksi", key: "transactionValue", width: 25 }, 
                { header: "Pembayaran Bulan", key: "months", width: 15 },
            ];
    
            // Add data to the worksheet
            citizenFees.forEach(citizenFee => {
                worksheet.addRow({
                    headOfFamilyName: citizenFee.headOfFamilyName,
                    dateOfTransaction: DateTime.fromJSDate(citizenFee.dateOfTransaction).toFormat('dd LLLL yyyy'),
                    transactionValue: citizenFee.transactionValue,
                    months: citizenFee.months.length > 1 ? citizenFee.months.map(({ year, month }) => DateTime.fromObject({
                        year,
                        month,
                    }).toFormat('LLL yyyy')).filter((_, idx) => idx === 0 || idx === citizenFee.months.length - 1).join(' - ') : DateTime.fromObject({
                        year: citizenFee.months[0].year,
                        month: citizenFee.months[0].month,
                    }).toFormat('LLL yyyy')
                });
            });
    
            // Set up the response headers 
            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"); 
            res.setHeader("Content-Disposition", `attachment; filename=list-iuran-${DateTime.now().toUnixInteger()}.xlsx`);

            // Write the workbook to the response object 
            await workbook.xlsx.write(res);
            await res.end();

            res.redirect('/citizen-fees');
        } catch (error) {
            console.error('Error exporting citizen fees to Excel:', error);
        }
    })

router.route('/delete/:feesId')
    .delete(isLoggedIn, isAdmin, async (req, res) => {
        try {
            await CitizenFees.deleteOne({ _id: req.params.feesId });
            res.redirect('/citizen-fees');
        } catch (e) {
            res.redirect('/citizen-fees');
        }
    })

module.exports = router;
