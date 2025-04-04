const axios = require("axios");

const Match = require("../models/match.model");
const Tournament = require("../models/tournament.model");
const Teams = require("../models/team.model");
const PredictionModel = require("../models/prediction.model");
const PointsTable = require("../models/points-table.model");
const User = require("../models/user");
const BalanceModel = require("../models/balance.model");
const StatementModel = require("../models/statement.model");
const cron = require("node-cron");
const notificationModel = require("../models/notification.model");
const MatchList = require("../models/matchList.model");
const Scorecard = require("../models/scorecard.model");
const FantasyTeamModel = require("../models/fantasy-team-model");
const teamsObj = {
  "Mumbai Indians": "MI",
  "Chennai Super Kings": "CSK",
  "Royal Challengers Bengaluru": "RCB",
  "Kolkata Knight Riders": "KKR",
  "Rajasthan Royals": "RR",
  "Sunrisers Hyderabad": "SRH",
  "Delhi Capitals": "DC",
  "Punjab Kings": "PBKS",
  "Lucknow Super Giants": "LSG",
  "Gujarat Titans": "GT",
};

const API_KEY1 = "b1730717-b60e-4809-a631-37143da63010";
const API_KEY2 = "203fdcb6-99e1-41e7-95da-62f38dedb565";
const API_KEY3 = "ea6a4521-2526-4eb1-ac03-b01f3bede206";
const API_KEYS = [API_KEY1, API_KEY2, API_KEY3];
cron.schedule("58 13 * * *", () => {
  console.log("Match deactivate started.");
  deactivateMatch();
});

cron.schedule("15 02 * * *", () => {
  console.log("Match Activate Start");
  activateMatch();
});

cron.schedule("15,45 10,11,12,14,15,16,17,18,19 * * *", () => {
  console.log("Match Import Start");
  importScoreCard();
});
cron.schedule("*/10 10-19 * * *", () => {
  console.log("Match Import Start");
  importFromScorecard();
});

cron.schedule("*/10 14-23 * * *", () => {
  console.log("Fantasy Points Update Start");
  updateFantasyPoints();
});

const deactivateMatch = async () => {
  try {
    await Match.updateOne(
      { active: true, history: false },
      { $set: { active: false, matchStarted: true } }
    );
    console.log("Match Deactivated");
  } catch (error) {
    console.log(error);
  }
};

const activateMatch = async () => {
  try {
    const todayDate = new Date();

    const matches = await Match.find({ history: false });
    for (const match of matches) {
      const day = new Date(match.date).getDate();
      if (day === todayDate.getDate()) {
        await Match.updateOne({ _id: match._id }, { $set: { active: true } });
        console.log(`Match: ${match.id} Activated`);
      }
    }
  } catch (error) {
    console.log(error);
  }
};

const getAllSeries = async (req, res) => {
  try {
    const { history, fullList, viewAsAdmin } = req.query;
    let query = {};
    if (history && history === "true") {
      query = {
        history: history === "true",
      };
    } else {
      query = {
        history: false,
      };
    }

    let matches = [];

    if (fullList === "true" || history !== "true") {
      if (viewAsAdmin === "true" || fullList === "true") {
        matches = await Match.find(query).sort({ date: 1 });
      } else {
        matches = await Match.find(query).sort({ date: 1 }).limit(3);
      }
    } else {
      matches = await Match.find(query).sort({ date: -1 }).limit(3);
    }
    if (matches && matches.length) {
      const data = [];
      for (const match of matches) {
        const t1 = await Teams.findOne({ shortname: match.t1 });
        const t2 = await Teams.findOne({ shortname: match.t2 });
        data.push({
          ...match._doc,
          t2img: t2.img,
          t1img: t1.img,
        });
      }
      return res.status(200).send({ data });
    } else {
      return res.status(500).send(false);
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: error.message });
  }
};

const createMatch = async (req, res) => {
  try {
    const match = await Match.create(req.body.match);
    if (match) {
      return res.status(201).send({ message: "Match Created" });
    } else {
      return res.status(405).send({ message: "Error Creating Match" });
    }
  } catch (error) {
    return res.status(500).send({ message: error.message });
  }
};

const updateMatch = async (req, res) => {
  try {
    const _id = req.params.id;
    const { updatedData } = req.body;
    const updatedResponse = await Match.findOneAndUpdate(
      { _id },
      { $set: updatedData }
    );
    if (updatedResponse) {
      return res.status(200).json({ data: updatedResponse });
    } else {
      return res.status(500).send({ message: "Update Failed" });
    }
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

const createNewTournament = async (req, res) => {
  try {
    const { tournament } = req.body;
    const existing = await Tournament.findOne({
      $or: [
        { name: tournament.name },
        { tournamentId: tournament.tournamentId },
      ],
    });
    if (existing) {
      return res.status(422).send({ message: "Already Existing" });
    }
    const createdTournament = await Tournament.create(tournament);
    if (createdTournament) {
      return res.status(201).send({ data: createdTournament });
    } else {
      return res.status(405).send({ message: "Failed" });
    }
  } catch (error) {
    return res.status(500).send({ message: error.message });
  }
};

const getAllTournaments = async (req, res) => {
  try {
    const { type, email } = req.params;
    let query;
    if (type === "myCreated") {
      query = [
        {
          $match: {
            tournamentAdmin: email,
          },
        },
      ];
    } else {
      query = [
        { $unwind: "$players" },
        {
          $match: {
            "players.email": email,
            "players.status": "accepted",
          },
        },
      ];
    }
    const allTournaments = await Tournament.aggregate(query);
    if (allTournaments && allTournaments.length) {
      return res.status(200).send({ data: allTournaments });
    } else {
      return res.status(404).send({ message: "Not Found" });
    }
  } catch (error) {
    return res.status(500).send({ message: error.message });
  }
};

const joinTournament = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { email, name } = req.body;
    const tournament = await Tournament.findOne({ tournamentId });
    if (!tournament) {
      return res.status(404).send({ message: "Tournament does not exist!" });
    }
    const tournamentJoined = await Tournament.aggregate([
      { $match: { tournamentId } },
      { $unwind: "$players" },
      { $match: { "players.email": email } },
    ]);
    if (tournamentJoined && tournamentJoined.length) {
      return res
        .status(405)
        .send({ message: "You have already joined the tournament" });
    }
    const newPlayer = { email, playerName: name };
    const updateResponse = await Tournament.updateOne(
      { tournamentId },
      { $push: { players: newPlayer } }
    );
    if (updateResponse) {
      return res.status(200).send({ message: "Request Sent to admin." });
    } else {
      return res.status({ message: "Failed" });
    }
  } catch (error) {
    return res.status(500).send({ message: error.message });
  }
};

