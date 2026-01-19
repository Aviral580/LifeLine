import mongoose from "mongoose";

const querySchema = new mongoose.Schema({
  phrase: { type: String, required: true, unique: true },
  frequency: { type: Number, default: 1 },
  lastSearched: { type: Date, default: Date.now },
});

export default mongoose.model("Query", querySchema);
