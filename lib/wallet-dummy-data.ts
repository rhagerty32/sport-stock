import { BonusInfo, CreditBonus, FanCoinPurchase, Wallet } from '@/types';

// Dummy user ID (in real app, this would come from auth context)
const DUMMY_USER_ID = 1;

// Gold Coins conversion rate: 100 GC per $1 USD
const FANCOINS_PER_DOLLAR = 100;

// Bonus calculation rules (no bonuses - 1:1 ratio)
export const dummyBonusInfo: BonusInfo = {
    baseMultiplier: 1.0, // 100% = 1:1 ratio
    tierMultipliers: [
        { min: 0, max: Infinity, multiplier: 1.0 }, // Always 1:1
    ],
    firstTimeBonus: 0, // No first-time bonus
};

// Calculate bonus multiplier (always 1.0 for 1:1 ratio)
export const calculateBonusMultiplier = (amount: number, isFirstPurchase: boolean = false): number => {
    return 1.0; // Always 1:1, no bonuses
};

// Dummy wallet data
let dummyWallet: Wallet = {
    fanCoins: 0,
    tradingCredits: 120.00, // Starting balance
    userId: DUMMY_USER_ID,
    updatedAt: new Date(),
};

// Dummy purchase history
let dummyPurchaseHistory: FanCoinPurchase[] = [];

// Check if user has made any purchases
const hasMadePurchase = (): boolean => {
    return dummyPurchaseHistory.length > 0;
};

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Get wallet balances
export const getDummyWallet = async (userId: number): Promise<Wallet> => {
    await delay(300); // Simulate network delay
    return { ...dummyWallet };
};

// Simulate FanCoin purchase
export const simulatePurchase = async (
    userId: number,
    amount: number,
    paymentMethod: FanCoinPurchase['paymentMethod']
): Promise<FanCoinPurchase> => {
    await delay(800); // Simulate processing delay
    
    // Calculate Gold Coins: 100 GC per $1
    const fanCoinsReceived = amount * FANCOINS_PER_DOLLAR;
    // Trading Credits: 1:1 ratio (no bonus)
    const tradingCreditsGranted = amount;
    
    const purchase: FanCoinPurchase = {
        id: dummyPurchaseHistory.length + 1,
        userId,
        amount,
        fanCoinsReceived,
        tradingCreditsGranted,
        bonusPercentage: 0, // No bonus
        paymentMethod,
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    
    // Update wallet
    dummyWallet.fanCoins += fanCoinsReceived;
    dummyWallet.tradingCredits += tradingCreditsGranted;
    dummyWallet.updatedAt = new Date();
    
    // Add to history
    dummyPurchaseHistory.push(purchase);
    
    return purchase;
};

// Get purchase history
export const getDummyPurchaseHistory = async (userId: number): Promise<FanCoinPurchase[]> => {
    await delay(200);
    return [...dummyPurchaseHistory].reverse(); // Most recent first
};

// Get bonus info
export const getDummyBonusInfo = async (): Promise<BonusInfo> => {
    await delay(100);
    return { ...dummyBonusInfo };
};

// Reset wallet (for testing)
export const resetDummyWallet = () => {
    dummyWallet = {
        fanCoins: 0,
        tradingCredits: 120.00,
        userId: DUMMY_USER_ID,
        updatedAt: new Date(),
    };
    dummyPurchaseHistory = [];
};