const showAllRequests = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const requests = await Tournament.aggregate([
      {
        $match: { tournamentId },
      },
      {
        $unwind: "$players",
      },
      {
        $match: {
          status: "pending",
        },
      },
    ]);

    if (requests && requests.length) {
      return res.status(200).send({ data: requests });
    } else {
      return res.status(404).send({ message: "No Request Found!" });
    }
  } catch (error) {
    return res.status(500).send({ message: "Error in fetching requests" });
  }
};

const updateRequest = async (req, res) => {
  try {
    const { requestId, tournamentId, accept } = req.params;

    const updateResponse = await Tournament.updateOne(
      { tournamentId, "players.email": requestId },
      {
        $set: {
          "players.$.status": accept === "true" ? "accepted" : "rejected",
        },
      }
    );

    if (updateResponse) {
      return res.status(200).send({ message: "Request Accepted" });
    } else {
      return res.status(405).send({ message: "Failed" });
    }
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};
const getTournamentById = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const tournament = await Tournament.findOne({ tournamentId });
    return res.send({ data: tournament });
  } catch (error) {
    return res.status(500).send({ message: error.message });
  }
};
const getAllTeamInfo = async (req, res) => {
  try {
    const teams = await Teams.find();
    return res.send({ data: teams });
  } catch (error) {
    return res.status(500).send({ message: "false" });
  }
};

const updateActiveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;
    const updated = await Match.findOneAndUpdate(
      { _id: id },
      { $set: { active } }
    );
    return res.send(updated);
  } catch (error) {
    return res.status(500).send(error);
  }
};

const updateMatchStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;
    const updated = await Match.findOneAndUpdate(
      { _id: id },
      { $set: { matchStarted: active } }
    );
    return res.send(updated);
  } catch (error) {
    return res.status(500).send(error);
  }
};

const updateCompleteStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { history, matchId } = req.body;
    const updated = await Match.findOneAndUpdate(
      { _id: id },
      { $set: { history } }
    );
    await calculateBalance(matchId);
    return res.send(updated);
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  }
};

async function calculateBalance(matchId) {
  // const matchWinner = await PointsTable.find({ matchId }).sort({
  //   total: -1,
  //   createdAt: 1,
  // });
  const players = await FantasyTeamModel.aggregate([
    {
      $match: {
        matchId,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "email",
        foreignField: "email",
        as: "user",
      },
    },
    {
      $unwind: "$user",
    },
    {
      $unwind: "$players",
    },
    {
      $group: {
        _id: "$email",
        user: { $first: "$user" },
        date: { $first: "$createdAt" },
        players: { $push: "$players" }, // Re-group players into an array
        totalPoints: {
          $sum: {
            $cond: [
              { $eq: ["$players.isCaptain", true] },
              { $multiply: ["$players.points", 2] }, // Double captain's points
              {
                $cond: [
                  { $eq: ["$players.isViceCaptain", true] },
                  { $multiply: ["$players.points", 1.5] }, // 1.5x vice-captain's points
                  "$players.points", // Normal points for other players
                ],
              },
            ],
          },
        },
      },
    },
    {
      $addFields: {
        captain: {
          $arrayElemAt: [
            {
              $filter: {
                input: "$players",
                as: "player",
                cond: { $eq: ["$$player.isCaptain", true] },
              },
            },
            0,
          ],
        },
        viceCaptain: {
          $arrayElemAt: [
            {
              $filter: {
                input: "$players",
                as: "player",
                cond: { $eq: ["$$player.isViceCaptain", true] },
              },
            },
            0,
          ],
        },
      },
    },
    {
      $sort: {
        totalPoints: -1,
        date: 1, // Prefer the first created team if points are the same
      },
    },
  ]);
  const matchWinner = [];
  players.forEach((winner) => {
    matchWinner.push({
      email: winner._id,
    });
  });
  const totalBalance = matchWinner.length * 10;
  const { first, second, third } = balanceBreakdown(totalBalance);
  for (const player of matchWinner) {
    if (player.email === matchWinner[0].email) {
      await updateBalanceByUser(player.email, first, "added", matchId);
    } else if (player.email === matchWinner[1].email) {
      await updateBalanceByUser(
        player.email,
        second,
        Math.sign(second) === 1 ? "added" : "deducted",
        matchId
      );
    } else if (player.email === matchWinner[2].email) {
      await updateBalanceByUser(
        player.email,
        third,
        Math.sign(third) === 1 ? "added" : "deducted",
        matchId
      );
    } else {
      await updateBalanceByUser(player.email, 10, "deducted", matchId);
    }
  }
}

