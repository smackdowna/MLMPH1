const User = require("./models/userModal");
const Income = require("./models/incomeModal");



// // Calculate and generate income based on sales ratio
function calculateSalesIncome(user) {
    return new Promise(async (resolve, reject) => {
      try {
        const bonusPercentage = 0.05; // 5% bonus
  
        const leftChildCountPromise = User.countDocuments({ parent_id: user.own_id, position: 'Left' });
        const rightChildCountPromise = User.countDocuments({ parent_id: user.own_id, position: 'Right' });
  
        // Wait for both promises to resolve
        const [leftChildCount, rightChildCount] = await Promise.all([leftChildCountPromise, rightChildCountPromise]);
  
        console.log(leftChildCount,rightChildCount)
        // Determine the minimum count from both sides
        const minCount = Math.min(leftChildCount, rightChildCount);
  
        console.log(minCount);
        // Calculate the bonus income based on the minimum count
        const bonusAmount = minCount * 11500 * bonusPercentage * 2; // Adjust productPrice as needed
  
        let test1=user.income
  
        console.log(test1)
        // Save the bonus income to the user
        user.income += bonusAmount;
  
        let test2 = user.income
        console.log(test2);
  
        let sum = test2-test1;
        
  
        console.log(sum);
        await Income.create({
          user:user._id,
          name:user.name,
          own_id:user.own_id,
          sponsorId:user.sponsorId,
          income:sum
        });
  
        console.log(`Sales income calculated and generated successfully for user ${user.name}`);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }
  
  // Example usage
  const userId = '0987654321';
  
  User.findOne({ own_id: userId })
  
    .then(user => {
      if (user) {
        return calculateSalesIncome(user);
      } else {
        throw new Error('User not found');
      }
    })
    .catch(error => console.error(error));
  