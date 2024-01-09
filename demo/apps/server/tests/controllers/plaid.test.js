import { vi } from "vitest";
import {
  createPlaidLinkToken,
  handleGetPlaidAccounts,
  getPlaidAccessToken,
} from "../../src/controllers/plaid";
import { MOCK_DATABASE } from "../../src/database";

vi.mock("../../src/util/plaid", () => ({
  plaidClient: {
    linkTokenCreate: vi.fn().mockRejectedValue({}),
    accountsGet: vi.fn(),
    itemPublicTokenExchange: vi.fn().mockRejectedValue({}),
  },
}));

describe("plaid controller", () => {
  describe("createPlaidLinkToken", () => {
    it("should return empty link token if error occurs", async () => {
      const result = await createPlaidLinkToken();
      expect(result).toEqual({ link_token: "" });
    });
  });

  describe("handleGetPlaidAccounts", () => {
    it("should return error if getPlaidAccounts fails", async () => {
      const userId = "mock_user_id";
      const plaidAccessToken = "mock_plaid_access_token";
      const error = new Error("Unknown error");
      const req = {
        session: { userId },
      };
      const res = {
        send: vi.fn(),
        status: vi.fn().mockReturnThis(),
      };
      MOCK_DATABASE[userId] = { plaidAccessToken };
      const getPlaidAccountsMock = vi.fn().mockRejectedValue(error);
      await handleGetPlaidAccounts(req, res, getPlaidAccountsMock);
      expect(req.session.plaidAccounts).toBeUndefined();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: error.message });
    });
  });

  describe("getPlaidAccessToken", () => {
    it("should return error if itemPublicTokenExchange fails", async () => {
      const public_token = "mock_public_token";
      const error = new Error("Unknown error");
      const req = {
        session: { userId: "mock_user_id" },
        body: { public_token },
      };
      const res = {
        send: vi.fn(),
        status: vi.fn().mockReturnThis(),
      };
      await getPlaidAccessToken(req, res);
      expect(
        MOCK_DATABASE[req.session.userId].plaidAccessToken
      ).toBeUndefined();

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: error.message });
    });
  });
});