function balanceBreakdown(total) {
  const breakdowns = {
    30: { first: 20, second: -10, third: -10 },
    40: { first: 30, second: -10, third: -10 },
    50: { first: 30, second: 0, third: -10 },
    60: { first: 40, second: 0, third: -10 },
    70: { first: 40, second: 10, third: -10 },
    80: { first: 40, second: 10, third: 0 },
    90: { first: 50, second: 10, third: 0 },
    100: { first: 50, second: 20, third: 0 },
    110: { first: 60, second: 20, third: 0 },
    120: { first: 70, second: 20, third: 0 },
    130: { first: 70, second: 30, third: 0 },
    140: { first: 80, second: 30, third: 0 },
    150: { first: 90, second: 30, third: 0 },
    160: { first: 100, second: 30, third: 0 },
    170: { first: 110, second: 30, third: 0 },
    180: { first: 120, second: 30, third: 0 },
    190: { first: 130, second: 30, third: 0 },
    200: { first: 140, second: 30, third: 0 },
    210: { first: 150, second: 30, third: 0 },
    220: { first: 160, second: 30, third: 0 },
    230: { first: 170, second: 30, third: 0 },
    240: { first: 180, second: 30, third: 0 },
    250: { first: 190, second: 30, third: 0 },
  };

  return breakdowns[total] || {};
}

const getPrediction = async (req, res) => {
  try {
    const { matchId, email } = req.params;
    const prediction = await PredictionModel.findOne({ matchId, email });
    if (prediction) {
      return res.status(200).send({ data: prediction });
    } else {
      return res.status(404).send({ message: "Not Found" });
    }
  } catch (error) {
    return res.status(500).send(error);
  }
};

const getPlayers = async (req, res) => {
  try {
    const { matchId } = req.params;
    const match = await Match.findOne({ id: matchId });
    if (match) {
      const teams = await Teams.find({
        shortname: { $in: [match.t1, match.t2] },
      });
      return res.send({ data: teams });
    } else {
      return res.status(500).send("error");
    }
  } catch (error) {
    return res.status(500).send(error);
  }
};

const getPlayersForFantasy = async (req, res) => {
  try {
    const { matchId } = req.params;
    const match = await Match.findOne({ id: matchId });
    if (match) {
      const teams = await Teams.aggregate([
        {
          $match: {
            shortname: { $in: [match.t1, match.t2] },
          },
        },
        {
          $unwind: "$players",
        },
        {
          $addFields: {
            "players.team": "$shortname",
            "players.role": {
              $switch: {
                branches: [
                  {
                    case: {
                      $in: [
                        "$players.role",
                        ["Batting Allrounder", "Bowling Allrounder"],
                      ],
                    },
                    then: "Allrounder",
                  },
                ],
                default: "$players.role",
              },
            },
          },
        },
        {
          $group: {
            _id: "$players.role",
            players: { $push: "$players" },
          },
        },
        {
          $facet: {
            "WK-Batsman": [{ $match: { _id: "WK-Batsman" } }],
            Batsman: [{ $match: { _id: "Batsman" } }],
            Allrounder: [{ $match: { _id: "Allrounder" } }],
            Bowler: [{ $match: { _id: "Bowler" } }],
          },
        },
        {
          $project: {
            data: {
              $concatArrays: [
                "$WK-Batsman",
                "$Batsman",
                "$Allrounder",
                "$Bowler",
              ],
            },
          },
        },
        {
          $unwind: "$data",
        },
        {
          $replaceRoot: { newRoot: "$data" },
        },
      ]);
      return res.send({ data: teams });
    } else {
      return res.status(500).send("error");
    }
  } catch (error) {
    return res.status(500).send(error);
  }
};

const createPrediction = async (req, res) => {
  try {
    const { matchId, email } = req.body;
    const existingPrediction = await PredictionModel.findOne({
      matchId,
      email,
    });
    if (existingPrediction) {
      return res
        .status(409)
        .send({ message: "You have already predicted for this match" });
    } else {
      await PredictionModel.create(req.body);
      return res.status(201).send({ message: "Prediction Added" });
    }
  } catch (error) {
    return res.status(500).send(error);
  }
};

const updatePrediction = async (req, res) => {
  try {
    const { matchId, email, ...restData } = req.body;
    const isMatchActive = await Match.findOne({ id: matchId, active: true });
    if (!isMatchActive) {
      return res
        .status(403)
        .json({ message: "The match has been deactivated." });
    }
    const updateResponse = await PredictionModel.updateOne(
      { matchId, email },
      { $set: restData }
    );
    if (updateResponse) {
      const fullName = await getFullNameById(email);
      await notificationModel.create({
        receiverId: "admin@gmail.com",
        message: `${fullName} updated the match prediction for ${matchId}`,
        sentDate: new Date(),
      });
      return res.status(200).send({ message: "Updated" });
    } else {
      return res.status(409).send(false);
    }
  } catch (error) {
    return res.status(500).send(error);
  }
};

const calculatePoints = async (req, res) => {
  try {
    const { matchId } = req.params;
    await calculateAndStore(matchId);
    await updateFantasyPoints();
    return res.send(true);
  } catch (error) {
    return res.status(500).send(error);
  }
};

