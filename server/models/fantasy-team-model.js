const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const playerSchema = new Schema({
  id: {
    type: String,
  },
  name: {
    type: String,
  },
  role: {
    type: String,
  },
  img: {
    type: String,
  },
  team: {
    type: String,
  },
  isCaptain: {
    type: Boolean,
    default: false,
  },
  isViceCaptain: {
    type: Boolean,
    default: false,
  },
  points: {
    type: Number,
    default: 0,
  },
});

const FantasyTeamSchema = new Schema(
  {
    id: {
      type: String,
    },
    matchId: {
      type: String,
    },
    date: {
      type: String,
    },
    email: {
      type: String,
    },
    players: [playerSchema],
  },
  {
    versionKey: false,
    timestamps: true,
  }
);
const FantasyTeamModel = mongoose.model("fantasy-team", FantasyTeamSchema);

module.exports = FantasyTeamModel;
