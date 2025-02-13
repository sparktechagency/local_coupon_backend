import bcrypt from "bcrypt";

const plainPasswordToHash = async (password: string) => {
  return await bcrypt.hash(
    password,
    Number(process.env.BCRYPT_SALT_ROUNDS) || 10
  );
};

export default plainPasswordToHash;
