import { create } from 'zustand';

/**
 * Portfolio server state has been moved to TanStack Query.
 * Use usePortfolio(), usePositions(), useTransactions() from lib/portfolio-api and lib/transactions-api.
 */
type PortfolioStore = Record<string, never>;

export const usePortfolioStore = create<PortfolioStore>()(() => ({}));
