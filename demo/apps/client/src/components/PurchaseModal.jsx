import {
  Button,
  Flex,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  FormControl,
  FormLabel,
  Input,
  ModalFooter,
  Radio,
  RadioGroup,
  FormErrorMessage,
} from "@chakra-ui/react";

import { useEffect, useState } from "react";
import ConfettiExplosion from "react-confetti-explosion";
import { usePlaidStore } from "../state/plaid";
import { useCryptoStore } from "../state/crypto";
import { useAuthStore } from "../state/authentication";

// eslint-disable-next-line react/prop-types
export function PurchaseModal({ showModal, setShowModal }) {
  const [btcAmount, setBtcAmount] = useState("");
  const [selectedAccount, setSelectedAccount] = useState();
  const [fiatAmount, setFiatAmount] = useState("");
  const [selectedAccountError, setSelectedAccountError] = useState("");
  const [btcAmountError, setBtcAmountError] = useState("");
  const [isExploding, setIsExploding] = useState(false);

  const { authenticate } = useAuthStore((state) => ({
    authenticate: state.authenticate,
  }));

  const { plaidAccounts } = usePlaidStore((state) => ({
    plaidAccounts: state.plaidAccounts,
  }));

  const { purchaseBitcoin, price } = useCryptoStore((state) => ({
    purchaseBitcoin: state.purchaseBitcoin,
    price: state.BTCPrice,
  }));

  useEffect(() => {
    if (price && btcAmount) {
      if (!btcAmount) return;
      if (isNaN(btcAmount)) return;
      setFiatAmount((btcAmount * price).toFixed(2));
    } else {
      setFiatAmount("");
    }
  }, [price, btcAmount]);

  useEffect(() => {
    if (!showModal) {
      setSelectedAccount("");
      setBtcAmount("");
      setFiatAmount("");
      setSelectedAccountError("");
      setBtcAmountError("");
    }
  }, [showModal]);

  const handleBtcAmountChange = (event) => {
    const value = event.target.value;
    const regex = /^([1-9][0-9]*|0)(\.[0-9]{0,8})?$/;
    if (regex.test(value) || value === "") {
      setBtcAmount(value);
      setBtcAmountError("");
    }
  };

  const handlePurchaseBitcoin = async (e) => {
    let validForm = true;
    e.preventDefault();
    if (!selectedAccount) {
      setSelectedAccountError("Please select a Plaid account");
      validForm = false;
    }
    if (!btcAmount) {
      setBtcAmountError("Please enter a BTC amount");
      validForm = false;
    }
    const account = plaidAccounts.find(
      (account) => account.account_id === selectedAccount
    );
    if (account) {
      if (parseFloat(fiatAmount) > account.balances.available) {
        const maxAmount = (account.balances.available / price).toFixed(8);
        setBtcAmountError(
          `Insufficient funds 🙁 max amount of BTC is ${maxAmount}`
        );
        validForm = false;
      }

      if (parseFloat(btcAmount) < 0.00001) {
        setBtcAmountError("Minimum BTC amount is 0.00001");
        validForm = false;
      }
    }
    if (validForm) {
      setShowModal(false);
      await authenticate(false);
      const success = await purchaseBitcoin(parseFloat(btcAmount));

      if (success) {
        setIsExploding(true);
        setTimeout(() => {
          setIsExploding(false);
        }, CONFETTI_OPTIONS.duration);
      }
    }
  };

  const priceFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  const CONFETTI_OPTIONS = {
    force: 0.6,
    duration: 2500,
    particleCount: 80,
    width: 1000,
  };

  return (
    <>
      <>
        {isExploding && (
          <Flex justifyContent="center" alignItems="center" height="100%">
            <ConfettiExplosion {...CONFETTI_OPTIONS} />
          </Flex>
        )}
      </>
      ;
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <ModalOverlay />
        <ModalContent>
          <form onSubmit={handlePurchaseBitcoin}>
            <ModalHeader>Purchase BTC</ModalHeader>
            <ModalBody>
              <FormControl mb={4} isInvalid={!!selectedAccountError}>
                <FormLabel>Select Plaid Account</FormLabel>
                <RadioGroup
                  onChange={(id) => {
                    setSelectedAccount(id);
                    setSelectedAccountError("");
                  }}
                  value={selectedAccount}
                >
                  {plaidAccounts.map((account) => {
                    const formatter = new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: account.balances.iso_currency_code,
                    });

                    return (
                      <Flex key={account.account_id}>
                        <Radio value={account.account_id}>
                          <Flex alignItems="center">
                            {account.name} ({account.mask}) -
                            <Text fontSize="xs">
                              {formatter.format(account.balances.available)}
                            </Text>
                          </Flex>
                        </Radio>
                      </Flex>
                    );
                  })}
                </RadioGroup>
                <FormErrorMessage>{selectedAccountError}</FormErrorMessage>
              </FormControl>
              <FormControl mb={4} isInvalid={!!btcAmountError}>
                <FormLabel htmlFor="btcAmount" display="flex">
                  BTC Amount
                  {fiatAmount && (
                    <Text ml={2} color="gray.500">
                      ({priceFormatter.format(fiatAmount)})
                    </Text>
                  )}
                </FormLabel>
                <Input
                  type="text"
                  name="btcAmount"
                  value={btcAmount}
                  onChange={(event) => {
                    const regex = /^[0-9]*\.?[0-9]{0,8}$/;
                    if (regex.test(event.target.value)) {
                      handleBtcAmountChange(event);
                      setBtcAmountError("");
                    }
                  }}
                  placeholder="Enter BTC amount"
                  pattern="[0-9]*\.?[0-9]{0,8}"
                  step="0.00000001"
                />
                <FormErrorMessage>{btcAmountError}</FormErrorMessage>
              </FormControl>
            </ModalBody>
            <ModalFooter>
              <Button
                colorScheme="green"
                cursor="pointer"
                type="submit"
                onClick={handlePurchaseBitcoin}
              >
                Purchase
              </Button>
              <Button
                ml={3}
                cursor="pointer"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </>
  );
}
