const express = require('express');
const passport = require('passport');
const router = express.Router();
const { isGuest } = require('../middleware')

router.route('/login')
  .get(isGuest, (req, res) => {
    res.render('login');
  })
  .post( passport.authenticate('local', { failureFlash: 'Your username and / or password wrong', failureRedirect: '/login' }), (req, res) => {
    req.login(req.user, () => res.redirect('/dashboard'));
  });

router.get('/logout', (req, res) => {
  req.logout({}, () => res.redirect('/login'));
});

module.exports = router;