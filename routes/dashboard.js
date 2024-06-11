const express = require('express');
const router = express.Router();
const multer = require('multer');
const { DateTime } = require('luxon');

const { isLoggedIn, isAdmin } = require('../middleware');
const CitizenFees = require('../model/citizenFees');
const Outcome = require('../model/outcome');

const { storage, cloudinary } = require('../cloudinary/cloudinary');
const upload = multer({ storage });

router.route('/')
  .get(isLoggedIn, async (req, res) => {
    // Calculate the date 6 months ago from today
    const sixMonthsAgo = DateTime.local().minus({ months: 5 }).startOf('month');
    const today = DateTime.local().startOf('day');

    // Create an array of months to loop through
    const monthsArray = [];
    let currentMonth = sixMonthsAgo;
    while (currentMonth <= today) {
        monthsArray.push(currentMonth);
        currentMonth = currentMonth.plus({ months: 1 });
    }
    // monthly trend for 6 month on income and outcome
    // Aggregate query to sum up values for each month
    const outcomeTotalFor6Months = monthsArray.map((month) => {
      const startOfMonth = month.startOf('month').toJSDate();
      const endOfMonth = month.endOf('month').toJSDate();
      return Outcome.aggregate([
          {
              $match: {
                  Date: { $gte: startOfMonth, $lte: endOfMonth }
              }
          },
          {
              $group: {
                  _id: null,
                  totalValue: { $sum: "$value" }
              }
          }
      ])
    });

    const outcomeTrends = await Promise.all(outcomeTotalFor6Months)
    const outcomeTrendsTotalValueOnly = outcomeTrends.flatMap((val) => val[0] ? val[0].totalValue : 0)
    
    const incomeTotalFor6Months = monthsArray.map((month) => {
      const startOfMonth = month.startOf('month').toJSDate();
      const endOfMonth = month.endOf('month').toJSDate();
      return CitizenFees.aggregate([
          {
              $match: {
                dateOfTransaction: { $gte: startOfMonth, $lte: endOfMonth }
              }
          },
          {
              $group: {
                  _id: null,
                  totalValue: { $sum: "$transactionValue" }
              }
          }
      ])
    });

    const incomeTrends = await Promise.all(incomeTotalFor6Months)
    const incomeTrendsTotalValueOnly = incomeTrends.flatMap((val) => val[0] ? val[0].totalValue : 0)

    // income, outcome, gap
    const totalOutcomes = outcomeTrendsTotalValueOnly.reduce((curr, acc) => curr + acc)
    const totalIncomes = incomeTrendsTotalValueOnly.reduce((curr, acc) => curr + acc)
    const gap = totalIncomes - totalOutcomes

    // outcome distribution
    const beginingOf6MonthsAgoJSDate = sixMonthsAgo.toJSDate()
    const outcomeDistributionFor6MonthsAggregate = await Outcome.aggregate([
        {
            $match: {
                Date: { $gte: beginingOf6MonthsAgoJSDate }
            }
        },
        {
            $group: {
                _id: "$type",
                totalValue: { $sum: "$value" }
            }
        }
    ])

    const outcomeDistribution = outcomeDistributionFor6MonthsAggregate.length > 0 ? outcomeDistributionFor6MonthsAggregate.map(val => ({ name: val._id, totalValue: val.totalValue })) : []

    const months = monthsArray.map((month) => month.toFormat('LLL'))

    const chartData = {
      outcomeTrendsTotalValueOnly,
      incomeTrendsTotalValueOnly,
      totalOutcomes,
      totalIncomes,
      gap,
      months,
      outcomeDistributionNames: outcomeDistribution.map((val) => val.name),
      outcomeDistributionValues: outcomeDistribution.map((val) => val.totalValue)
    }

    res.render('dashboard', { headTitle: 'Dashboard', chartData });
  })

module.exports = router;