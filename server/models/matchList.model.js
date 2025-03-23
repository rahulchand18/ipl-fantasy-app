const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MatchListSchema = new Schema(
  {
    id: {
      type: String,
    },
    name: {
      type: String,
    },
    matchType: {
      type: String,
    },
    status: {
      type: String,
    },
    venue: {
      type: String,
    },
    date: {
      type: String,
    },
    dateTimeGMT: {
      type: String,
    },
    teams: {
      type: Array,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);
const MatchList = mongoose.model("match-list", MatchListSchema);

module.exports = MatchList;
