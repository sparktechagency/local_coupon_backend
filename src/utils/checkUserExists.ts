import { User } from "@db";

const checkUserExists = async (field: "email" | "phone", value: string) => {
  const user = await User.findOne({ [field]: value });
  if (user && !user.isDeleted) {
    return `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  }
  return null;
};

export default checkUserExists;
