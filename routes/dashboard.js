const express = require('express');
const router = express.Router();
const multer = require('multer');
const { DateTime } = require('luxon');

const { isLoggedIn } = require('../middleware');
const CitizenFees = require('../model/citizenFees');
const Outcome = require('../model/outcome');

const { storage, cloudinary } = require('../cloudinary/cloudinary');
const upload = multer({ storage });

router.route('/')
  .get(isLoggedIn, async (req, res) => {
    // TODO: List For Query
    // monthly trend for 6 month on income and outcome
    // income, outcome, gap
    // outcome distribution

    res.render('dashboard', { headTitle: 'Dashboard' });
  })

module.exports = router;