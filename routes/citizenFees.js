require('dotenv').config();
const ExcelJS = require("exceljs");
const express = require('express');
const { DateTime } = require('luxon');
const multer = require('multer');

const CitizenFees = require('../model/citizenFees');
const { isLoggedIn } = require('../middleware');
const { formatCurrency } = require('../helperFunctions');

const router = express.Router();

const { storage, cloudinary } = require('../cloudinary/cloudinary');
const upload = multer({ storage });

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
                transactionValue: String(formatCurrency(transactionValue)).replace('Rp', ''),
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

router.route('/add')
    .get(isLoggedIn, async (req, res) => {
        const min = DateTime.now().toFormat('yyyy-LL-dd')
        res.render('citizen-fees/add-iuran', { headTitle: 'Form Iuran', min });
    })
    .post(isLoggedIn, upload.array('images'), async (req, res) => {
        const images = req.files.map(f => ({url: f.path, filename: f.filename}));

        const getMonthRange = (startMonth, endMonth) => {
            const startDate = DateTime.fromISO(startMonth + '-01');
            const endDate = DateTime.fromISO(endMonth + '-01').endOf('month');
    
            let current = startDate.startOf('month');
            const months = [];
    
            while (current <= endDate) {
                months.push({ year: Number(current.toFormat('yyyy')), month: Number(current.toFormat('MM')) });
                current = current.plus({ months: 1 });
            }

            return months;
        }

        const { startMonth, endMonth, ...form } = req.body

        const newcitizenfees = new CitizenFees({ 
            ...form,
            headOfFamilyName: req.user.admin ? form.headOfFamilyName : req.user.headOfFamilyName,
            address: req.user.admin ? form.address : req.user.address,
            images,
            owner: req.user,
            months: endMonth ? getMonthRange(startMonth, endMonth) : [
                {
                    year: DateTime.fromISO(startMonth + '-01').toFormat('yyyy'),
                    month: DateTime.fromISO(startMonth + '-01').toFormat('MM'),
                },
            ],
        });

         await newcitizenfees.save();

         res.redirect('/citizen-fees');
    });

router.route('/edit/:feesId')
    .get(isLoggedIn, async (req, res) => {
        const editedFees = await CitizenFees.findById(req.params.feesId)

        const startMonth = `${editedFees.months[0].year}-${editedFees.months[0].month < 10 ? `0${editedFees.months[0].month}` : editedFees.months[0].month}`
        const endMonth = editedFees.months.length > 1 ? `${editedFees.months[editedFees.months.length - 1].year}-${editedFees.months[editedFees.months.length - 1].month < 10 ? `0${editedFees.months[editedFees.months.length - 1].month}` : editedFees.months[editedFees.months.length - 1].month}` : ''

        const dateOfTransaction = DateTime.fromJSDate(editedFees.dateOfTransaction).toFormat('yyyy-MM-dd')

        res.render('citizen-fees/edit-iuran', { headTitle: 'Form Iuran', editedFees, startMonth, endMonth, dateOfTransaction });
    })
    .patch(isLoggedIn, upload.array('images'), async (req, res) => {
        const { startMonth, endMonth, deleteImg, ...form } = req.body

        const fees = await CitizenFees.findByIdAndUpdate({ _id: req.params.feesId }, { ...form });
        const images = req.files.map(f => ({ url: f.path, filename: f.filename }));
        fees.images.push(...images);

        if (!req.user.admin) {
            fees.headOfFamilyName = req.user.headOfFamilyName
            fees.address = req.user.address
        }

        const getMonthRange = (startMonth, endMonth) => {
            const startDate = DateTime.fromISO(startMonth + '-01');
            const endDate = DateTime.fromISO(endMonth + '-01').endOf('month');
    
            let current = startDate.startOf('month');
            const months = [];
    
            while (current <= endDate) {
                months.push({ year: Number(current.toFormat('yyyy')), month: Number(current.toFormat('MM')) });
                current = current.plus({ months: 1 });
            }

            return months;
        }

        fees.months = endMonth ? getMonthRange(startMonth, endMonth) : [
            {
                year: DateTime.fromISO(startMonth + '-01').toFormat('yyyy'),
                month: DateTime.fromISO(startMonth + '-01').toFormat('MM'),
            },
        ]

        await fees.save();

        if (deleteImg) {
            if(deleteImg.length > 1){
                for(let filename of deleteImg){
                    // delete images from cloudinary
                    await cloudinary.uploader.destroy(filename);
                }
            } else {
                await cloudinary.uploader.destroy(deleteImg[0]);
            }
            // delete images from mongoose
            await fees.updateOne({ $pull: { images: { filename: { $in: deleteImg } } } });
        }

         res.redirect('/citizen-fees');
    });

router.route('/delete/:feesId')
    .delete(isLoggedIn, async (req, res) => {
        try {
            await CitizenFees.deleteOne({ _id: req.params.feesId });
            res.redirect('/citizen-fees');
        } catch (e) {
            res.redirect('/citizen-fees');
        }
    })

module.exports = router;
