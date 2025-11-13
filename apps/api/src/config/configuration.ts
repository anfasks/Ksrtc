export default () => ({
  app: {
    port: parseInt(process.env.PORT ?? '3000', 10),
    otpExpirySeconds: parseInt(process.env.OTP_EXPIRY_SECONDS ?? '300', 10),
    jwtSecret: process.env.JWT_SECRET ?? 'dev-secret',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  },
});
