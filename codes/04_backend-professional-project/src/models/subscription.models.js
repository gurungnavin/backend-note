import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId, // subscriber(The users) who subscribe your the channel
      ref: "User",
    },
    channel: {
      type: Schema.Types.ObjectId, // the channel you subscribed, bcoz you are also user
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
