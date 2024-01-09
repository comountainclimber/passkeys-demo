import { Button, Card, Flex, Text } from "@chakra-ui/react";

import { useAuthStore } from "../state/authentication";

import { Footer } from "./Footer";

export function Authenticated() {
  const { logout, userName } = useAuthStore((state) => ({
    logout: state.logout,
    userName: state.userName,
  }));

  return (
    <Card width="500px" minHeight="500px" margin="auto">
      <Flex alignItems="center" justifyContent="space-between" padding="24px">
        <Button size="sm" cursor="pointer" onClick={logout} variant="ghost">
          Logout
        </Button>
      </Flex>

      <Text>
        Welcome to an authenticated route {userName}! <br /> You are logged in
        🎉
      </Text>
      <Footer />
    </Card>
  );
}
