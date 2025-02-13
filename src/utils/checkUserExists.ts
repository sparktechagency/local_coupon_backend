import { User } from "src/db";

const checkUserExists = async (field: "email" | "phone", value: string) => {
  const user = await User.findOne({ [field]: value });
  if (user) {
    return `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  }
  return null;
};

export default checkUserExists;
