const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const playerSchema = {
  name: {
    type: String,
  },
  runs: {
    type: Number,
  },
  balls: {
    type: Number,
  },
  sixes: {
    type: Number,
  },
  fours: {
    type: Number,
  },
  strikeRate: {
    type: Number,
  },
  overs: {
    type: Number,
  },
  maidens: {
    type: Number,
  },
  wickets: {
    type: Number,
  },
  catch: {
    type: Number,
  },
};
const ScorecardSchema = new Schema(
  {
    id: {
      type: String,
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
    tossWinner: {
      type: String,
    },
    matchWinner: {
      type: String,
    },
    matchStarted: {
      type: Boolean,
    },
    matchEnded: {
      type: Boolean,
    },
    players: [playerSchema],
  },
  {
    versionKey: false,
    timestamps: true,
  }
);
const Scorecard = mongoose.model("scorecard", ScorecardSchema);

module.exports = Scorecard;
