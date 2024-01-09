import express from "express";
import session from "express-session";
import bodyParser from "body-parser";
import dotenv from "dotenv";

import {
  checkAuthStatus,
  logout,
  verifyAuthentication,
  verifyRegistrationInfo,
  handleGenerateRegistrationOptions,
  handleGenerateAuthenticationOptions,
} from "./controllers/auth";

dotenv.config();

const app = express();

app.use(
  session({
    secret: "secret123",
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 10800000, // 3 hours,
      httpOnly: true,
    },
  })
);
app.use((req, res, next) => {
  const allowedOrigins = ["http://localhost:5173"];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  next();
});
app.use(bodyParser.json());

app.post("/generate-registration-options", handleGenerateRegistrationOptions);
app.post("/verify-registration", verifyRegistrationInfo);
app.get(
  "/generate-authentication-options",
  handleGenerateAuthenticationOptions
);
app.post("/verify-authentication", verifyAuthentication);
app.get("/check-auth-status", checkAuthStatus);
app.get("/logout", logout);

export const viteNodeApp = app;
