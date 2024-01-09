import {
  verifyAuthenticationResponse,
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
} from "@simplewebauthn/server";
import { MOCK_DATABASE } from "../database";
// eslint-disable-next-line
import { isoBase64URL, isoUint8Array } from "@simplewebauthn/server/helpers";

const RP_NAME = process.env.RP_NAME;
const RP_ID = process.env.RP_ID;
const EXPECTED_ORIGIN = process.env.EXPECTED_ORIGIN;

export async function checkAuthStatus(req, res) {
  const { authenticated, userName } = req.session;
  res.send({
    authenticated: !!authenticated,
    userName,
  });
}

export async function verifyAuthentication(req, res) {
  // NOTE: if we do not have a userId in the session, we can
  // perform a lookup by credential ID supporting a usernameless/passwordless flow
  const { body } = req;
  let verification;
  const { userId } = req.session;
  let user = MOCK_DATABASE[userId];
  // NOTE: in a production environment instead of doing this iterative search
  // we can use a database query by credential ID
  let dbAuthenticator;

  if (user) {
    const devices = user.devices;
    const bodyCredIDBuffer = isoBase64URL.toBuffer(body.rawId);
    for (const device of devices) {
      if (isoUint8Array.areEqual(device.credentialID, bodyCredIDBuffer)) {
        dbAuthenticator = device;
        break;
      }
    }
  } else {
    const allDevices = [];
    Object.values(MOCK_DATABASE).forEach((user) => {
      return user.devices.forEach((device) =>
        allDevices.push([device, user.id])
      );
    });
    const bodyCredIDBuffer = isoBase64URL.toBuffer(body.rawId);
    for (const [device, id] of allDevices) {
      if (isoUint8Array.areEqual(device.credentialID, bodyCredIDBuffer)) {
        dbAuthenticator = device;
        user = MOCK_DATABASE[id];
        break;
      }
    }
  }
  if (!dbAuthenticator) {
    clearSession(req);
    return res.status(400).send({
      error: "Authenticator is not registered with this site",
    });
  }
  try {
    verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: req.session.currentChallenge,
      expectedOrigin: EXPECTED_ORIGIN,
      expectedRPID: RP_ID,
      authenticator: dbAuthenticator,
      requireUserVerification: true,
    });
  } catch (error) {
    console.error(error);
    clearSession(req);
    return res.status(400).send({ error: error.message });
  }
  const { verified, authenticationInfo } = verification;

  dbAuthenticator.counter = authenticationInfo.newCounter;
  req.session.currentChallenge = undefined;
  req.session.userId = user.id;
  req.session.userName = user.userName;
  req.session.authenticated = true;
  console.log(`User ${user.id} has successfully authenticated`);
  res.send({ verified, userName: user.userName, authenticated: true });
}

export async function handleGenerateAuthenticationOptions(req, res) {
  const userId = req.session?.userId;
  const allowCredentials = [];
  if (userId) {
    const user = MOCK_DATABASE[userId];
    if (user) {
      user.devices.forEach((dev) => {
        allowCredentials.push({
          id: dev.credentialID,
          type: "public-key",
          transports: dev.transports,
        });
      });
    }
  }
  const opts = {
    timeout: 60000,
    allowCredentials,
    userVerification: "required",
    rpID: RP_ID,
  };
  const options = await generateAuthenticationOptions(opts);
  req.session.currentChallenge = options.challenge;
  req.session.userId = userId;
  res.send(options);
}

export async function handleGenerateRegistrationOptions(req, res) {
  const { userName } = req.body;
  const newUserAccount = {
    id: Math.random().toString(36).substring(2, 15),
    userName,
    seedIndex: 0,
    devices: [],
    meta: {
      createdAt: Date.now(),
    },
  };
  MOCK_DATABASE[newUserAccount.id] = newUserAccount;
  const { id } = newUserAccount;
  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userID: id,
    userName,
    attestationType: "none",
    excludeCredentials: [],
    authenticatorSelection: {
      residentKey: "discouraged",
    },
  });
  req.session.userId = id;
  req.session.currentChallenge = options.challenge;
  res.json(options);
}

export async function verifyRegistrationInfo(req, res) {
  const body = req.body;
  const { userId, currentChallenge } = req.session;
  const user = MOCK_DATABASE[userId];
  let verification;
  try {
    const opts = {
      response: body,
      expectedChallenge: currentChallenge,
      expectedOrigin: EXPECTED_ORIGIN,
      expectedRPID: RP_ID,
      requireUserVerification: true,
    };

    verification = await verifyRegistrationResponse(opts);
  } catch (error) {
    console.error(error);
    return res.status(400).send({ error: error.message });
  }
  const { verified, registrationInfo } = verification;
  if (verified && registrationInfo) {
    const { credentialPublicKey, credentialID, counter } = registrationInfo;
    const existingDevice = user.devices.find((device) =>
      isoUint8Array.areEqual(device.credentialID, credentialID)
    );
    if (!existingDevice) {
      const newDevice = {
        credentialPublicKey,
        credentialID,
        counter,
        transports: body.response.transports,
      };
      user.devices.push(newDevice);
    }
  }
  req.session.currentChallenge = undefined;
  req.session.userId = userId;
  req.session.authenticated = true;
  req.session.userName = user.userName;
  res.send({ verified, authenticated: true, userName: user.userName });
}

export function clearSession(req) {
  req.session.userName = undefined;
  req.session.authenticated = false;
  req.session.userId = undefined;
  req.session.currentChallenge = undefined;
}

export function logout(req, res) {
  clearSession(req);
  res.send({});
}
