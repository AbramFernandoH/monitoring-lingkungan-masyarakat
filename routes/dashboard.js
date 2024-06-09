const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middleware');

router.route('/')
  .get(isLoggedIn, async (req, res) => {
    res.render('dashboard', { headTitle: 'Dashboard' });
  })

module.exports = router;