import { User } from "@db";

const checkSubscriptionStatus = async (userId: string) => {
  const user = await User.findById(userId);
  if (
    user?.isSubscribed &&
    user.subscriptionExpiry &&
    new Date() > user.subscriptionExpiry
  ) {
    await User.findByIdAndUpdate(userId, {
      isSubscribed: false,
      remaining_uploads: 3,
      remaining_downloads: 20,
    });
    return false;
  }

  return true;
};

export default checkSubscriptionStatus;
