const express = require("express");
const router = express.Router();
const Outcome = require("../model/outcome");
const { isLoggedIn, isAdmin } = require("../middleware");

router.route("/").get(isLoggedIn, isAdmin, async (req, res) => {
  const listOutcome = await Outcome.find({});
  res.render("outcome/index", { headTitle: "Pengeluaran", listOutcome });
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
