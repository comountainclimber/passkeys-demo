import { test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import App from "../../src/App";

const mockStore = {
  authenticated: false,
  checkAuthStatus: vi.fn().mockResolvedValue(),
};

vi.mock("../../src/state/crypto", () => ({
  useCryptoStore: vi.fn((selector) => {
    if (typeof selector === "function") {
      return selector({
        BTCAddress: "12345666",
        getCurrentBitcoinPrice: vi.fn().mockResolvedValue(),
        BTCPrice: 100,
      });
    }
    return {
      BTCAddress: "12345666",
      getCurrentBitcoinPrice: vi.fn().mockResolvedValue(),
      BTCPrice: 100,
    };
  }),
}));

function mockAuth(authenticated = false, loading = false) {
  mockStore.authenticated = authenticated;
  mockStore.loading = loading;
  vi.mock("../../src/state/authentication", () => ({
    useAuthStore: vi.fn((selector) => {
      if (typeof selector === "function") {
        return selector(mockStore);
      }
      return mockStore;
    }),
  }));
}

test("renders ExternalRoutes when not authenticated", async () => {
  mockAuth(false);
  render(<App />);
  await waitFor(() => {
    expect(screen.getByText("Sign in or sign up"));
    expect(
      screen.getByText(
        "A demo app using passkeys, plaid, and the bitcoin regtest to buy bitcoin 🚀"
      )
    );
  });
});

test("renders PrivateRoutes when authenticated", async () => {
  mockAuth(true);
  render(<App />);

  await waitFor(() => {
    expect(screen.getByText("Link you bank account"));
    expect(screen.getByText("Buy BTC"));
    expect(screen.getByText("Logout"));
  });
});

test("renders loading when loading", async () => {
  mockAuth(true, true);
  render(<App />);
  await waitFor(() => {
    expect(screen.getByText("Loading..."));
  });
});

test("renders the users bitcoin address if set in state", async () => {
  mockAuth(true);
  render(<App />);
  await waitFor(() => {
    expect(screen.getByText("12345666"));
    expect(screen.getByText("$100.00"));
  });
});
