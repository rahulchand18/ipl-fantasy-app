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

cron.schedule("20 13 * * *", () => {
  console.log("Match deactivate started.");
  deactivateMatch();
});

cron.schedule("15 02 * * *", () => {
  console.log("Match Activate Start");
  activateMatch();
});

const deactivateMatch = async () => {
  try {
    await Match.updateOne(
      { active: true, history: false },
      { $set: { active: false } }
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
    const { history, fullList } = req.query;
    let query = {};
    if (history) {
      query = {
        history: history === "true",
      };
    }

    let matches = [];

    if (fullList === "true" || history !== "true") {
      matches = await Match.find(query).sort({ date: 1 });
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
  const matchWinner = await PointsTable.find({ matchId }).sort({
    total: -1,
    createdAt: 1,
  });
  const totalBalance = matchWinner.length * 25;
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
      await updateBalanceByUser(player.email, 25, "deducted", matchId);
    }
  }
}

function balanceBreakdown(total) {
  const breakdowns = {
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
          manOfTheMatch:
            match.manOfTheMatch === prediction.manOfTheMatch ? 5 : 0,
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
      return res.send(true);
    }
  } catch (error) {
    return res.status(500).send(error);
  }
};

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
    const predictions = await PredictionModel.find({ matchId });
    if (predictions && predictions.length) {
      const players = [];
      for (const player of predictions) {
        const p = await User.findOne({ email: player.email });
        players.push({
          player,
          fullName: p.firstName + " " + p.lastName,
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
};

module.exports = mainController;
