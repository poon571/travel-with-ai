import { jwtVerify, SignJWT } from "jose";

const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET_KEY || "super-secret-key-123456789-travel-with-ai";
  return new TextEncoder().encode(secret);
};

export async function verifyAuth(token) {
  try {
    const verified = await jwtVerify(token, getJwtSecretKey());
    return verified.payload;
  } catch (err) {
    return null;
  }
}

export async function createAuthToken(user) {
  const token = await new SignJWT({ id: user.id, username: user.username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d") // อยู่ในระบบได้ 7 วัน
    .sign(getJwtSecretKey());
  return token;
}
