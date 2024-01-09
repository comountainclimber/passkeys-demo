import { vi } from "vitest";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
// eslint-disable-next-line
import { isoBase64URL, isoUint8Array } from "@simplewebauthn/server/helpers";

import {
  checkAuthStatus,
  verifyAuthentication,
} from "../../src/controllers/auth";
import {
  createPlaidLinkToken,
  getPlaidAccounts,
} from "../../src/controllers/plaid";
import { generateBitcoinAddress } from "../../src/util/btc";
import { importAddress } from "../../src/util/rpc";
import { MOCK_DATABASE } from "../../src/database";

vi.mock("../../src/database", () => {
  return {
    MOCK_DATABASE: {},
  };
});

vi.mock("../../src/controllers/plaid", async () => {
  const actual = await vi.importActual("../../src/controllers/plaid");
  return {
    // eslint-disable-next-line node/no-unsupported-features/es-syntax
    ...actual,
    createPlaidLinkToken: vi.fn(),
    getPlaidAccounts: vi.fn(),
  };
});

vi.mock("../../src/util/btc", () => {
  return {
    generateBitcoinAddress: vi.fn(),
  };
});

vi.mock("../../src/util/rpc", () => {
  return {
    importAddress: vi.fn(),
  };
});

vi.mock("@simplewebauthn/server/helpers", () => {
  return {
    isoBase64URL: {
      toBuffer: vi.fn(),
    },
    isoUint8Array: {
      areEqual: vi.fn(),
    },
  };
});

vi.mock("@simplewebauthn/server", () => {
  return {
    verifyAuthenticationResponse: vi.fn(),
  };
});

describe("checkAuthStatus", () => {
  it("should return authenticated status and BTC address", async () => {
    const link_token = "mock_link_token";
    const authenticated = true;
    const BTCAddress = "mock_BTC_address";
    const plaidAccounts = [{ name: "mock_account", balance: 100 }];
    const req = {};
    const res = {
      send: vi.fn(),
    };
    createPlaidLinkToken.mockResolvedValue({ link_token });
    req.session = { authenticated, BTCAddress, plaidAccounts };
    await checkAuthStatus(req, res);
    expect(res.send).toHaveBeenCalledWith({
      authenticated: true,
      address: BTCAddress,
      link_token,
      plaidAccounts,
    });
  });
});

describe("verifyAuthentication", () => {
  it("should verify authentication response and return address and plaid accounts", async () => {
    const req = {
      body: {
        rawId: "mock_raw_id",
      },
      session: {
        currentChallenge: "mock_challenge",
        userId: "mock_user_id",
      },
    };
    const res = {
      send: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };
    const user = {
      id: "mock_user_id",
      devices: [
        {
          credentialID: "mock_raw_id",
          transports: ["usb"],
          counter: 0,
        },
      ],
      seedPhrase: "mock_seed_phrase",
      seedIndex: 0,
      plaidAccessToken: "mock_plaid_access_token",
    };
    const dbAuthenticator = user.devices[0];
    const verification = {
      verified: true,
      authenticationInfo: {
        newCounter: 1,
      },
    };
    const address = "mock_BTC_address";
    const plaidAccounts = [{ name: "mock_account", balance: 100 }];
    MOCK_DATABASE[user.id] = user;
    isoBase64URL.toBuffer.mockReturnValue("mock_raw_id");
    isoUint8Array.areEqual.mockReturnValue(true);
    verifyAuthenticationResponse.mockResolvedValue(verification);
    generateBitcoinAddress.mockResolvedValue(address);
    getPlaidAccounts.mockResolvedValue(plaidAccounts);
    await verifyAuthentication(req, res);
    expect(res.send).toHaveBeenCalledWith({
      verified: true,
      address,
      plaidAccounts,
    });
    expect(req.session.currentChallenge).toBeUndefined();
    expect(req.session.userId).toBe(user.id);
    expect(req.session.authenticated).toBe(true);
    expect(req.session.plaidAccounts).toBe(plaidAccounts);
    expect(req.session.BTCAddress).toBe(address);
    expect(importAddress).toHaveBeenCalledWith(address, "watch-only-wallet");
    expect(dbAuthenticator.counter).toBe(
      verification.authenticationInfo.newCounter
    );
  });

  it("should return error if authenticator is not registered", async () => {
    const req = {
      body: {
        rawId: "mock_raw_id",
      },
      session: {},
    };
    const res = {
      send: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };
    isoBase64URL.toBuffer.mockReturnValue(Buffer.from("mock_raw_id"));
    isoUint8Array.areEqual.mockReturnValue(false);
    await verifyAuthentication(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      error: "Authenticator is not registered with this site",
    });
  });

  it("should return error if verification fails", async () => {
    importAddress.mockClear();
    const req = {
      body: {
        rawId: "mock_raw_id",
      },
      session: {
        currentChallenge: "mock_challenge",
      },
    };
    const res = {
      send: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };
    const user = {
      id: "mock_user_id",
      devices: [
        {
          credentialID: "mock_credential_id",
          transports: ["usb"],
          counter: 0,
        },
      ],
    };
    const dbAuthenticator = user.devices[0];
    const error = new Error("Authenticator is not registered with this site");
    MOCK_DATABASE[user.id] = user;
    isoBase64URL.toBuffer.mockReturnValue(
      Buffer.from("unverified_credential_id")
    );
    isoUint8Array.areEqual.mockReturnValue(true);
    verifyAuthenticationResponse.mockRejectedValue(error);
    await verifyAuthentication(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ error: error.message });
    expect(req.session.currentChallenge).toBeUndefined();
    expect(req.session.userId).toBeUndefined();
    expect(req.session.authenticated).toBe(false);
    expect(req.session.plaidAccounts).toBeUndefined();
    expect(req.session.BTCAddress).toBeUndefined();
    expect(importAddress).not.toHaveBeenCalled();
    expect(dbAuthenticator.counter).toBe(0);
  });
});