async function calculateAndStore(matchId) {
  let predictions = await PredictionModel.find({ matchId });
  const match = await Match.findOne({ id: matchId });
  if (predictions && predictions.length) {
    for (const prediction of predictions) {
      const existingCalculation = await PointsTable.findOne({
        matchId,
        email: prediction.email,
      });
      const tableDocument = {
        matchId,
        date: match.date,
        email: prediction.email,
        tossWinner: match.tossWinner === prediction.tossWinner ? 1 : 0,
        matchWinner: match.matchWinner === prediction.matchWinner ? 5 : 0,
        manOfTheMatch: match.manOfTheMatch === prediction.manOfTheMatch ? 5 : 0,
        mostCatches: match.mostCatches?.includes(prediction.mostCatches)
          ? 2
          : 0,
        mostRuns: match.mostRuns?.includes(prediction.mostRuns) ? 2 : 0,
        mostWickets: match.mostWickets?.includes(prediction.mostWickets)
          ? 2
          : 0,
        mostSixes: match.mostSixes?.includes(prediction.mostSixes) ? 3 : 0,
      };
      tableDocument.total =
        tableDocument.manOfTheMatch +
        tableDocument.matchWinner +
        tableDocument.mostCatches +
        tableDocument.mostRuns +
        tableDocument.mostSixes +
        tableDocument.mostWickets +
        tableDocument.tossWinner;
      if (!existingCalculation) {
        await PointsTable.create(tableDocument);
      } else {
        await PointsTable.updateOne(
          { matchId, email: prediction.email },
          { $set: tableDocument }
        );
      }
    }
  }
}

const getPointsTable = async (req, res) => {
  try {
    const { matchId } = req.params;
    const points = await PointsTable.find({ matchId }).sort({
      total: -1,
      createdAt: 1,
    });
    if (points && points.length) {
      const players = [];
      for (const player of points) {
        const p = await User.findOne({ email: player.email });
        const balance = await StatementModel.findOne({
          email: player.email,
          remarks: matchId,
        });
        players.push({
          player,
          fullName: p.firstName + " " + p.lastName,
          img: p.img,
          balance: {
            amount: balance ? balance.balance : 0,
            action: balance ? balance.action : null,
          },
        });
      }
      return res.status(200).send({ data: players });
    } else {
      return res.status(404).send("No predictions found for this match");
    }
  } catch (error) {
    return res.status(500).send(error);
  }
};

