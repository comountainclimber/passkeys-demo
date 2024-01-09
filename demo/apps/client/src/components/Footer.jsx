import { Flex, Image, Text } from "@chakra-ui/react";

import ColoradoFlag from "../assets/colorado.png";

export function Footer() {
  return (
    <Flex
      textAlign="center"
      mt="auto"
      mb={4}
      justifyContent="center"
      alignItems="center"
    >
      <Text fontSize="sm" color="gray.500">
        Made by{" "}
        <a
          href="https://github.com/comountainclimber"
          target="_blank"
          rel="noreferrer"
        >
          comountainclimber
        </a>
      </Text>
      <Image
        src={ColoradoFlag}
        alt="Colorado Flag"
        height="12px"
        ml={1}
        opacity={0.4}
      />
    </Flex>
  );
}
