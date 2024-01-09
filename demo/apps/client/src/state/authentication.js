import { create } from "zustand";
import {
  startRegistration,
  startAuthentication,
} from "@simplewebauthn/browser";
import { makeInternalRequest } from "../util/api";

function resetState() {
  const { update: setAuthStore } = useAuthStore.getState();
  setAuthStore({
    loading: false,
    authenticated: false,
    userName: "",
  });
}

export const useAuthStore = create((set, get) => ({
  authenticated: false,
  loading: false,
  userName: "",
  checkAuthStatus: async () => {
    try {
      set({ loading: true });
      const { data } = await makeInternalRequest("check-auth-status", "GET");
      if (data.authenticated) {
        return set({
          authenticated: true,
          loading: false,
          userName: data.userName,
        });
      }
      resetState();
    } catch (error) {
      resetState();
      console.log(error);
    }
  },
  createNewAccount: async (account) => {
    try {
      const { data } = await makeInternalRequest(
        "generate-registration-options",
        "POST",
        account
      );
      const registrationResponse = await startRegistration(data);

      console.log({ registrationResponse });
      const { status } = await makeInternalRequest(
        "verify-registration",
        "POST",
        registrationResponse
      );
      if (status !== 200) throw new Error("Invalid registration");
      get().checkAuthStatus();
    } catch (error) {
      console.log(error);
    }
  },
  authenticate: async (shouldCheckAuthStatus = true) => {
    try {
      const { data: options } = await makeInternalRequest(
        "generate-authentication-options",
        "GET"
      );
      const authResponse = await startAuthentication(options);
      const { status } = await makeInternalRequest(
        "verify-authentication",
        "POST",
        authResponse
      );
      if (status !== 200) {
        throw new Error("Invalid credentials");
      }

      shouldCheckAuthStatus && get().checkAuthStatus();
    } catch (error) {
      resetState();
      console.log(error);
    }
  },
  logout: async () => {
    try {
      await makeInternalRequest("logout", "GET");
      get().checkAuthStatus();
    } catch (error) {
      console.log(error);
    }
  },
  update: (data) => {
    set(data);
  },
}));