const getAllPredictions = async (req, res) => {
  try {
    const { matchId } = req.params;

    // Fetch the actual match results from the database
    const actualMatch = await Match.findOne({ id: matchId });
    if (!actualMatch) {
      return res.status(404).send({ message: "Match results not found" });
    }

    // Aggregate query to fetch predictions with user details
    const predictions = await PredictionModel.aggregate([
      { $match: { matchId } },
      {
        $lookup: {
          from: "users",
          localField: "email",
          foreignField: "email",
          as: "userInfo",
        },
      },
      {
        $unwind: { path: "$userInfo", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          _id: 1,
          email: 1,
          matchId: 1,
          tossWinner: 1,
          matchWinner: 1,
          manOfTheMatch: 1,
          mostCatches: 1,
          mostRuns: 1,
          mostWickets: 1,
          mostSixes: 1,
          fullName: {
            $concat: [
              { $ifNull: ["$userInfo.firstName", "Unknown"] },
              " ",
              { $ifNull: ["$userInfo.lastName", ""] },
            ],
          },
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);

    // Map through predictions and add boolean flags
    const updatedPredictions = predictions.map((pred) => ({
      ...pred,
      isTossWinnerCorrect: pred.tossWinner === actualMatch.tossWinner,
      isMatchWinnerCorrect: pred.matchWinner === actualMatch.matchWinner,
      isManOfTheMatchCorrect: pred.manOfTheMatch === actualMatch.manOfTheMatch,
      isMostCatchesCorrect: actualMatch.mostCatches.includes(pred.mostCatches),
      isMostRunsCorrect: actualMatch.mostRuns.includes(pred.mostRuns),
      isMostWicketsCorrect: actualMatch.mostWickets.includes(pred.mostWickets),
      isMostSixesCorrect: actualMatch.mostSixes.includes(pred.mostSixes),
    }));

    if (!updatedPredictions.length) {
      return res
        .status(404)
        .send({ message: "No predictions found for this match" });
    }

    return res.status(200).json({ data: updatedPredictions });
  } catch (error) {
    console.error("Error fetching predictions:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const getBalanceById = async (req, res) => {
  try {
    const { email } = req.params;
    const balance = await BalanceModel.findOne({ email });
    const statements = await StatementModel.aggregate([
      {
        $match: { email },
      },
      {
        $sort: { date: -1 },
      },
    ]);
    const data = {
      balance: balance?.balance ?? 0,
      statements,
    };
    return res.status(200).send({ data });
  } catch (error) {
    return res.status(500).send(error);
  }
};

async function updateBalanceByUser(email, balance, action, remarks) {
  console.log(email, balance, action, remarks);
  if (balance) {
    balance = Math.abs(balance);
    let updateQuery = {};
    if (action === "added") {
      updateQuery = { $inc: { balance: balance } };
    } else {
      updateQuery = { $inc: { balance: -balance } };
    }
    await StatementModel.create({
      email,
      balance,
      action,
      remarks,
      date: new Date(),
    });
    const existingBalance = await BalanceModel.findOne({ email });
    if (existingBalance) {
      return await BalanceModel.updateOne({ email }, updateQuery);
    } else {
      return await BalanceModel.create({
        email,
        balance,
      });
    }
  }
}

const addDeductBalance = async (req, res) => {
  try {
    const { email, balance, action, remarks } = req.body;
    const updateResponse = await updateBalanceByUser(
      email,
      balance,
      action,
      remarks
    );

    if (updateResponse) {
      return res.status(200).send({ message: "Done" });
    } else {
      return res.status(409).json({ message: "Something went wrong" });
    }
  } catch (error) {
    return res.status(500).send(error);
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    const data = [];
    for (const user of users) {
      let balance = await BalanceModel.findOne({ email: user.email });

      data.push({
        fullName: user.firstName + "  " + user.lastName,
        balance: balance ? balance.balance : 0,
        email: user.email,
      });
    }
    return res.status(200).send({ data });
  } catch (error) {
    return res.status(500).send(error);
  }
};

const getSeasonPointsTable = async (req, res) => {
  try {
    const table = await PointsTable.aggregate([
      {
        $group: {
          _id: "$email",
          total: { $sum: "$total" },
          matches: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "email",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          _id: 1,
          total: 1,
          firstName: "$user.firstName",
          lastName: "$user.lastName",
          img: "$user.img",
          matches: 1,
        },
      },
      {
        $sort: {
          total: -1,
        },
      },
    ]);
    return res.status(200).send({ data: table });
  } catch (error) {
    return res.status(500).send(error);
  }
};

const getMatchByMatchId = async (req, res) => {
  try {
    const { matchId } = req.params;
    const match = await Match.findOne({ id: matchId });
    return res.status(200).send({ data: match });
  } catch (error) {
    return res.status(500).send(error);
  }
};

const uploadPhoto = async (req, res) => {
  try {
    const file = req.file;
    const { email } = req.params;
    if (!file) {
      return res
        .status(400)
        .send({ success: false, message: "User Image is required" });
    }
    const fileName = file.filename;
    const fileOriginalName = file.originalname;
    const uploadResponse = await User.updateOne(
      { email },
      { $set: { img: `users/${fileName}` } }
    );
    if (uploadResponse) {
      return res
        .status(200)
        .send({ success: true, message: "Image uploaded successfully" });
    } else {
      return res
        .status(400)
        .send({ success: false, message: "Image upload failed" });
    }
  } catch (error) {
    return res.status(500).send(error);
  }
};

const getSummary = async (req, res) => {
  try {
    const users = await PredictionModel.aggregate([
      {
        $group: {
          _id: "$email",
          matches: { $push: "$$ROOT" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "email",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          _id: 1,
          matches: 1,
          firstName: "$user.firstName",
          lastName: "$user.lastName",
        },
      },
      {
        $addFields: {
          matches_count: { $size: "$matches" },
        },
      },
      {
        $sort: { matches_count: -1 },
      },
    ]);
    if (users && users.length) {
      for (const user of users) {
        let finalDocument = {
          tossWinner: 0,
          matchWinner: 0,
          manOfTheMatch: 0,
          mostRuns: 0,
          mostWickets: 0,
          mostCatches: 0,
          mostSixes: 0,
        };
        for (const prediction of user.matches) {
          const match = await Match.findOne({ id: prediction.matchId });
          finalDocument.tossWinner +=
            match.tossWinner === prediction.tossWinner ? 1 : 0;
          finalDocument.matchWinner +=
            match.matchWinner === prediction.matchWinner ? 1 : 0;
          finalDocument.manOfTheMatch +=
            match.manOfTheMatch === prediction.manOfTheMatch ? 1 : 0;
          finalDocument.mostCatches += match.mostCatches?.includes(
            prediction.mostCatches
          )
            ? 1
            : 0;
          finalDocument.mostRuns += match.mostRuns?.includes(
            prediction.mostRuns
          )
            ? 1
            : 0;
          finalDocument.mostWickets += match.mostWickets?.includes(
            prediction.mostWickets
          )
            ? 1
            : 0;
          finalDocument.mostSixes += match.mostSixes?.includes(
            prediction.mostSixes
          )
            ? 1
            : 0;
        }
        user["summary"] = finalDocument;
      }
    }

    return res.send({ data: users });
  } catch (error) {
    return res.status(500).send(error);
  }
};

const getNotifications = async (req, res) => {
  try {
    const { email } = req.params;
    const notifications = await notificationModel
      .find({ $or: [{ receiverId: email }, { receiverId: "everyone" }] })
      .sort({ sentDate: -1 })
      .limit(10);
    return res.status(200).send({ data: notifications });
  } catch (error) {
    return res.status(500).send(error);
  }
};

const getFullNameById = async (email) => {
  const user = await User.findOne({ email });
  return user?.firstName + " " + user?.lastName;
};

const importMatch = async () => {
  try {
    const allMatches = await MatchList.find();
    for (const match of allMatches) {
      const team1 = match.teams[0];
      const team2 = match.teams[1];
      const matchData = {
        matchId: match.id,
        date: match.dateTimeGMT,
        status: match.status,
        t1: teamsObj[team1],
        t2: teamsObj[team2],
      };
      matchData.id = `${matchData.t1}vs${matchData.t2}`;

      const existingMatch = await Match.findOne({ matchId: match.id });
      if (team1 && team2) {
        if (!existingMatch) {
          await Match.create(matchData);
        } else {
          await Match.updateOne({ matchId: match.id }, { $set: matchData });
        }
      }
    }
    console.log("Completed");
  } catch (error) {
    console.log(error);
  }
};

function removeLastTwoWords(text) {
  if (!text) return "";
  let words = text.split(" "); // Split the string into an array of words
  if (words.length > 2) {
    words.length -= 2; // Remove the last two words
  }
  return words.join(" "); // Join the remaining words back into a string
}

const importScoreCard = async () => {
  try {
    const activeMatches = await Match.find({
      history: false,
      matchStarted: true,
    });
    for (const match of activeMatches) {
      const randomAPIKey = API_KEYS[Math.floor(Math.random() * 3)];
      console.log(match.id);
      const url = `https://api.cricapi.com/v1/match_scorecard?apikey=${randomAPIKey}&id=${match.matchId}`;
      const response = await axios.get(url);
      const matchResponse = response.data?.data;
      const battingFirst = removeLastTwoWords(matchResponse?.score[0]?.inning);
      const battingSecond = removeLastTwoWords(matchResponse?.score[1]?.inning);
      const matchData = {
        id: matchResponse.id,
        status: matchResponse.status,
        t1: matchResponse.teams[0],
        t2: matchResponse.teams[1],
        t1s: "",
        t2s: "",
        tossWinner: teamsObj[matchResponse.tossWinner],
        matchWinner: teamsObj[matchResponse.matchWinner],
        matchStarted: matchResponse.matchStarted,
        matchEnded: matchResponse.matchEnded,
      };
      if (battingFirst === matchData.t1) {
        matchData.t1s = `${matchResponse.score[0]?.r}/${
          matchResponse.score[0]?.w
        } (${matchResponse.score[0]?.o ?? 0.0})`;

        matchData.t2s = `${matchResponse.score[1]?.r ?? 0}/${
          matchResponse.score[1]?.w ?? 0
        } (${matchResponse.score[1]?.o ?? 0.0})`;
      }
      if (battingSecond === matchData.t1) {
        matchData.t2s = `${matchResponse.score[0]?.r}/${
          matchResponse.score[0]?.w
        } (${matchResponse.score[0]?.o ?? 0.0})`;

        matchData.t1s = `${matchResponse.score[1]?.r ?? 0}/${
          matchResponse.score[1]?.w ?? 0
        } (${matchResponse.score[1]?.o ?? 0.0})`;
      }
      console.log(995, matchResponse);
      const players = [];

      for (const inning of matchResponse.scorecard) {
        for (const player of inning.batting) {
          const playerData = {
            name: player.batsman.name,
            id: player.batsman.id,
            runs: player.r,
            balls: player.b,
            sixes: player["6s"],
            fours: player["4s"],
            strikeRate: player.sr,
          };
          players.push(playerData);
        }
        for (const player of inning.bowling) {
          const playerData = {
            name: player.bowler.name,
            id: player.bowler.id,
            overs: player.o,
            maidens: player.m,
            wickets: player.w,
            economyRate: player.eco,
          };
          players.push(playerData);
        }
        for (const player of inning.catching) {
          const playerData = {
            name: player.catcher.name,
            id: player.catcher.id,
            catch: player.catch,
            runout: player.runout,
            stumping: player.stumped,
          };
          players.push(playerData);
        }
      }

      const mergedPlayers = mergeObjectsByName(players);

      matchData.players = mergedPlayers;

      const existing = await Scorecard.findOne({ id: matchData.id });
      if (!existing) {
        const a = await Scorecard.create(matchData);
        console.log(a);
      } else {
        await Scorecard.updateOne({ id: existing.id }, { $set: matchData });
      }
    }
  } catch (error) {
    console.log(error.stack);
  }
};

function mergeObjectsByName(arr) {
  return Object.values(
    arr.reduce((acc, obj) => {
      if (!acc[obj.name]) {
        acc[obj.name] = { ...obj };
      } else {
        Object.assign(acc[obj.name], obj);
      }
      return acc;
    }, {})
  );
}

const importFromScorecard = async () => {
  try {
    const activeMatches = await Match.find({
      history: false,
      matchStarted: true,
    });
    for (const match of activeMatches) {
      const summary = await Scorecard.aggregate([
        { $match: { id: match.matchId } },
        {
          $facet: {
            // Get match info
            matchInfo: [
              {
                $project: {
                  t1: 1,
                  t2: 1,
                  t1s: 1,
                  t2s: 1,
                  status: 1,
                  tossWinner: 1,
                  matchWinner: 1,
                  matchStarted: 1,
                  matchEnded: 1,
                },
              },
            ],
            // Top Run Scorers
            topRuns: [
              { $unwind: "$players" },
              { $match: { "players.runs": { $exists: true, $gt: 0 } } },
              { $sort: { "players.runs": -1 } },
              {
                $group: {
                  _id: null,
                  maxRuns: { $max: "$players.runs" },
                  players: {
                    $push: { name: "$players.name", runs: "$players.runs" },
                  },
                },
              },
              {
                $project: {
                  topScorers: {
                    $map: {
                      input: {
                        $filter: {
                          input: "$players",
                          as: "player",
                          cond: { $eq: ["$$player.runs", "$maxRuns"] },
                        },
                      },
                      as: "p",
                      in: "$$p.name",
                    },
                  },
                },
              },
            ],
            // Top Wicket Takers
            topWickets: [
              { $unwind: "$players" },
              { $match: { "players.wickets": { $exists: true, $gt: 0 } } },
              { $sort: { "players.wickets": -1 } },
              {
                $group: {
                  _id: null,
                  maxWickets: { $max: "$players.wickets" },
                  players: {
                    $push: {
                      name: "$players.name",
                      wickets: "$players.wickets",
                    },
                  },
                },
              },
              {
                $project: {
                  topBowlers: {
                    $map: {
                      input: {
                        $filter: {
                          input: "$players",
                          as: "player",
                          cond: { $eq: ["$$player.wickets", "$maxWickets"] },
                        },
                      },
                      as: "p",
                      in: "$$p.name",
                    },
                  },
                },
              },
            ],
            // Top Catchers
            topCatches: [
              { $unwind: "$players" },
              { $match: { "players.catch": { $exists: true, $gt: 0 } } },
              { $sort: { "players.catch": -1 } },
              {
                $group: {
                  _id: null,
                  maxCatches: { $max: "$players.catch" },
                  players: {
                    $push: { name: "$players.name", catches: "$players.catch" },
                  },
                },
              },
              {
                $project: {
                  topFielders: {
                    $map: {
                      input: {
                        $filter: {
                          input: "$players",
                          as: "player",
                          cond: { $eq: ["$$player.catches", "$maxCatches"] },
                        },
                      },
                      as: "p",
                      in: "$$p.name",
                    },
                  },
                },
              },
            ],
            // Top Six Hitters
            topSixes: [
              { $unwind: "$players" },
              { $match: { "players.sixes": { $exists: true, $gt: 0 } } },
              { $sort: { "players.sixes": -1 } },
              {
                $group: {
                  _id: null,
                  maxSixes: { $max: "$players.sixes" },
                  players: {
                    $push: { name: "$players.name", sixes: "$players.sixes" },
                  },
                },
              },
              {
                $project: {
                  topHitters: {
                    $map: {
                      input: {
                        $filter: {
                          input: "$players",
                          as: "player",
                          cond: { $eq: ["$$player.sixes", "$maxSixes"] },
                        },
                      },
                      as: "p",
                      in: "$$p.name",
                    },
                  },
                },
              },
            ],
          },
        },
        {
          $project: {
            matchInfo: { $arrayElemAt: ["$matchInfo", 0] },
            mostRuns: { $arrayElemAt: ["$topRuns.topScorers", 0] },
            mostWickets: { $arrayElemAt: ["$topWickets.topBowlers", 0] },
            mostCatches: { $arrayElemAt: ["$topCatches.topFielders", 0] },
            mostSixes: { $arrayElemAt: ["$topSixes.topHitters", 0] },
          },
        },
        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: [
                "$matchInfo",
                {
                  mostRuns: "$mostRuns",
                  mostWickets: "$mostWickets",
                  mostCatches: "$mostCatches",
                  mostSixes: "$mostSixes",
                },
              ],
            },
          },
        },
      ]);

      console.log(111, summary);

      if (summary && summary.length) {
        await Match.updateOne(
          { matchId: match.matchId },
          {
            $set: {
              mostRuns: summary[0].mostRuns,
              mostWickets: summary[0].mostWickets,
              mostCatches: summary[0].mostCatches,
              mostSixes: summary[0].mostSixes,
              t1s: summary[0].t1s,
              t2s: summary[0].t2s,
              status: summary[0].status,
              matchStarted: summary[0].matchStarted,
              matchEnded: summary[0].matchEnded,
              tossWinner: summary[0].tossWinner,
              matchWinner: summary[0].matchWinner,
            },
          }
        );

        calculateAndStore(match.id);
      }
    }
  } catch (error) {
    console.log(error);
  }
};

const addNewFantasyTeam = async (req, res) => {
  try {
    const predictionData = req.body;
    const { matchId, email } = predictionData;
    const match = await Match.findOne({ id: matchId });
    if (!match.active) {
      return res.status(400).json({ message: "Match is not active" });
    }
    const existingPrediction = await FantasyTeamModel.findOne({
      matchId,
      email,
    });
    if (existingPrediction) {
      return await updateFantasyTeam(req, res);
    } else {
      const { players } = predictionData;

      predictionData.id = match?.matchId;

      const { allow, message } = checkTeam(players);

      if (allow) {
        await FantasyTeamModel.create(predictionData);
        return res.status(200).send({ message: "Team Created Successfully" });
      } else {
        return res.status(400).json({
          message: message.join(","),
        });
      }
    }
  } catch (error) {
    console.log(error.stack);
    return res.status(500).send({ message: error.message });
  }
};

const updateFantasyTeam = async (req, res) => {
  try {
    const predictionData = req.body;
    const { matchId, email } = predictionData;
    const existingPrediction = await FantasyTeamModel.findOne({
      matchId,
      email,
    });
    if (existingPrediction) {
      const { players } = predictionData;
      const { allow, message } = checkTeam(players);
      if (allow) {
        await FantasyTeamModel.updateOne({ matchId, email }, predictionData);
        return res.status(200).send({ message: "Team Updated Successfully" });
      } else {
        return res.status(400).json({
          message: message.join(","),
        });
      }
    } else {
      return res.status(400).json({
        message: "You have not made a prediction for this match",
      });
    }
  } catch (error) {
    console.log(error.stack);
    return res.status(500).send({ message: error.message });
  }
};

const getOnePrediction = async (req, res) => {
  try {
    const { matchId, email } = req.query;
    const predictions = await FantasyTeamModel.findOne({ matchId, email });
    if (predictions) {
      return res.status(200).send({ data: predictions });
    } else {
      return res.status(400).json({
        message: "No predictions found for this match",
      });
    }
  } catch (error) {
    console.log(error.stack);
    return res.status(500).send({ message: error.message });
  }
};
const getAllPredictionsByMatch = async (req, res) => {
  try {
    const { matchId } = req.query;
    const predictions = await FantasyTeamModel.aggregate([
      {
        $match: {
          matchId,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "email",
          foreignField: "email",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $lookup: {
          from: "statements", // Assuming this is the collection with balance data
          let: { email: "$user.email", matchId: "$matchId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$email", "$$email"] },
                    { $eq: ["$remarks", "$$matchId"] },
                  ],
                },
              },
            },
            {
              $project: {
                balance: 1, // Fetch only the balance field
                action: 1, // Fetch only the balance field
                _id: 0,
              },
            },
          ],
          as: "balanceData",
        },
      },
      {
        $addFields: {
          balance: {
            $ifNull: [{ $arrayElemAt: ["$balanceData.balance", 0] }, 0],
          },
        },
      },
      {
        $addFields: {
          action: {
            $ifNull: [{ $arrayElemAt: ["$balanceData.action", 0] }, ""],
          },
        },
      },
      {
        $unwind: "$players",
      },
      {
        $group: {
          _id: "$email",
          user: { $first: "$user" },
          date: { $first: "$createdAt" },
          balance: { $first: "$balance" },
          action: { $first: "$action" },
          players: { $push: "$players" }, // Re-group players into an array
          totalPoints: {
            $sum: {
              $cond: [
                { $eq: ["$players.isCaptain", true] },
                { $multiply: ["$players.points", 2] }, // Double captain's points
                {
                  $cond: [
                    { $eq: ["$players.isViceCaptain", true] },
                    { $multiply: ["$players.points", 1.5] }, // 1.5x vice-captain's points
                    "$players.points", // Normal points for other players
                  ],
                },
              ],
            },
          },
        },
      },
      {
        $addFields: {
          captain: {
            $arrayElemAt: [
              {
                $filter: {
                  input: "$players",
                  as: "player",
                  cond: { $eq: ["$$player.isCaptain", true] },
                },
              },
              0,
            ],
          },
          viceCaptain: {
            $arrayElemAt: [
              {
                $filter: {
                  input: "$players",
                  as: "player",
                  cond: { $eq: ["$$player.isViceCaptain", true] },
                },
              },
              0,
            ],
          },
        },
      },
      {
        $sort: {
          totalPoints: -1,
          date: 1, // Prefer the first created team if points are the same
        },
      },
    ]);

    console.log(predictions);

    if (predictions && predictions.length) {
      return res.status(200).send({ data: predictions });
    } else {
      return res.status(400).json({
        message: "No predictions found for this match",
      });
    }
  } catch (error) {
    console.log(error.stack);
    return res.status(500).send({ message: error.message });
  }
};

