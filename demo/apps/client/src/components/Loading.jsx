import { Card, Spinner } from "@chakra-ui/react";

export function Loading() {
  return (
    <Card
      width="500px"
      minHeight="500px"
      margin="auto"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Spinner size="xl"></Spinner>
    </Card>
  );
}
