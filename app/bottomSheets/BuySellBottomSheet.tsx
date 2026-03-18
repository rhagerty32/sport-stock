import { useColors } from "@/components/utils";
import { useTheme } from "@/hooks/use-theme";
import { useHaptics } from "@/hooks/useHaptics";
import { usePortfolio } from "@/lib/portfolio-api";
import { useStock } from "@/lib/stocks-api";
import { useCreateTransaction } from "@/lib/transactions-api";
import { useWallet } from "@/lib/wallet-api";
import { useAuthStore } from "@/stores/authStore";
import { useStockStore } from "@/stores/stockStore";
import { Ionicons } from "@expo/vector-icons";
import {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetTextInput,
    BottomSheetView,
} from "@gorhom/bottom-sheet";
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { AnimatedRollingNumber } from "react-native-animated-rolling-numbers";
import { Easing } from "react-native-reanimated";

type BuySellBottomSheetProps = {
  buySellBottomSheetRef: React.RefObject<BottomSheetModal>;
};

export default function BuySellBottomSheet({
  buySellBottomSheetRef,
}: BuySellBottomSheetProps) {
  const Color = useColors();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const {
    activeStockId,
    activeStock: storeStock,
    setActiveStock,
    setBuySellBottomSheetOpen,
    setPurchaseFanCoinsBottomSheetOpen,
    setLoginBottomSheetOpen,
    removeFollow,
    buySellMode,
    setBuySellMode,
  } = useStockStore();
  const { data: wallet } = useWallet(
    isAuthenticated && user?.id ? user.id : null,
  );
  const { data: portfolio } = usePortfolio();
  const { data: fetchedStock } = useStock(activeStockId);
  const stock =
    fetchedStock ?? (storeStock?.id === activeStockId ? storeStock : null);
  const createTransactionMutation = useCreateTransaction();
  const [tradeError, setTradeError] = useState<string | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [showCustomAmount, setShowCustomAmount] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [orderMode, setOrderMode] = useState<"dollars" | "entries">("dollars");
  const customAmountInputRef = useRef<any>(null);

  useEffect(() => {
    if (fetchedStock) setActiveStock(fetchedStock);
  }, [fetchedStock, setActiveStock]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        enableTouchThrough={false}
        opacity={0.4}
      />
    ),
    [],
  );
  const { isDark } = useTheme();
  const { lightImpact } = useHaptics();

  // Get user's position for this stock (for sell mode)
  const userPosition = useMemo(() => {
    if (!stock || !portfolio?.positions) return null;
    return (
      portfolio.positions.find((position) => position.stock.id === stock.id) ??
      null
    );
  }, [stock, portfolio?.positions]);

  // Calculate available value for selling
  const availableSellValue = useMemo(() => {
    if (!userPosition) return 0;
    return userPosition.currentValue;
  }, [userPosition]);

  // Total entries available to sell
  const availableSellEntries = useMemo(() => {
    if (!userPosition) return 0;
    return userPosition.entries;
  }, [userPosition]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    lightImpact();
  };

  const runTrade = useCallback(async () => {
    // eslint-disable-next-line no-console
    console.log("[BuySellBottomSheet] runTrade guard check", {
      selectedAmount,
      hasStock: !!stock,
      stockPrice: stock?.price,
      orderMode,
    });
    if (!selectedAmount || !stock) {
      // eslint-disable-next-line no-console
      console.log("[BuySellBottomSheet] runTrade aborted due to invalid state");
      return;
    }
    // If orderMode is "entries", treat selectedAmount as entries. Otherwise, convert dollars to entries when price > 0.
    const quantity =
      orderMode === "entries"
        ? selectedAmount
        : stock.price > 0
          ? selectedAmount / stock.price
          : selectedAmount;
    if (quantity <= 0) return;
    setTradeError(null);
    // eslint-disable-next-line no-console
    console.log("[BuySellBottomSheet] runTrade called", {
      mode: buySellMode,
      selectedAmount,
      stockId: stock.id,
      stockPrice: stock.price,
      quantity,
      orderMode,
    });
    try {
      await createTransactionMutation.mutateAsync({
        body: {
          action: buySellMode,
          stockId: stock.id,
          quantity,
          // Only send a concrete price when we have one; otherwise let backend derive it.
          price: stock.price > 0 ? stock.price : null,
        },
        stockContext: { leagueID: stock.leagueID, ticker: stock.ticker },
      });
      if (activeStockId) removeFollow(activeStockId);
      lightImpact();
      closeModal();
    } catch (err) {
      setTradeError(err instanceof Error ? err.message : "Trade failed");
      lightImpact();
    }
  }, [
    selectedAmount,
    stock,
    buySellMode,
    activeStockId,
    removeFollow,
    createTransactionMutation,
    lightImpact,
  ]);

  const handleBuy = () => {
    // Button is already disabled when amount/credits are invalid, so just run trade.
    // eslint-disable-next-line no-console
    console.log("[BuySellBottomSheet] handleBuy pressed", {
      selectedAmount,
      walletCredits: wallet?.tradingCredits,
    });
    runTrade();
  };

  const handleSell = () => {
    // For now, allow selling whenever the user has a position and has picked an amount.
    // When price is 0, we interpret the amount as entries rather than dollar value.
    if (selectedAmount && userPosition) {
      runTrade();
    } else {
      lightImpact();
    }
  };

  const handleModeChange = (mode: "buy" | "sell") => {
    setBuySellMode(mode);
    setSelectedAmount(null); // Reset selected amount when switching modes
    lightImpact();
  };

  const handlePurchaseCredits = () => {
    setPurchaseFanCoinsBottomSheetOpen(true);
    lightImpact();
  };

  const effectiveAmount =
    showCustomAmount && customAmount
      ? (() => {
          const parsed = parseFloat(customAmount);
          return !Number.isNaN(parsed) && parsed > 0 ? parsed : selectedAmount;
        })()
      : selectedAmount;

  const hasInsufficientCredits =
    buySellMode === "buy" && wallet
      ? effectiveAmount
        ? orderMode === "dollars"
          ? wallet.tradingCredits < effectiveAmount
          : false
        : false
      : false;

  const hasInsufficientHoldings =
    buySellMode === "sell" && userPosition
      ? effectiveAmount
        ? orderMode === "dollars"
          ? // Only enforce a dollar-based cap when the backend reports a positive current value.
            availableSellValue > 0 && effectiveAmount > availableSellValue
          : // Entries mode: cap by available entries
            availableSellEntries > 0 && effectiveAmount > availableSellEntries
        : false
      : false;

  const handleOrderTypeChange = (mode: "dollars" | "entries") => {
    setOrderMode(mode);
    setSelectedAmount(null);
    lightImpact();
  };

  const handleCustomAmountPress = () => {
    setShowCustomAmount(true);
    lightImpact();
    // Focus the input after a short delay to ensure the modal is fully rendered
    setTimeout(() => {
      customAmountInputRef.current?.focus();
    }, 100);
  };

  const handleCustomAmountSubmit = () => {
    const amount = parseFloat(customAmount);
    console.log("amount", amount);
    if (amount > 0) {
      setSelectedAmount(amount);
      setShowCustomAmount(false);
      setCustomAmount("");
      lightImpact();
    }
  };

  const handleCustomAmountCancel = () => {
    setShowCustomAmount(false);
    setCustomAmount("");
    lightImpact();
  };

  const closeModal = () => {
    setBuySellBottomSheetOpen(false);
    setSelectedAmount(null);
  };

  // Filter preset amounts based on mode and available funds/holdings
  const presetAmounts = useMemo(() => {
    const baseAmounts = [1, 10, 20, 50, 100];
    if (buySellMode === "buy") {
      if (orderMode === "dollars") {
        // Filter buy amounts based on available SportCash
        const availableCash = wallet?.tradingCredits || 0;
        return baseAmounts.filter((amount) => amount <= availableCash);
      }
      // Entries mode: no balance constraint on preset entries
      return baseAmounts;
    } else {
      if (orderMode === "dollars") {
        // Filter sell amounts based on available holdings value (dollars)
        return baseAmounts.filter((amount) => amount <= availableSellValue);
      }
      // Entries mode: filter by available entries
      return baseAmounts.filter((amount) => amount <= availableSellEntries);
    }
  }, [
    buySellMode,
    orderMode,
    wallet?.tradingCredits,
    availableSellValue,
    availableSellEntries,
  ]);

  // Content that must always live inside BottomSheetModal so BottomSheetView has context
  const renderModalContent = () => {
    if (!stock) {
      return (
        <BottomSheetView style={styles.guardContainer}>
          <ActivityIndicator size="large" color={Color.green} />
          <Text
            style={[
              styles.guardSubtext,
              { color: Color.subText, marginTop: 12 },
            ]}
          >
            Loading…
          </Text>
        </BottomSheetView>
      );
    }
    if (!isAuthenticated) {
      return (
        <BottomSheetView style={styles.guardContainer}>
          <Text style={[styles.guardText, { color: Color.baseText }]}>
            Log in to trade
          </Text>
          <Text style={[styles.guardSubtext, { color: Color.subText }]}>
            Sign in to buy and sell teams on SportStock.
          </Text>
          <TouchableOpacity
            style={[styles.guardButton, { backgroundColor: Color.green }]}
            onPress={() => {
              setBuySellBottomSheetOpen(false);
              setLoginBottomSheetOpen(true);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.guardButtonText}>Log in</Text>
          </TouchableOpacity>
        </BottomSheetView>
      );
    }
    return null; // main form is rendered below in the normal return
  };

  // After all hooks: handle early-return cases
  if (!activeStockId) {
    return null;
  }

  const earlyContent = renderModalContent();
  if (earlyContent) {
    return (
      <BottomSheetModal
        ref={buySellBottomSheetRef}
        onDismiss={() => {
          setBuySellBottomSheetOpen(false);
          setSelectedAmount(null);
        }}
        stackBehavior="push"
        enableDynamicSizing={true}
        enablePanDownToClose={true}
        backdropComponent={renderBackdrop}
        handleStyle={{ display: "none" }}
        enableOverDrag={true}
        style={{ borderRadius: 20 }}
        backgroundStyle={{
          borderRadius: 20,
          backgroundColor: isDark ? "#1A1D21" : "#FFFFFF",
        }}
      >
        {earlyContent}
      </BottomSheetModal>
    );
  }

  return (
    <BottomSheetModal
      ref={buySellBottomSheetRef}
      onDismiss={closeModal}
      stackBehavior="push"
      enableDynamicSizing={true}
      enablePanDownToClose={true}
      backdropComponent={renderBackdrop}
      handleStyle={{ display: "none" }}
      enableOverDrag={true}
      style={{ borderRadius: 20 }}
      backgroundStyle={{
        borderRadius: 20,
        backgroundColor: isDark ? "#1A1D21" : "#FFFFFF",
      }}
    >
      <BottomSheetView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: Color.baseText }]}>
            {buySellMode === "buy" ? "Buy" : "Sell"} {stock!.name}
          </Text>
          <Text style={[styles.subtitle, { color: Color.subText }]}>
            {orderMode === "dollars"
              ? "Single Bet (USD)"
              : "Single Bet (entries)"}
          </Text>
          {buySellMode === "buy" && wallet && orderMode === "dollars" && (
            <Text style={[styles.balanceText, { color: Color.subText }]}>
              SportCash (SC): {formatCurrency(wallet.tradingCredits)}
            </Text>
          )}
          {buySellMode === "sell" &&
            userPosition &&
            orderMode === "dollars" && (
              <Text style={[styles.balanceText, { color: Color.subText }]}>
                Holdings Value: {formatCurrency(availableSellValue)}
              </Text>
            )}
          {buySellMode === "sell" &&
            userPosition &&
            orderMode === "entries" && (
              <Text style={[styles.balanceText, { color: Color.subText }]}>
                Entries Available: {availableSellEntries.toFixed(4)}
              </Text>
            )}
        </View>

        {/* Buy/Sell Mode Toggle */}
        <View
          style={[
            styles.tabsList,
            { backgroundColor: isDark ? "#242428" : "#F3F4F6" },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.tabTrigger,
              buySellMode === "buy" && {
                backgroundColor: isDark ? "#1A1D21" : "#FFFFFF",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
              },
            ]}
            onPress={() => handleModeChange("buy")}
          >
            <Ionicons
              name="add-circle-outline"
              size={20}
              color={buySellMode === "buy" ? Color.baseText : Color.subText}
            />
            <Text
              style={[
                styles.tabTriggerText,
                {
                  color: buySellMode === "buy" ? Color.baseText : Color.subText,
                },
              ]}
            >
              Buy
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabTrigger,
              buySellMode === "sell" && {
                backgroundColor: isDark ? "#1A1D21" : "#FFFFFF",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
              },
            ]}
            onPress={() => handleModeChange("sell")}
          >
            <Ionicons
              name="remove-circle-outline"
              size={20}
              color={buySellMode === "sell" ? Color.baseText : Color.subText}
            />
            <Text
              style={[
                styles.tabTriggerText,
                {
                  color:
                    buySellMode === "sell" ? Color.baseText : Color.subText,
                },
              ]}
            >
              Sell
            </Text>
          </TouchableOpacity>
        </View>

        {/* Order Mode Toggle (Dollars vs Entries) */}
        <View
          style={[
            styles.orderModeTabs,
            { backgroundColor: isDark ? "#242428" : "#F3F4F6" },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.orderModeTabTrigger,
              orderMode === "dollars" && {
                backgroundColor: isDark ? "#1A1D21" : "#FFFFFF",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 1.5,
                elevation: 1,
              },
            ]}
            onPress={() => handleOrderTypeChange("dollars")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.orderModeTabText,
                {
                  color:
                    orderMode === "dollars" ? Color.baseText : Color.subText,
                },
              ]}
            >
              Dollars
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.orderModeTabTrigger,
              orderMode === "entries" && {
                backgroundColor: isDark ? "#1A1D21" : "#FFFFFF",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 1.5,
                elevation: 1,
              },
            ]}
            onPress={() => handleOrderTypeChange("entries")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.orderModeTabText,
                {
                  color:
                    orderMode === "entries" ? Color.baseText : Color.subText,
                },
              ]}
            >
              Entries
            </Text>
          </TouchableOpacity>
        </View>

        {/* Insufficient Credits Warning */}
        {hasInsufficientCredits && (
          <View
            style={[
              styles.warningContainer,
              { backgroundColor: isDark ? "#7F1D1D" : "#FEE2E2" },
            ]}
          >
            <Ionicons name="warning" size={20} color="#DC2626" />
            <View style={styles.warningTextContainer}>
              <Text style={[styles.warningTitle, { color: Color.red }]}>
                Not Enough SportCash
              </Text>
              <Text
                style={[
                  styles.warningText,
                  { color: isDark ? "#FCA5A5" : "#991B1B" },
                ]}
              >
                You need{" "}
                {formatCurrency(
                  selectedAmount! - (wallet?.tradingCredits || 0),
                )}{" "}
                more to make this bet.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.purchaseCreditsButton}
              onPress={handlePurchaseCredits}
            >
              <Text style={styles.purchaseCreditsButtonText}>
                Add SportCash
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Insufficient Holdings Warning */}
        {hasInsufficientHoldings && (
          <View
            style={[
              styles.warningContainer,
              { backgroundColor: isDark ? "#7F1D1D" : "#FEE2E2" },
            ]}
          >
            <Ionicons name="warning" size={20} color="#DC2626" />
            <View style={styles.warningTextContainer}>
              <Text style={[styles.warningTitle, { color: Color.red }]}>
                Not Enough Holdings
              </Text>
              <Text
                style={[
                  styles.warningText,
                  { color: isDark ? "#FCA5A5" : "#991B1B" },
                ]}
              >
                You can only sell up to {formatCurrency(availableSellValue)}{" "}
                worth of {stock!.name}.
              </Text>
            </View>
          </View>
        )}

        {/* Amount Selection Grid */}
        <View style={styles.amountGrid}>
          {buySellMode === "sell" && userPosition && (
            <TouchableOpacity
              style={[
                styles.amountButton,
                {
                  backgroundColor: (
                    orderMode === "dollars"
                      ? Math.abs((selectedAmount ?? 0) - availableSellValue) <
                        0.001
                      : Math.abs((selectedAmount ?? 0) - availableSellEntries) <
                        0.001
                  )
                    ? "#bbb"
                    : isDark
                      ? "#242428"
                      : "#F3F4F6",
                },
              ]}
              onPress={() =>
                handleAmountSelect(
                  orderMode === "dollars"
                    ? availableSellValue
                    : availableSellEntries,
                )
              }
            >
              <Text
                style={[
                  styles.amountText,
                  styles.sellAllButtonText,
                  {
                    color: (
                      orderMode === "dollars"
                        ? Math.abs((selectedAmount ?? 0) - availableSellValue) <
                          0.001
                        : Math.abs(
                            (selectedAmount ?? 0) - availableSellEntries,
                          ) < 0.001
                    )
                      ? "#FFFFFF"
                      : Color.baseText,
                  },
                ]}
              >
                Sell everything
              </Text>
            </TouchableOpacity>
          )}
          {presetAmounts.map((amount) => (
            <TouchableOpacity
              key={amount}
              style={[
                styles.amountButton,
                {
                  backgroundColor:
                    selectedAmount === amount
                      ? "#bbb"
                      : isDark
                        ? "#242428"
                        : "#F3F4F6",
                },
              ]}
              onPress={() => handleAmountSelect(amount)}
            >
              <Text
                style={[
                  styles.amountText,
                  {
                    color:
                      selectedAmount === amount ? "#FFFFFF" : Color.baseText,
                  },
                ]}
              >
                {orderMode === "dollars"
                  ? formatCurrency(amount)
                  : `${amount} entries`}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[
              styles.amountButton,
              { backgroundColor: isDark ? "#242428" : "#F3F4F6" },
            ]}
            onPress={handleCustomAmountPress}
          >
            <Text style={[styles.amountText, { color: Color.baseText }]}>
              ...
            </Text>
          </TouchableOpacity>
        </View>

        {/* Custom Amount Input */}
        {showCustomAmount && (
          <View style={styles.customAmountContainer}>
            <Text style={[styles.customAmountLabel, { color: Color.baseText }]}>
              Enter Custom Amount
            </Text>
            <BottomSheetTextInput
              ref={customAmountInputRef}
              style={[
                styles.customAmountInput,
                {
                  backgroundColor: isDark ? "#242428" : "#F3F4F6",
                  color: Color.baseText,
                  borderColor: isDark ? "#4B5563" : "#D1D5DB",
                },
              ]}
              placeholder="Enter amount"
              placeholderTextColor={Color.subText}
              value={customAmount}
              onChangeText={setCustomAmount}
              keyboardType="decimal-pad"
              returnKeyType="done"
              onSubmitEditing={handleCustomAmountSubmit}
            />
            <View style={styles.customAmountButtons}>
              <TouchableOpacity
                style={[
                  styles.customAmountButton,
                  styles.cancelButton,
                  { backgroundColor: isDark ? "#242428" : "#F3F4F6" },
                ]}
                onPress={handleCustomAmountCancel}
              >
                <Text
                  style={[
                    styles.customAmountButtonText,
                    { color: Color.baseText },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.customAmountButton,
                  styles.submitButton,
                  { backgroundColor: customAmount ? "#10B981" : Color.gray500 },
                ]}
                onPress={handleCustomAmountSubmit}
                disabled={!customAmount}
              >
                <Text style={styles.customAmountButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Action Button */}
        <View style={styles.addButtonContainer}>
          <TouchableOpacity
            style={[
              styles.addButton,
              {
                backgroundColor: selectedAmount
                  ? buySellMode === "buy"
                    ? "#10B981"
                    : "#F87171"
                  : Color.gray500,
                opacity: selectedAmount ? 1 : 0.5,
              },
            ]}
            onPress={buySellMode === "buy" ? handleBuy : handleSell}
            disabled={
              !selectedAmount ||
              showCustomAmount ||
              hasInsufficientCredits ||
              hasInsufficientHoldings ||
              createTransactionMutation.isPending
            }
          >
            {createTransactionMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : selectedAmount ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {orderMode === "dollars" && (
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 18,
                      fontWeight: "600",
                    }}
                  >
                    $
                  </Text>
                )}
                <AnimatedRollingNumber
                  value={selectedAmount}
                  toFixed={4}
                  useGrouping={true}
                  enableCompactNotation={orderMode === "dollars"}
                  compactToFixed={4}
                  fixedOnlyForCompact={false}
                  textStyle={{
                    color: "#FFFFFF",
                    fontSize: 18,
                    fontWeight: "600",
                  }}
                  spinningAnimationConfig={{
                    duration: 500,
                    easing: Easing.bezier(0.25, 0.1, 0.25, 1.0),
                  }}
                />
                {orderMode === "entries" && (
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 16,
                      fontWeight: "500",
                      marginLeft: 4,
                    }}
                  >
                    entries
                  </Text>
                )}
              </View>
            ) : (
              <Text style={styles.addButtonText}>
                {buySellMode === "buy" ? "Buy" : "Sell"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
        {tradeError ? (
          <Text
            style={[
              styles.guardSubtext,
              { color: Color.red, marginTop: 8, textAlign: "center" },
            ]}
          >
            {tradeError}
          </Text>
        ) : null}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  guardContainer: {
    padding: 24,
    alignItems: "center",
  },
  guardText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  guardSubtext: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: "center",
  },
  guardButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  guardButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  balanceText: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 8,
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    lineHeight: 16,
  },
  purchaseCreditsButton: {
    backgroundColor: "#217C0A",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  purchaseCreditsButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  orderTypeContainer: {
    marginBottom: 16,
    alignItems: "stretch",
  },
  orderTypeButton: {
    // Deprecated in favor of orderModeTabs/orderModeTabTrigger
  },
  orderTypeText: {
    fontSize: 16,
    fontWeight: "500",
  },
  amountGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 40,
    gap: 12,
  },
  amountButton: {
    width: "30%",
    aspectRatio: 1.2,
    display: "flex",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  sellAllButtonText: {
    fontSize: 11,
  },
  amountText: {
    fontSize: 16,
    fontWeight: "600",
  },
  addButtonContainer: {
    marginBottom: 20,
    width: "100%",
  },
  addButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  bottomSpacing: {
    height: 30,
  },
  customAmountContainer: {
    marginBottom: 30,
  },
  customAmountLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  customAmountInput: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 16,
    textAlign: "center",
  },
  customAmountButtons: {
    flexDirection: "row",
    gap: 12,
  },
  customAmountButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    // Styles handled by backgroundColor in component
  },
  submitButton: {
    // Styles handled by backgroundColor in component
  },
  customAmountButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  tabsList: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tabTrigger: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  tabTriggerText: {
    fontSize: 14,
    fontWeight: "600",
  },
  orderModeTabs: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 3,
    marginBottom: 20,
  },
  orderModeTabTrigger: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    borderRadius: 7,
  },
  orderModeTabText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