function checkTeam(players) {
  let allow = true;
  const message = [];
  if (players.length !== 11) {
    allow = false;
    message.push("Players should be 11");
  }
  let bowlerCount = 0;
  let batsmanCount = 0;
  let wicketKeeperCount = 0;
  players.forEach((player) => {
    if (player.role === "Batsman") {
      batsmanCount++;
    }
    if (player.role === "Bowler") {
      bowlerCount++;
    }
    if (player.role === "WK-Batsman") {
      wicketKeeperCount++;
    }
  });
  if (batsmanCount < 2) {
    allow = false;
    message.push("Select at least 2 batsman");
  }
  if (bowlerCount < 2) {
    allow = false;
    message.push("Select at least 2 bowler");
  }
  if (wicketKeeperCount < 1) {
    allow = false;
    message.push("Select at least 1 wicket keeper");
  }

  return allow ? { allow } : { allow, message };
}

const updateFantasyPoints = async () => {
  const activeMatches = await Match.find({
    history: false,
    matchStarted: true,
  });
  for (const match of activeMatches) {
    const scoreCard = await Scorecard.findOne({ id: match.matchId });

    console.log(scoreCard);
    if (scoreCard) {
      const playersWithPoints = getPlayersPoints(scoreCard.players, match);
      console.log(playersWithPoints);
      for (const player of playersWithPoints) {
        await FantasyTeamModel.updateMany(
          {
            matchId: match.id,
            "players.id": player.id,
          },
          {
            $set: {
              "players.$.points": player.points,
            },
          }
        );
        console.log(`Done for ${player.name}`);
      }
    }
  }
};

