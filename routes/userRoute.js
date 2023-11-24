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
router.route("/me").get(isAuthenticatedUser, getUserDetails);

//getmy income
router.route("/me/income").get(isAuthenticatedUser, getMyIncome);

//get my user tree or downline
router.route("/me/tree").get(isAuthenticatedUser, getMyUserTree);

//change password
router.route("/password/update").put(isAuthenticatedUser, updatePassword);

//update profile
router.route("/me/update").put(isAuthenticatedUser, updateProfile);

//get all user--Admin
router
  .route("/admin/users")
  .get(isAuthenticatedUser,  getAllUser);

router
  .route("/admin/user/:id")
  .get(isAuthenticatedUser,  getSingleUser)
  .put(isAuthenticatedUser,  updateUserRole);

router
  .route("/all/income")
  .get(isAuthenticatedUser,  getAllIncome);

//send Money--user
router.route("/sendmoney").post(isAuthenticatedUser, sendMoney);

//my transaction
router.route("/mytransactions").get(isAuthenticatedUser, getMyTransactions);

//get all transaction--Admin
router
  .route("/admin/transactions")
  .get(isAuthenticatedUser,  getAllTransactions);

//buy product
router.route("/buyproduct").post(isAuthenticatedUser, buyProduct);

//my product purchase history
router.route("/mypurchase").get(isAuthenticatedUser, getMyProductTransactions);

//get all product transaction--Admin
router
  .route("/admin/producttransactions")
  .get( isAuthenticatedUser,getAllProductTransactions);

//get all Pending Request
router
  .route("/admin/pendingrequests")
  .get(isAuthenticatedUser,getAllPendingRequest);


//binary monthly income
router.route("/binaryincome").get(isAuthenticatedUser,binaryMonthly);

//monthly income
router.route("/monthlyincome").post(isAuthenticatedUser,monthlyIncome);




module.exports = router;
