const express = require("express");
const {
  registerUser,
  loginUser,
  logout,
  forgotPassword,
  resetPassword,
  getUserDetails,
  updatePassword,
  updateProfile,
  getAllUser,
  getSingleUser,
  updateUserRole,
  getMyUserTree,
  getMyIncome,
  getAllIncome,
  sendMoney,
  getMyTransactions,
  getAllTransactions,
  buyProduct,
  getMyProductTransactions,
  getAllProductTransactions,
  getAllPendingRequest,
  binaryMonthly,
  monthlyIncome,
} = require("../controllers/userController");
const { isAuthenticatedUser} = require("../middlewares/auth");

const router = express.Router();
//Register
router.route("/register").post(registerUser);

//login
router.route("/login").post(loginUser);

//logout
router.route("/logout").get(logout);

//forgotpassword
router.route("/password/forgot").post(forgotPassword);
//ResetPassword
router.route("/password/reset/:token").put(resetPassword);

//get my profile
router.route("/me").get( getUserDetails);

//getmy income
router.route("/me/income").get( getMyIncome);

//get my user tree or downline
router.route("/me/tree").get( getMyUserTree);

//change password
router.route("/password/update").put( updatePassword);

//update profile
router.route("/me/update").put( updateProfile);

//get all user--Admin
router
  .route("/admin/users")
  .get(  getAllUser);

router
  .route("/admin/user/:id")
  .get(  getSingleUser)
  .put(  updateUserRole);

router
  .route("/all/income")
  .get(  getAllIncome);

//send Money--user
router.route("/sendmoney").post( sendMoney);

//my transaction
router.route("/mytransactions").get( getMyTransactions);

//get all transaction--Admin
router
  .route("/admin/transactions")
  .get(  getAllTransactions);

//buy product
router.route("/buyproduct").post( buyProduct);

//my product purchase history
router.route("/mypurchase").get( getMyProductTransactions);

//get all product transaction--Admin
router
  .route("/admin/producttransactions")
  .get( getAllProductTransactions);

//get all Pending Request
router
  .route("/admin/pendingrequests")
  .get(getAllPendingRequest);


//binary monthly income
router.route("/binaryincome").get(binaryMonthly);

//monthly income
router.route("/monthlyincome").post(monthlyIncome);




module.exports = router;
