const User = require("../models/userModal");



// Function to get users and counts recursively
async function getUsersAndCounts(parentId) {
  const users = await User.find({ parent_id: parentId });
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

async function calculateTotalCountsForAllUsers() {
  try {
    // Find all users
    const users = await User.find();

    // Iterate through each user
    for (const user of users) {
      // Calculate counts for the user
      await getUsersAndCounts(user.own_id);
    }
  } catch (error) {
    console.error(`Error calculating counts for all users: ${error}`);
  }
}

calculateTotalCountsForAllUsers()
