const express = require('express');
const router = express.Router();
const User = require('../model/user');
const { isLoggedIn, isAdmin } = require('../middleware');

router.route('/')
    .get(isLoggedIn, isAdmin, async (req, res) => {
        const listUser = await User.find({});
        console.log(listUser)
        res.render('user', { headTitle: 'Warga', listUser });
    })

router.route('/add')
    .get(isLoggedIn, isAdmin, async (req, res) => {
        res.render('user/add-user', { headTitle: 'Tambah Warga' });
    })
    .post(isLoggedIn, isAdmin, async (req, res) => {
        const form = req.body
        const user = new User({ 
            IDNumber: Number(form.IDNumber),
            headOfFamilyName: form.headOfFamilyName,
            address: form.address,
            username: form.headOfFamilyName,
         });
        await User.register(user, form.password);
        res.redirect('/user');
    })

router.route('/edit/:userId')
    .get(isLoggedIn, isAdmin, async (req, res) => {
        const editedUser = await User.findOne({ _id: req.params.userId })
        res.render('user/edit-user', { headTitle: 'Edit Warga', editedUser });
    })

module.exports = router;