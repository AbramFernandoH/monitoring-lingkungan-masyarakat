require('dotenv').config();
const express = require('express');
const router = express.Router();
const User = require('../model/user');
const { isLoggedIn, isAdmin } = require('../middleware');

router.route('/')
    .get(isLoggedIn, isAdmin, async (req, res) => {
        const { skip } = req.query
        const currentSkip = skip ? Number(skip) : 0
        const currentUrl = process.env.ENVIROMENT === 'development' ? `${req.protocol}://${req.hostname}:${process.env.PORT}${req.path}user` : `${req.protocol}://${req.hostname}${req.path}user`

        const query = {
            admin: false
        }
        const limit = 10
        const listUser = await User.find(query).limit(limit).skip(currentSkip);
        const totalUser = await User.countDocuments(query);

        res.render('user', { headTitle: 'Warga', listUser, totalUser, currentUrl, skip: currentSkip, limit });
    })

router.route('/add')
    .get(isLoggedIn, isAdmin, async (req, res) => {
        res.render('user/add-user', { headTitle: 'Tambah Warga' });
    })
    .post(isLoggedIn, isAdmin, async (req, res) => {
        const { IDNumber, headOfFamilyName, password } = req.body
        const user = new User({ 
            ...req.body,
            admin: false,
            IDNumber: Number(IDNumber),
            username: String(headOfFamilyName),
         });
        await User.register(user, password);
        res.redirect('/user');
    })

router.route('/edit/:userId')
    .get(isLoggedIn, isAdmin, async (req, res) => {
        const editedUser = await User.findById(req.params.userId)
        res.render('user/edit-user', { headTitle: 'Edit Warga', editedUser });
    })
    .patch(isLoggedIn, isAdmin, async (req, res) => {
        try {
            const editedUser = await User.findById(req.params.userId);
            const { password, ...rest } = req.body;
            
            if (password.length > 0) {
                await editedUser.setPassword(password);
                await editedUser.save();
            }

            const result = await User.updateOne({ _id: req.params.userId }, rest);
            res.redirect('/user');
        } catch (e) {
            res.redirect('/user');
        }
    })

router.route('/delete/:userId')
    .delete(isLoggedIn, isAdmin, async (req, res) => {
        try {
            await User.deleteOne({ _id: req.params.userId });
            res.redirect('/user');
        } catch (e) {
            res.redirect('/user');
        }
    })

module.exports = router;