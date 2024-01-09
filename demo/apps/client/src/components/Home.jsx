import {
  Box,
  Button,
  Card,
  Divider,
  Flex,
  FormControl,
  FormErrorMessage,
  Input,
  Text,
  InputGroup,
  InputRightAddon,
  Image,
} from "@chakra-ui/react";
import { useState } from "react";
import { useAuthStore } from "../state/authentication";
import { Footer } from "./Footer";
import PasskeysLogo from "../assets/passkey-logo.svg";

export function Home() {
  const createNewAccount = useAuthStore((state) => state.createNewAccount);
  const authenticate = useAuthStore((state) => state.authenticate);

  const [userName, setUserName] = useState("");
  const [userNameError, setUserNameError] = useState("");

  function handleUserNameChange(event) {
    setUserName(event.target.value);
    setUserNameError("");
  }

  function handleCreateNewAccount(e) {
    e.preventDefault();
    if (!userName) {
      setUserNameError("Please enter a user name");
      return;
    }
    createNewAccount({ userName });
  }

  return (
    <Card width="500px" height="500px" margin="auto">
      <Text mt={8} fontSize="3xl" fontWeight="bold" mb={4}>
        Sign in or sign up
      </Text>

      <Text
        width="350px"
        margin="auto"
        mt={0}
        mb={2}
        fontSize="sm"
        fontFamily="mono"
      >
        A passkeys demo app 🚀
      </Text>
      <Box>
        <form onSubmit={handleCreateNewAccount}>
          <FormControl
            isInvalid={!!userNameError}
            width="350px"
            margin="auto"
            marginTop={8}
          >
            <InputGroup>
              <Input
                type="text"
                name="userName"
                value={userName}
                onChange={handleUserNameChange}
                placeholder="Enter a user name"
              />
              <InputRightAddon
                width="80px"
                padding={0}
                ml={userNameError ? "1px" : 0}
              >
                <Button
                  type="submit"
                  cursor="pointer"
                  onClick={handleCreateNewAccount}
                  minWidth="80px"
                >
                  <Text fontSize="xs">Sign up</Text>
                </Button>
              </InputRightAddon>
            </InputGroup>
            <FormErrorMessage>{userNameError}</FormErrorMessage>
          </FormControl>
        </form>
        <Flex width="350px" margin="auto" mt={6} mb={6} alignItems={"center"}>
          <Divider mr="12px" />
          <Text fontSize="sm" opacity={0.4}>
            or
          </Text>
          <Divider ml="12px" />
        </Flex>

        <Button
          width="350px"
          onClick={authenticate}
          padding="0"
          cursor="pointer"
        >
          <Flex alignItems={"center"}>
            Sign in with a passkey{" "}
            <Image
              src={PasskeysLogo}
              alt="Passkeys logo"
              height="18px"
              ml={2}
            />
          </Flex>
        </Button>
      </Box>
      <Footer />
    </Card>
  );
}
