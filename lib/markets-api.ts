import { API_ENDPOINTS } from '@/constants/api-config';
import { apiGet, apiPost } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

export const marketsKeys = {
    all: ['markets'] as const,
    list: () => [...marketsKeys.all, 'list'] as const,
    assets: (marketId: string) => [...marketsKeys.all, 'assets', marketId] as const,
    positions: (marketId: string) => [...marketsKeys.all, 'positions', marketId] as const,
};

/**
 * Market list item (from GET /api/markets/).
 * API_DOCS: MarketListItem has market_id, name.
 */
export type MarketListItem = { market_id: string; name: string };

/**
 * Market position (from GET /api/markets/{market_id}/positions).
 * API_DOCS: PositionResponse has position_id, user_id, asset_id, quantity, locked_quantity, cost_basis.
 */
export type MarketPositionResponse = {
    position_id: string;
    user_id: string;
    asset_id: string;
    quantity: number;
    locked_quantity: number;
    cost_basis: number;
};

/**
 * Asset in a market (from GET /api/markets/{market_id}/assets).
 * API_DOCS: AssetResponse has asset_id, name, initial_value, volatility_params.
 */
export type MarketAssetResponse = {
    asset_id: string;
    name: string;
    initial_value?: number;
    volatility_params?: Record<string, unknown>;
};

/**
 * Submit orders body (POST /api/markets/{market_id}/orders).
 * API_DOCS: OrderItem has position_id, delta_quantity (positive = buy, negative = sell).
 * Backend requires position_id from GET .../positions; it does not accept asset_id for new positions.
 */
export type OrderItem = { position_id: string; delta_quantity: number };
export type OrdersSubmit = { orders: OrderItem[] };

/**
 * List all markets. No auth.
 * API_DOCS: list_markets_api_markets__get
 */
export async function listMarkets(): Promise<MarketListItem[]> {
    const data = await apiGet<MarketListItem[]>(API_ENDPOINTS.MARKETS, undefined, { auth: false });
    return Array.isArray(data) ? data : [];
}

/**
 * List assets in a market. No auth.
 * API_DOCS: list_market_assets_api_markets__market_id__assets_get
 */
export async function listMarketAssets(marketId: string): Promise<MarketAssetResponse[]> {
    const data = await apiGet<MarketAssetResponse[]>(API_ENDPOINTS.MARKET_ASSETS(marketId), undefined, { auth: false });
    return Array.isArray(data) ? data : [];
}

/**
 * List current user's positions in a market. Auth required.
 * API_DOCS: list_my_positions_api_markets__market_id__positions_get
 */
export async function listMarketPositions(marketId: string): Promise<MarketPositionResponse[]> {
    const data = await apiGet<MarketPositionResponse[]>(API_ENDPOINTS.MARKET_POSITIONS(marketId));
    return Array.isArray(data) ? data : [];
}

/**
 * Submit buy/sell orders for a market. All positions must belong to current user.
 * API_DOCS: submit_orders_api_markets__market_id__orders_post
 * Returns MarketStateResponse (tick_index, last_updated, virtual_liquidity).
 */
export async function submitMarketOrders(
    marketId: string,
    orders: OrderItem[]
): Promise<{ tick_index?: number; last_updated?: string; virtual_liquidity?: number }> {
    return apiPost(API_ENDPOINTS.MARKET_ORDERS(marketId), { orders });
}

export function useMarkets() {
    return useQuery({
        queryKey: marketsKeys.list(),
        queryFn: listMarkets,
    });
}

export function useMarketAssets(marketId: string | null) {
    return useQuery({
        queryKey: marketId != null ? marketsKeys.assets(marketId) : ['markets', 'assets', 'disabled'],
        queryFn: () => listMarketAssets(marketId!),
        enabled: !!marketId,
    });
}

export function useMarketPositions(marketId: string | null) {
    return useQuery({
        queryKey: marketId != null ? marketsKeys.positions(marketId) : ['markets', 'positions', 'disabled'],
        queryFn: () => listMarketPositions(marketId!),
        enabled: !!marketId,
    });
}
