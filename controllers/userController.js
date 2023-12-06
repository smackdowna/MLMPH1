const User = require("../models/userModal");
const binary = require("../models/binaryIncome");
const Income = require("../models/incomeModal");
const transactions = require("../models/transactionsModal");
const product = require("../models/productTransactionModal");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const sendToken = require("../utils/jwtToken");
const sendEmail = require("../utils/sendEmail.js");
const crypto = require("crypto");

// Define the getParentId function
async function getParentId(leg, parentId) {
  try {
    let user = await User.findOne({ position: leg, parent_id: parentId });

    while (user) {
      parentId = user.own_id;
      user = await User.findOne({ parent_id: parentId });
    }

    return parentId;
  } catch (error) {
    throw error;
  }
}

// Calculate Direct Referral Bonus
async function calculateDirectReferralBonus(sponsorId) {
  try {
    // Assuming 15% direct referral bonus
    const bonusPercentage = 0.15;
    const directReferralBonus = 11000 * bonusPercentage; // Adjust productPrice as needed

    const sponsor = await User.findOne({ own_id: sponsorId, status: "Active" });
    if (sponsor) {
      sponsor.income += directReferralBonus;
      await sponsor.save();

      await binary.create({
        user_id: sponsor.id,
        own_id: sponsor.own_id,
        name: sponsor.name,
        email: sponsor.email,
        inc: directReferralBonus,
        date: new Date(),
        month: new Date().toLocaleString("default", { month: "long" }),
        year: new Date().getFullYear(),
      });
    }
  } catch (error) {
    throw error;
  }
}

// Calculate Binary Bonus for a user
async function calculateBinaryBonus(user) {
  try {
    // Assuming 10% binary bonus for a balanced pair
    const bonusPercentage = 0.1;

    const parent = await User.findOne({ own_id: user.parent_id, status: "Active" });
    if (parent) {
      // Fetch the parent's left and right children
      const leftChild = await User.findOne({
        parent_id: parent.own_id,
        position: "Left",
      });
      const rightChild = await User.findOne({
        parent_id: parent.own_id,
        position: "Right",
      });

      if (leftChild && rightChild) {
        // Both left and right children exist, so a balanced pair is completed
        const binaryBonus = 5500 * bonusPercentage; // Adjust productPrice as needed
        parent.income += binaryBonus;
        await parent.save();

        await binary.create({
          user_id: parent.id,
          own_id: parent.own_id,
          name: parent.name,
          email: parent.email,
          inc: binaryBonus,
          date: new Date(),
          month: new Date().toLocaleString("default", { month: "long" }),
          year: new Date().getFullYear(),
        });
      }
    }
  } catch (error) {
    throw error;
  }
}

async function calculateeTotalCountsForAllUsers() {
  try {
    // Find all users
    const users = await User.find({ status: "Active" });

    // Iterate through each user
    for (const user of users) {
      // Calculate counts for the user
      await getUsersAndCounts(user.own_id);
    }
  } catch (error) {
    console.error(`Error calculating counts for all users: ${error}`);
  }
}

// Function to get users and counts recursively
async function getUsersAndCounts(parentId) {
  const users = await User.find({ parent_id: parentId, status: "Active" });
  const counts = { left: 0, right: 0 };

  for (const user of users) {
    const childrenCounts = await getUsersAndCounts(user.own_id);
    counts.left +=
      user.position === "Left"
        ? 1 + childrenCounts.left + childrenCounts.right
        : 0;
    counts.right +=
      user.position === "Right"
        ? 1 + childrenCounts.left + childrenCounts.right
        : 0;
  }

  // Update TotalLeftCount and TotalRightCount in the database
  await User.updateOne(
    { own_id: parentId },
    { TotalLeftCount: counts.left, TotalRightCount: counts.right }
  );

  return counts;
}

