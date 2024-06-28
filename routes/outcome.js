const express = require("express");
const { DateTime } = require("luxon");
const ExcelJS = require("exceljs");

const Outcome = require("../model/outcome");
const { isLoggedIn, isAdmin } = require("../middleware");
const { formatCurrency } = require('../helperFunctions');

const router = express.Router();

router.route("/").get(isLoggedIn, isAdmin, async (req, res) => {
  const listOutcome = await Outcome.find({});

  const convertJsDateToFormat = (dateOfTransaction) => DateTime.fromJSDate(dateOfTransaction).toFormat('dd LLLL yyyy')

  res.render("outcome/index", { headTitle: "Pengeluaran", listOutcome, formatCurrency, convertJsDateToFormat });
});

router.route('/export')
    .post(isLoggedIn, isAdmin, async (req, res) => {
        try {
            // Fetch Outcome data
            const outcomes = await Outcome.find({});
    
            // Create a new workbook
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Iuran');
    
            // Define worksheet headers
            worksheet.columns = [
                { header: "Jenis Transaksi", key: "typeOfTransaction", width: 30 }, 
                { header: "Tanggal Transaksi", key: "dateOfTransaction", width: 15 }, 
                { header: "Nilai Transaksi", key: "transactionValue", width: 25 },
            ];
    
            // Add data to the worksheet
            outcomes.forEach(outcome => {
                worksheet.addRow({
                  typeOfTransaction: outcome.typeOfTransaction,
                  dateOfTransaction: DateTime.fromJSDate(outcome.dateOfTransaction).toFormat('dd LLLL yyyy'),
                  transactionValue: outcome.transactionValue,
                });
            });
    
            // Set up the response headers 
            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"); 
            res.setHeader("Content-Disposition", `attachment; filename=list-pengeluaran-${DateTime.now().toUnixInteger()}.xlsx`);

            // Write the workbook to the response object 
            await workbook.xlsx.write(res);
            await res.end();

            res.redirect('/outcome');
        } catch (error) {
            console.error('Error exporting citizen fees to Excel:', error);
        }
    });

router
  .route("/add")
  .get(isLoggedIn, isAdmin, (req, res) => {
    res.render("outcome/add-outcome", { headTitle: "Tambah Pengeluaran" });
  })
  .post(isLoggedIn, isAdmin, async (req, res) => {
    try {
      const form = req.body;
      const outcome = new Outcome({
        typeOfTransaction: form.typeOfTransaction,
        dateOfTransaction: form.dateOfTransaction,
        transactionValue: form.transactionValue,
      });
      await outcome.save();
      req.flash("success", "Pengeluaran berhasil ditambahkan");
      res.redirect("/outcome");
    } catch (error) {
      console.error("Error while saving outcome:", error);
      req.flash("error", "Terjadi kesalahan saat menambahkan pengeluaran");
      res.redirect("/outcome/add");
    }
  });

router
  .route("/edit/:id")
  .get(isLoggedIn, isAdmin, async (req, res) => {
    const outcome = await Outcome.findById(req.params.id);
    res.render("outcome/edit-outcome", {
      headTitle: "Edit Pengeluaran",
      outcome,
    });
  })
  .patch(isLoggedIn, isAdmin, async (req, res) => {
    const { id } = req.params;
    const form = req.body;
    await Outcome.updateOne({ _id: id }, form);
    req.flash("success", "Pengeluaran berhasil diupdate");
    res.redirect("/outcome");
  });

router.delete("/:id", isLoggedIn, isAdmin, async (req, res) => {
  const { id } = req.params;
  await Outcome.findByIdAndDelete(id);
  req.flash("success", "Pengeluaran berhasil dihapus");
  res.redirect("/outcome");
});

module.exports = router;
