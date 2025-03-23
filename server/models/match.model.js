const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MatchSchema = new Schema(
  {
    matchId: {
      type: String,
    },
    id: {
      type: String,
    },
    date: {
      type: String,
    },
    matchType: {
      type: String,
    },
    active: {
      type: Boolean,
      default: false,
    },
    matchStarted: {
      type: Boolean,
      default: false,
    },
    history: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
    },
    t1: {
      type: String,
    },
    t2: {
      type: String,
    },
    t1s: {
      type: String,
    },
    t2s: {
      type: String,
    },
    t1img: {
      type: String,
    },
    t2img: {
      type: String,
    },
    tossWinner: {
      type: String,
    },
    matchWinner: {
      type: String,
    },
    manOfTheMatch: {
      type: String,
    },
    mostCatches: {
      type: Array,
    },
    mostRuns: {
      type: Array,
    },
    mostWickets: {
      type: Array,
    },
    mostSixes: {
      type: Array,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);
const Match = mongoose.model("match", MatchSchema);

module.exports = Match;
