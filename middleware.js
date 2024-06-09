const User = require('./model/user');

const isLoggedIn = (req, res, next) => {
  if(!req.isAuthenticated()){
    req.flash('error', 'You are not authenticated');
    return res.redirect('/login');
  }
  next();
};

const isGuest = (req, res, next) => {
  if(req.isAuthenticated()){
    return res.redirect('/dashboard');
  }
  next();
};

const isAdmin = async (req, res, next) => {
  const userId = req.user._id;
  const user = await User.findOne({_id: userId});
  if(user.admin !== true){
    if(!req.isAuthenticated()){
      req.flash('error', 'You are not authenticated');
      return res.redirect('/login');
    } else {
      req.flash('error', 'You are not authorized');
      return res.redirect('/dashboard');
    }
  }
  next();
}

module.exports = { isLoggedIn, isAdmin, isGuest };