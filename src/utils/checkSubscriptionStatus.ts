import { User } from "src/db";

const checkSubscriptionStatus = async (userId: string) => {
  const user = await User.findById(userId);
  if (
    user?.isSubscribed &&
    user.subscriptionExpiry &&
    new Date() > user.subscriptionExpiry
  ) {
    await User.findByIdAndUpdate(userId, { isSubscribed: false });
    return false;
  }

  return true;
};

export default checkSubscriptionStatus;