// Register a user and calculate bonuses
exports.registerUser = catchAsyncErrors(async (req, res, next) => {
  const { name, email, own_id, sponsor_id, position, password } = req.body;

  const user1 = await User.findOne({ own_id: own_id });

  if (user1) {
    return next(new ErrorHandler("This Number is already registered", 400));
  }

  const sponsor = await User.findOne({ own_id: sponsor_id });

  if (!sponsor) {
    return next(new ErrorHandler("Sponsor Number doesn't exist", 400));
  }
  const parentId = await getParentId(position, sponsor_id);
  try {
    // Create the user
    const user = await User.create({
      name,
      email,
      own_id,
      sponsor_id,
      parent_id: parentId,
      position,
      password, // Remember to hash the password before saving
    });

    sendToken(user, 201, res);
  } catch (error) {
    // If there's an error, stop further execution
    return next(error);
  }
});

//login user
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  // checking if user has given password and email both

  if (!email || !password) {
    return next(new ErrorHandler("Please Enter Email & Password", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  sendToken(user, 200, res);
});

// Logout User
exports.logout = catchAsyncErrors(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged Out",
  });
});

// Forgot Password
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Get ResetPassword Token
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  const resetPasswordUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/password/reset/${resetToken}`;

  const message = `Your password reset token is :- \n\n ${resetPasswordUrl} \n\nIf you have not requested this email then, please ignore it.`;

  try {
    await sendEmail({
      email: user.email,
      subject: `MLM Password Recovery`,
      message,
    });

    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorHandler(error.message, 500));
  }
});

// Reset Password
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  // creating token hash
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new ErrorHandler(
        "Reset Password Token is invalid or has been expired",
        400
      )
    );
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler("Password does not password", 400));
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  sendToken(user, 200, res);
});

// Get my profile
exports.getUserDetails = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    user,
  });
});

// update User password
exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Old password is incorrect", 400));
  }

  if (req.body.newPassword !== req.body.confirmPassword) {
    return next(new ErrorHandler("password does not match", 400));
  }

  user.password = req.body.newPassword;

  await user.save();

  sendToken(user, 200, res);
});

// update User Profile
exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
  };

  const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
  });
});

// Get all users(admin)
exports.getAllUser = catchAsyncErrors(async (req, res, next) => {
  const userCount = await User.countDocuments();
  const users = await User.find();

  res.status(200).json({
    success: true,
    userCount,
    users,
  });
});

// Get single user (admin)
exports.getSingleUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorHandler(`User does not exist with Id: ${req.params.id}`)
    );
  }

  res.status(200).json({
    success: true,
    user,
  });
});

// update User status Active -- Admin
exports.updateUserRoleActive = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    status: req.body.status,
  };

  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorHandler(`User does not exist with Id: ${req.params.id}`)
    );
  }

  const spon = user.sponsor_id;

  await User.findByIdAndUpdate(req.params.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  // Calculate Direct Referral Bonus
  await calculateDirectReferralBonus(spon);

  //calcualte binary bonous
  await calculateBinaryBonus(user);


  await calculateeTotalCountsForAllUsers();

  res.status(200).json({
    success: true,
    message: "User Is Activated",
  });
});

// update User status Dead -- Admin
exports.updateUserRoleDead = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    status: req.body.status,
  };

  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorHandler(`User does not exist with Id: ${req.params.id}`)
    );
  }

  await User.findByIdAndUpdate(req.params.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    message: "User Is Set to dead Status",
  });
});

//monthly binary income
exports.binaryMonthly = catchAsyncErrors(async (req, res, next) => {
  const income = await binary.find({ user_id: req.user.id });

  const monthlyIncome = income.reduce((acc, income) => {
    const { month, inc } = income;
    if (!acc[month]) {
      acc[month] = 0;
    }
    acc[month] += inc;
    return acc;
  }, {});

  res.status(200).json({
    success: true,
    monthlyIncome,
  });
});

/////------------------------------------------------------------------

// Define a function to fetch users based on parent_id and create a tree structure
async function getUsersByParentId(parentId) {
  try {
    // Find all users with 'parent_id' matching the provided 'parentId'
    const childUsers = await User.find({ parent_id: parentId });

    // Initialize an array to hold child nodes
    const childNodes = [];

    // Fetch child nodes for each child user
    for (const childUser of childUsers) {
      const childNode = {
        user: childUser,
        children: await getUsersByParentId(childUser.own_id),
      };
      childNodes.push(childNode);
    }

    return childNodes;
  } catch (error) {
    console.error(`Error fetching users by parent_id: ${error}`);
    return [];
  }
}

// Define a function to fetch the root user and build the tree structure
async function getUsersTreeStartingFromRoot(rootOwnId) {
  try {
    // Find the root user with the specified 'own_id'
    const rootUser = await User.findOne({ own_id: rootOwnId });

    if (!rootUser) {
      console.log(`Root user not found with own_id: ${rootOwnId}`);
      return null;
    }

    // Initialize the root node
    const rootNode = {
      user: rootUser,
      children: [],
    };

    // Recursively build the tree structure for child users
    rootNode.children = await getUsersByParentId(rootOwnId);

    return rootNode;
  } catch (error) {
    console.error(
      `Error fetching root user and building tree structure: ${error}`
    );
    return null;
  }
}

// Get my tree
exports.getMyUserTree = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const userId = user.own_id;

  const tree = await getUsersTreeStartingFromRoot(user.own_id);

  res.status(200).json({
    success: true,
    userTree: tree,
  });
});

//get my Income
exports.getMyIncome = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const income = await Income.find({ user_id: user.id });

  res.status(200).json({
    success: true,
    RefralIncome: user.income,
    income,
  });
});

//get all Income----Admin Route
exports.getAllIncome = catchAsyncErrors(async (req, res, next) => {
  const income = await Income.find();

  res.status(200).json({
    success: true,
    income,
  });
});

//send money
exports.sendMoney = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  const { recevier_own_id, amount } = req.body;

  if (user.wallet < amount) {
    return res.status(400).json({ error: "Insufficient funds" });
  }

  user.wallet -= amount;
  await user.save();

  // Update receiver balance
  const receiver = await User.findOne({ own_id: recevier_own_id });
  if (!receiver) {
    return res.status(400).json({ error: "Receiver not found" });
  }
  receiver.wallet += Number(amount);
  await receiver.save();

  // Insert transaction record
  const transaction = new transactions({
    sender_own_id: user.own_id,
    recevier_own_id,
    amount,
  });
  await transaction.save();

  res.status(200).json({
    message: "Money sent successfully",
  });
});

//view transaction --user
exports.getMyTransactions = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const debit = await transactions.find({ sender_own_id: user.own_id });
  const credit = await transactions.find({ recevier_own_id: user.own_id });

  res.status(200).json({
    success: true,
    debit,
    credit,
  });
});

//get All Transactions---Admin
exports.getAllTransactions = catchAsyncErrors(async (req, res, next) => {
  const count = await transactions.countDocuments();
  const trans = await transactions.find();

  res.status(200).json({
    success: true,
    count,
    trans,
  });
});

//buy product---user
exports.buyProduct = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const { productCost } = req.body;

  if (!productCost) {
    return next(new ErrorHandler("Please Enter Product Cost", 400));
  }

  // Check if wallet balance is sufficient
  if (user.wallet < productCost) {
    return res.status(400).json({ error: "Insufficient funds" });
  }

  // Deduct product cost from wallet balance
  user.wallet -= productCost;
  await user.save();

  const productspurchase = new product({
    Buy_user_own_id: user.own_id,
    productCost: productCost,
    type: "Purchased",
  });
  await productspurchase.save();

  res.status(200).json({
    success: true,
    message: "You have successfully purchase the product",
  });
});

//view  my puchased history --user
exports.getMyProductTransactions = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const trans = await product.find({ Buy_user_own_id: user.own_id });

  res.status(200).json({
    success: true,
    trans,
  });
});

//get All Transactions---Admin
exports.getAllProductTransactions = catchAsyncErrors(async (req, res, next) => {
  const count = await product.countDocuments();
  const trans = await product.find();

  res.status(200).json({
    success: true,
    count,
    trans,
  });
});

//get All new user Pending request
exports.getAllPendingRequest = catchAsyncErrors(async (req, res, next) => {
  const count = await User.countDocuments({ status: "Inactive" });
  const user = await User.find({ status: "Inactive" });

  res.status(200).json({
    success: true,
    count,
    user,
  });
});

//get All new user Pending request
exports.getAllDeadID = catchAsyncErrors(async (req, res, next) => {
  const count = await User.countDocuments({ status: "Dead" });
  const user = await User.find({ status: "Dead" });

  res.status(200).json({
    success: true,
    count,
    user,
  });
});

// Function to calculate income for a user based on totalLeftCount and totalRightCount
function calculateIncome(
  totalLeftCount,
  totalRightCount,
  lastMinCount,
  lastLeftCarryForward,
  lastRightCarryForward
) {
  // Check for changes in TotalLeftCount and TotalRightCount
  if (
    totalLeftCount === lastLeftCarryForward &&
    totalRightCount === lastRightCarryForward
  ) {
    return {
      income: 0,
      minCount: 0,
      leftCarryForward: 0,
      rightCarryForward: 0,
    };
  }

  // Calculate the minimum count based on the last entry
  const minCount = Math.min(totalLeftCount, totalRightCount) - lastMinCount;

  // Calculate income
  const productPrice = 11000; // Adjust product price as needed
  const bonusPercentage = 0.05; // 5% bonus
  const income = minCount * productPrice * bonusPercentage * 2;

  // Calculate new carry forwards
  const newTotalLeftCount = totalLeftCount - minCount;
  const newTotalRightCount = totalRightCount - minCount;
  const leftCarryForward =
    lastLeftCarryForward + (totalLeftCount - newTotalLeftCount);
  const rightCarryForward =
    lastRightCarryForward + (totalRightCount - newTotalRightCount);

  return { income, minCount, leftCarryForward, rightCarryForward };
}

// Function to calculate income for all users
async function calculateIncomeForAllUsers() {
  try {
    // Check if the Income collection is empty
    const isFirstRun = !(await Income.findOne());

    // Find all users
    const users = await User.find();

    // Initialize an array to store user incomes
    const userIncomes = [];

    // Iterate through each user
    for (const user of users) {
      // Find the last income entry for the user
      const lastIncomeEntry = await Income.findOne(
        { user_id: user._id },
        {},
        { sort: { date: -1 } }
      );

      // Check if it's the first run or there's a change in counts
      if (
        isFirstRun ||
        (lastIncomeEntry &&
          (lastIncomeEntry.TotalLeftCount !== user.TotalLeftCount ||
            lastIncomeEntry.TotalRightCount !== user.TotalRightCount))
      ) {
        // Calculate income details for the user
        const { income, minCount, leftCarryForward, rightCarryForward } =
          calculateIncome(
            user.TotalLeftCount,
            user.TotalRightCount,
            lastIncomeEntry ? lastIncomeEntry.minCount : 0,
            lastIncomeEntry ? lastIncomeEntry.leftCarryForward : 0,
            lastIncomeEntry ? lastIncomeEntry.rightCarryForward : 0
          );

        // Add user details and income to the array
        userIncomes.push({
          user_id: user._id,
          own_id: user.own_id,
          name: user.name,
          email: user.email,
          income: income,
          minCount: minCount,
          leftCarryForward: leftCarryForward,
          rightCarryForward: rightCarryForward,
          date: new Date(),
          month: new Date().toLocaleString("default", { month: "long" }),
          year: new Date().getFullYear(),
        });
      }
    }

    // Insert the calculated incomes into the Income table
    await Income.insertMany(userIncomes);

    return userIncomes;
  } catch (error) {
    console.error(`Error calculating income for all users: ${error}`);
    return [];
  }
}

//generate monthly income
exports.monthlyIncome = catchAsyncErrors(async (req, res, next) => {
  await calculateIncomeForAllUsers();

  res.status(200).json({
    success: true,
    message: "Income generated successfully",
  });
});
