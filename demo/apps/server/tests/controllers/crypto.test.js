import { vi } from "vitest";
import { getBalance, purchaseBTC } from "../../src/controllers/crypto";
import { getAddressBalance, transferFunds } from "../../src/util/rpc";

// Mock the getAddressBalance and transferFunds functions
vi.mock("../../src/util/rpc", () => ({
  getAddressBalance: vi.fn(),
  transferFunds: vi.fn(),
}));

describe("crypto controller", () => {
  describe("getBalance", () => {
    it("should return BTC address balance", async () => {
      const BTCAddress = "mock_BTC_address";
      const balance = 100;
      const req = {
        session: { BTCAddress },
      };
      const res = {
        send: vi.fn(),
      };
      // Set the mock implementation for getAddressBalance
      getAddressBalance.mockResolvedValue(balance);
      await getBalance(req, res);
      expect(getAddressBalance).toHaveBeenCalledWith(
        "watch-only-wallet",
        BTCAddress
      );
      expect(res.send).toHaveBeenCalledWith({ balance });
    });
  });

  describe("purchaseBTC", () => {
    it("should transfer funds and return BTC address balance", async () => {
      const BTCAddress = "mock_BTC_address";
      const amount = 50;
      const balance = 50;
      const req = {
        session: { BTCAddress },
        body: { amount },
      };
      const res = {
        send: vi.fn(),
        status: vi.fn().mockReturnThis(),
      };
      // Set the mock implementation for transferFunds and getAddressBalance
      transferFunds.mockResolvedValue();
      getAddressBalance.mockResolvedValue(balance);
      await purchaseBTC(req, res);
      expect(transferFunds).toHaveBeenCalledWith(
        "custodial-wallet",
        BTCAddress,
        amount
      );
      expect(getAddressBalance).toHaveBeenCalledWith(
        "watch-only-wallet",
        BTCAddress
      );
      expect(res.send).toHaveBeenCalledWith({ balance });
    });

    it("should return error if transfer fails", async () => {
      getAddressBalance.mockClear();
      const BTCAddress = "mock_BTC_address";
      const amount = 50;
      const message = "some arbitrary message";
      const error = {
        response: {
          data: {
            error: message,
          },
        },
      };
      const req = {
        session: { BTCAddress },
        body: { amount },
      };
      const res = {
        send: vi.fn(),
        status: vi.fn().mockReturnThis(),
      };
      // Set the mock implementation for transferFunds and getAddressBalance
      transferFunds.mockRejectedValue(error);
      await purchaseBTC(req, res);
      expect(transferFunds).toHaveBeenCalledWith(
        "custodial-wallet",
        BTCAddress,
        amount
      );
      expect(getAddressBalance).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: message });
    });
  });
});
