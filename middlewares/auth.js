const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const jwt = require("jsonwebtoken");
const User = require("../models/userModal");

exports.isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
  
  const myHeaders = req.headers;
  
  console.log('This is header',myHeaders)
  
  const { token } = req.cookies;

  console.log('This is token',token)

  if (!token) {
    return next(new ErrorHandler("Please Login to access this resource", 401));
  }

  const decodedData = jwt.verify(token, process.env.JWT_SECRET);

  req.user = await User.findById(decodedData.id);

  next();
});

exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(
          `Role: ${req.user.role} is not allowed to access this resouce `,
          403
        )
      );
    }

    next();
  };
};