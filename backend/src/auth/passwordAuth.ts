import bcrypt from 'bcryptjs';

export const PasswordAuth = {
  // Hash password using salted bcrypt rounds
  async hash(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  },

  // Verify plaintext password against stored bcrypt hash
  async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
};
