// api/scheduled-task.js
const {calculateIncomeForAllUsers} = require("../controllers/userController");


module.exports = async (req, res) => {
    try {
      const userIncomes = await calculateIncomeForAllUsers();
      console.log(`Income calculation successful at ${new Date()}. Result:`, userIncomes);
      res.status(200).send('Income calculation successful.');
    } catch (error) {
      console.error(`Error during income calculation at ${new Date()}: ${error}`);
      res.status(500).send('Internal server error.');
    }
  };