const getPlayersPoints = (players, match) => {
  const playerWithPoints = [];
  players.forEach((player) => {
    let points = 0;

    // Batting Points
    if (player.runs) {
      points += player.runs; // 1 point per run
      if (player.runs >= 50) points += 10; // 50-run bonus
      if (player.runs >= 100) points += 25; // 100-run bonus
    }
    if (player.runs === 0) {
      if (player.balls === 1) {
        points -= 4;
      } else {
        points -= 2; // Duck penalty
      }
    }
    if (player.fours) points += player.fours * 2; // 1 point per boundary
    if (player.sixes) points += player.sixes * 4; // 2 points per six

    // Bowling Points
    if (player.wickets) {
      points += player.wickets * 25; // 25 points per wicket
      if (player.wickets >= 3) points += 10; // 3-wicket bonus
      if (player.wickets >= 5) points += 25; // 5-wicket bonus
    } else {
      points -= 2; // No wicket penalty
    }

    // Economy Rate Points
    if (player.overs && player.economyRate !== undefined) {
      if (player.economyRate <= 6) {
        points += 4;
      } else if (player.economyRate <= 8.5) {
        points += 2;
      } else if (player.economyRate > 9) {
        points -= 2;
      }
    }

    if (player.maidens) points += player.maidens * 8; // 8 points per maiden

    // Fielding Points
    if (player.catch) points += player.catch * 8; // 8 points per catch
    if (player.runout) points += player.runout * 12; // 12 points per runout
    if (player.stumping) points += player.stumping * 12; // 12 points per stumping
    if (player.name === match.manOfTheMatch) points += 25; // 25 points per manOfTheMatch

    playerWithPoints.push({
      name: player.name,
      points,
      id: player.id,
    });
  });
  return playerWithPoints;
};

const mainController = {
  getAllSeries,
  createMatch,
  updateMatch,
  createNewTournament,
  getAllTournaments,
  joinTournament,
  showAllRequests,
  updateRequest,
  getTournamentById,
  getAllTeamInfo,
  updateActiveStatus,
  updateMatchStatus,
  getPrediction,
  getPlayers,
  createPrediction,
  updatePrediction,
  calculatePoints,
  getPointsTable,
  getAllPredictions,
  updateCompleteStatus,
  getBalanceById,
  addDeductBalance,
  getAllUsers,
  getSeasonPointsTable,
  getMatchByMatchId,
  uploadPhoto,
  getSummary,
  getNotifications,
  addNewFantasyTeam,
  getPlayersForFantasy,
  getOnePrediction,
  getAllPredictionsByMatch,
  updateFantasyPoints,
};

module.exports = mainController;
