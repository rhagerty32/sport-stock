# SportStock API Schemas & Endpoints Documentation

**For backend engineer / Cursor:** This document is the single contract for implementing the SportStock backend API. Implement the endpoints and authentication described here so the mobile app can switch from dummy data to live API. The backend is built with FastAPI on AWS Lambda.

---

## Base URL

Use this as the canonical API base (the app overrides via `EXPO_PUBLIC_API_BASE_URL` per environment):

```
https://api.thesportstock.com
```

---

## Authentication (AWS Cognito)

The mobile app will obtain a JWT from **AWS Cognito** (e.g. Hosted UI or Amplify Auth). The backend does not issue tokens; it only validates the token and uses the identity for user-scoped operations.

**Request header (all protected endpoints):**
```
Authorization: Bearer <jwt_token>
```

**Backend validation:**
- Verify JWT signature using Cognito JWKS (e.g. `https://cognito-idp.{region}.amazonaws.com/{userPoolId}/.well-known/jwks.json`)
- Validate `exp` (expiration) and `iss` (issuer must match your Cognito User Pool)
- Optionally validate `aud` or `client_id` if needed
- **User ID:** Extract the user identifier from the token (e.g. `sub` or a custom `userId` claim). Use this for all user-scoped resources (wallet, portfolio, transactions, follows, profile, onboarding). Do not trust `userId` from path or body without verifying it matches the token.

**Public (no auth required):**
- GET /api/leagues, GET /api/leagues/{leagueId}
- GET /api/stocks, GET /api/stocks/{stockId}, GET /api/stocks/{stockId}/price-history
- GET /api/stocks/top-movers, GET /api/stocks/highest-volume, GET /api/stocks/on-the-rise, GET /api/stocks/upset-alert
- GET /api/search
- GET /api/news
- GET /api/games/live
- GET /api/wallet/bonus-info

**Protected (auth required):**
- All wallet endpoints (GET/POST wallet, purchase, history)
- All portfolio endpoints
- All transaction endpoints (GET list, GET by id, POST create)
- All follow endpoints
- All user endpoints (GET/PUT profile, friends)
- All onboarding endpoints (complete, status, reset)

---

## Endpoint quick reference

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | /api/leagues | No | List leagues |
| GET | /api/leagues/{leagueId} | No | Get league (optional includeStocks) |
| GET | /api/stocks | No | List stocks (optional leagueID, search, limit, offset) |
| GET | /api/stocks/{stockId} | No | Get stock |
| GET | /api/stocks/{stockId}/price-history | No | Price history (optional period, limit) |
| GET | /api/stocks/top-movers | No | Top gainers/losers |
| GET | /api/stocks/highest-volume | No | Stocks by volume |
| GET | /api/stocks/on-the-rise | No | Positive movers |
| GET | /api/stocks/upset-alert | No | Negative movers |
| POST | /api/transactions | Yes | Create buy/sell |
| GET | /api/transactions | Yes | List user transactions |
| GET | /api/transactions/{transactionId} | Yes | Get transaction |
| GET | /api/portfolio | Yes | User portfolio |
| GET | /api/portfolio/positions | Yes | User positions |
| GET | /api/portfolio/positions/{stockId} | Yes | Position for one stock |
| POST | /api/follows | Yes | Follow a stock |
| DELETE | /api/follows/{stockId} | Yes | Unfollow |
| GET | /api/follows | Yes | List followed stocks |
| GET | /api/follows/not-owned | Yes | Followed stocks user doesn't own |
| GET | /api/wallet/{userId} | Yes | Wallet balances |
| POST | /api/wallet/purchase | Yes | Purchase fan coins |
| GET | /api/wallet/{userId}/history | Yes | Purchase history |
| GET | /api/wallet/bonus-info | No | Bonus info |
| GET | /api/users/{userId} | Yes | User profile |
| PUT | /api/users/{userId} | Yes | Update profile |
| GET | /api/users/{userId}/friends | Yes | Friends who invested |
| POST | /api/user/onboarding/complete | Yes | Mark onboarding complete |
| GET | /api/user/onboarding/status | Yes | Onboarding completed flag |
| POST | /api/user/onboarding/reset | Yes | Reset onboarding (e.g. dev) |
| GET | /api/search | No | Search stocks/leagues |
| GET | /api/news | No | News items |
| GET | /api/games/live | No | Live games |

---

## Core Data Types

### Stock

Represents a sports team/stock that users can trade.

```python
class Stock(BaseModel):
    id: int
    name: str  # Short name, e.g., "KC Chiefs"
    fullName: str  # Full name, e.g., "Kansas City Chiefs"
    leagueID: int
    photoURL: str
    price: float  # Current price in USD
    about: str  # Description/about text
    ticker: str  # Stock ticker symbol, e.g., "KC"
    coach: str  # Coach name
    founded: int  # Year founded
    topThreePlayers: List[str]  # Array of player names
    volume: int  # Trading volume
    color: str  # Primary hex color
    secondaryColor: str  # Secondary hex color
    createdAt: datetime
    updatedAt: datetime
```

### League

Represents a sports league (NFL, NBA, NCAA Basketball, etc.)

```python
class League(BaseModel):
    id: int
    name: str  # e.g., "NFL", "NBA", "NCAA Basketball"
    marketCap: int  # Total market capitalization
    volume: int  # Total trading volume
    stocks: Optional[List[Stock]] = None  # Stocks in this league (optional, for nested responses)
    photoURL: str
    sport: str  # e.g., "Football", "Basketball"
    createdAt: datetime
    updatedAt: datetime
    playoffQuery: str  # Query string for Polymarket playoff markets
    divisionQuery: Optional[str] = None  # Query string for division champion markets
    conferenceQuery: Optional[str] = None  # Query string for conference champion markets
    championQuery: str  # Query string for championship markets
```

### User

User account information.

```python
class User(BaseModel):
    id: int
    firstName: str
    lastName: str
    email: str
    phoneNumber: str
    birthday: datetime
    photoURL: str
    public: bool  # Whether profile is public
    createdAt: datetime
    updatedAt: datetime
```

### Transaction

Represents a buy or sell transaction.

```python
class Transaction(BaseModel):
    id: int
    action: Literal["buy", "sell"]
    quantity: float  # Number of entries/shares
    price: float  # Price per entry at time of transaction
    totalPrice: float  # quantity * price
    userID: int
    stockID: int
    createdAt: datetime
    updatedAt: datetime
```

### Follow

Represents a user following a stock.

```python
class Follow(BaseModel):
    id: int
    userID: int
    stockID: int
    createdAt: datetime
    updatedAt: datetime
```

### Position

Represents a user's position in a stock (computed/aggregated from transactions).

```python
class Position(BaseModel):
    stock: Stock
    entries: float  # Total number of entries owned
    avgEntryPrice: float  # Average entry price
    currentValue: float  # Current market value (entries * current_price)
    totalGainLoss: float  # Total gain/loss in USD
    gainLossPercentage: float  # Gain/loss percentage
    colors: List[Dict[str, str]]  # Array of {hex: string} objects
```

### Portfolio

User's complete portfolio summary.

```python
class Portfolio(BaseModel):
    totalValue: float  # Total current value of all positions
    totalInvested: float  # Total amount invested
    totalGainLoss: float  # Total gain/loss in USD
    totalGainLossPercentage: float  # Total gain/loss percentage
    positions: List[Position]
```

### PriceHistory

Historical price data for a stock.

```python
class PriceHistory(BaseModel):
    stockID: int
    timestamp: datetime
    price: float
    change: float  # Price change from previous entry
    changePercentage: float  # Percentage change from previous entry
```

### NewsItem

News article related to a stock or league.

```python
class NewsItem(BaseModel):
    id: int
    title: str
    content: str
    source: str
    stockID: Optional[int] = None
    leagueID: Optional[int] = None
    photoURL: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime
```

### LiveGame

Live game information.

```python
class LiveGame(BaseModel):
    id: int
    homeTeam: str
    awayTeam: str
    homeScore: int
    awayScore: int
    status: Literal["live", "upcoming", "completed"]
    startTime: datetime
    league: str
```

### Wallet

User's wallet balances.

```python
class Wallet(BaseModel):
    fanCoins: float  # Gold Coins (GC) - for fun, no real value
    tradingCredits: float  # SportCash (SC) - used for trading
    userId: int
    updatedAt: datetime
```

### FanCoinPurchase

Record of a fan coin purchase.

```python
class FanCoinPurchase(BaseModel):
    id: int
    userId: int
    amount: float  # Amount in USD spent
    fanCoinsReceived: float  # FanCoins purchased (1:1 ratio with amount)
    tradingCreditsGranted: float  # Bonus credits granted (1:1 ratio with amount)
    bonusPercentage: float  # Bonus percentage applied (currently 0)
    paymentMethod: Literal["bank", "paypal", "stripe", "apple_pay", "google_pay"]
    status: Literal["pending", "completed", "failed"]
    createdAt: datetime
    updatedAt: datetime
```

### BonusInfo

Bonus information for purchases (currently all bonuses are 0).

```python
class BonusInfo(BaseModel):
    baseMultiplier: float  # Base bonus percentage (e.g., 1.0 = 100%)
    tierMultipliers: List[Dict[str, float]]  # Array of {min: float, max: float, multiplier: float}
    firstTimeBonus: float  # Additional bonus for first purchase (e.g., 0.2 = 20% extra)
```

---

## API Endpoints

### Stocks

#### GET /api/stocks

Get all stocks with optional filtering.

**Query Parameters:**
- `leagueID` (optional): Filter by league ID
- `search` (optional): Search by name or ticker
- `limit` (optional): Limit number of results
- `offset` (optional): Pagination offset

**Response:**
```python
{
    "stocks": List[Stock],
    "total": int,
    "limit": int,
    "offset": int
}
```

#### GET /api/stocks/{stockId}

Get a single stock by ID.

**Response:**
```python
Stock
```

#### GET /api/stocks/{stockId}/price-history

Get price history for a stock.

**Query Parameters:**
- `period` (optional): Time period - `"1H"`, `"1D"`, `"1W"`, `"1M"`, `"3M"`, `"1Y"`, `"5Y"`, `"ALL"`
- `limit` (optional): Limit number of data points

**Response:**
```python
{
    "stockID": int,
    "history": List[PriceHistory]
}
```

#### GET /api/stocks/top-movers

Get top gainers and losers.

**Query Parameters:**
- `limit` (optional): Number of movers to return (default: 5)

**Response:**
```python
{
    "gainers": List[{
        "stock": Stock,
        "change": float,
        "changePercentage": float
    }],
    "losers": List[{
        "stock": Stock,
        "change": float,
        "changePercentage": float
    }]
}
```

#### GET /api/stocks/highest-volume

Get stocks sorted by volume.

**Query Parameters:**
- `limit` (optional): Number of stocks to return (default: 9)

**Response:**
```python
{
    "stocks": List[Stock]
}
```

#### GET /api/stocks/on-the-rise

Get stocks with positive price movement.

**Query Parameters:**
- `limit` (optional): Number of stocks to return (default: 9)

**Response:**
```python
{
    "stocks": List[{
        "stock": Stock,
        "changePercentage": float
    }]
}
```

#### GET /api/stocks/upset-alert

Get stocks with negative price movement.

**Query Parameters:**
- `limit` (optional): Number of stocks to return (default: 9)

**Response:**
```python
{
    "stocks": List[{
        "stock": Stock,
        "changePercentage": float
    }]
}
```

---

### Leagues

#### GET /api/leagues

Get all leagues.

**Response:**
```python
List[League]
```

#### GET /api/leagues/{leagueId}

Get a single league by ID.

**Query Parameters:**
- `includeStocks` (optional): Include stocks in response (default: false)

**Response:**
```python
League  # With stocks included if includeStocks=true
```

---

### Transactions

#### POST /api/transactions

Create a new transaction (buy or sell).

**Request Body:**
```python
{
    "action": Literal["buy", "sell"],
    "stockID": int,
    "quantity": float,  # Number of entries to buy/sell
    "price": float  # Price per entry (optional, can use current market price)
}
```

**Response:**
```python
Transaction
```

**Notes:**
- For buy: Check user has sufficient `tradingCredits` in wallet
- For sell: Check user has sufficient holdings (entries) in the stock
- Deduct/add credits from wallet accordingly
- Create transaction record
- Update user's position

#### GET /api/transactions

Get transactions for the authenticated user.

**Query Parameters:**
- `stockID` (optional): Filter by stock ID
- `action` (optional): Filter by action (`"buy"` or `"sell"`)
- `limit` (optional): Limit number of results
- `offset` (optional): Pagination offset

**Response:**
```python
{
    "transactions": List[Transaction],
    "total": int,
    "limit": int,
    "offset": int
}
```

#### GET /api/transactions/{transactionId}

Get a single transaction by ID.

**Response:**
```python
Transaction
```

---

### Portfolio

#### GET /api/portfolio

Get the authenticated user's portfolio.

**Response:**
```python
Portfolio
```

#### GET /api/portfolio/positions

Get all positions for the authenticated user.

**Query Parameters:**
- `sortBy` (optional): Sort by `"percentage"` or `"value"` (default: none)
- `limit` (optional): Limit number of results
- `offset` (optional): Pagination offset

**Response:**
```python
{
    "positions": List[Position],
    "total": int
}
```

#### GET /api/portfolio/positions/{stockId}

Get position for a specific stock.

**Response:**
```python
Position  # or null if user doesn't own the stock
```

---

### Follows

#### POST /api/follows

Follow a stock.

**Request Body:**
```python
{
    "stockID": int
}
```

**Response:**
```python
Follow
```

#### DELETE /api/follows/{stockId}

Unfollow a stock.

**Response:**
```python
{
    "success": bool
}
```

#### GET /api/follows

Get all stocks the authenticated user follows.

**Response:**
```python
{
    "follows": List[{
        "stock": Stock,
        "followedAt": datetime
    }]
}
```

#### GET /api/follows/not-owned

Get followed stocks that the user doesn't own.

**Response:**
```python
{
    "stocks": List[Stock]
}
```

---

### Wallet

#### GET /api/wallet/{userId}

Get wallet balances for a user.

**Response:**
```python
Wallet
```

#### POST /api/wallet/purchase

Purchase fan coins (Gold Coins).

**Request Body:**
```python
{
    "userId": int,
    "amount": float,  # Amount in USD to spend
    "paymentMethod": Literal["bank", "paypal", "stripe", "apple_pay", "google_pay"]
}
```

**Response:**
```python
FanCoinPurchase
```

**Notes:**
- Current implementation: 1:1 ratio for both FanCoins and TradingCredits
- No bonuses currently applied
- Update wallet balances after successful purchase
- Create FanCoinPurchase record

#### GET /api/wallet/{userId}/history

Get purchase history for a user.

**Response:**
```python
List[FanCoinPurchase]
```

#### GET /api/wallet/bonus-info

Get bonus information.

**Response:**
```python
BonusInfo
```

---

### Users

#### GET /api/users/{userId}

Get user profile.

**Response:**
```python
User
```

#### PUT /api/users/{userId}

Update user profile.

**Request Body:**
```python
{
    "firstName": Optional[str],
    "lastName": Optional[str],
    "email": Optional[str],
    "phoneNumber": Optional[str],
    "photoURL": Optional[str],
    "public": Optional[bool]
}
```

**Response:**
```python
User
```

#### GET /api/users/{userId}/friends

Get friends who have invested in stocks (for social features).

**Query Parameters:**
- `stockID` (optional): Filter by stock ID

**Response:**
```python
{
    "friends": List[{
        "user": User,
        "position": Position
    }]
}
```

---

### User onboarding

The app persists onboarding completion locally and syncs with the backend when `USE_LIVE_API` is true. User is identified by the authenticated user (from JWT).

#### POST /api/user/onboarding/complete

Mark onboarding as complete for the authenticated user.

**Request Body:** None (or `{}`).

**Response:**
```python
{ "completed": true }
```
Or `204 No Content`.

#### GET /api/user/onboarding/status

Get onboarding completion status for the authenticated user.

**Response:**
```python
{ "completed": bool }
```

#### POST /api/user/onboarding/reset

Reset onboarding status (e.g. for development/testing). Restrict to authenticated user; optionally restrict to dev/admin.

**Response:**
```python
{ "completed": false }
```
Or `204 No Content`.

---

### Search

#### GET /api/search

Search stocks and leagues.

**Query Parameters:**
- `q` (required): Search query string
- `type` (optional): Filter by type - `"stock"`, `"league"`, or `"all"` (default: `"all"`)
- `leagueID` (optional): Filter by league ID

**Response:**
```python
{
    "stocks": List[Stock],
    "leagues": List[League],
    "total": int
}
```

---

### News

#### GET /api/news

Get news items.

**Query Parameters:**
- `stockID` (optional): Filter by stock ID
- `leagueID` (optional): Filter by league ID
- `limit` (optional): Limit number of results
- `offset` (optional): Pagination offset

**Response:**
```python
{
    "news": List[NewsItem],
    "total": int,
    "limit": int,
    "offset": int
}
```

---

### Games

#### GET /api/games/live

Get live games.

**Query Parameters:**
- `league` (optional): Filter by league name

**Response:**
```python
List[LiveGame]
```

---

## External API Integrations

The frontend calls SportStock backend proxies; the server forwards to third parties and injects secrets where needed.

### Polymarket (Gamma)

Used for prediction markets data. Frontend calls (same base as `EXPO_PUBLIC_API_BASE_URL`):
- `GET /api/polymarket/search?q={query}` — proxy to Gamma `GET /public-search`; forwards query parameters.

**Considerations:**
- Backend may cache responses
- Frontend uses queries like:
  - League playoff queries (e.g., "nfl playoffs")
  - Division/conference champion queries
  - Championship queries (e.g., "nfl champion")

### Odds API (The Odds API v4)

Used for game odds. Frontend calls:
- `GET /api/odds/v4/sports/{sportKey}/odds?regions=us&markets=h2h,spreads,totals&oddsFormat=american&bookmakers=draftkings` — pass-through to upstream v4 after `/v4/`; server injects `apiKey`.

**Considerations:**
- Backend may cache responses
- Frontend maps team names and sport keys

---

## Data Relationships

### Stock → League
- Many-to-One: Each stock belongs to one league (`stock.leagueID`)

### User → Transaction
- One-to-Many: Each user can have many transactions (`transaction.userID`)

### Stock → Transaction
- One-to-Many: Each stock can have many transactions (`transaction.stockID`)

### User → Follow
- One-to-Many: Each user can follow many stocks (`follow.userID`)

### Stock → Follow
- One-to-Many: Each stock can be followed by many users (`follow.stockID`)

### User → Position (Computed)
- One-to-Many: Each user can have positions in many stocks
- Computed from transactions: aggregate all buy/sell transactions per stock

### Stock → PriceHistory
- One-to-Many: Each stock has many price history entries (`priceHistory.stockID`)

---

## Business Logic Notes

### Trading Logic

1. **Buy Transaction:**
   - Check user has sufficient `tradingCredits` in wallet
   - Calculate `totalPrice = quantity * price`
   - Deduct `totalPrice` from `wallet.tradingCredits`
   - Create transaction record
   - Update user's position (add entries, recalculate avgEntryPrice)

2. **Sell Transaction:**
   - Check user has sufficient entries in the stock
   - Calculate `totalPrice = quantity * price`
   - Add `totalPrice` to `wallet.tradingCredits`
   - Create transaction record
   - Update user's position (subtract entries, recalculate avgEntryPrice)

3. **Position Calculation:**
   - Aggregate all transactions for a user/stock pair
   - Calculate `entries`: Sum of buy quantities minus sum of sell quantities
   - Calculate `avgEntryPrice`: Weighted average of buy prices
   - Calculate `currentValue`: `entries * stock.currentPrice`
   - Calculate `totalGainLoss`: `currentValue - (entries * avgEntryPrice)`
   - Calculate `gainLossPercentage`: `(totalGainLoss / (entries * avgEntryPrice)) * 100`

### Wallet Logic

1. **Fan Coin Purchase:**
   - User spends USD amount
   - Receive `amount` FanCoins (1:1 ratio)
   - Receive `amount` TradingCredits (1:1 ratio)
   - Currently no bonuses applied
   - Create `FanCoinPurchase` record

2. **Trading Credits:**
   - Used for buying stocks
   - Earned from selling stocks
   - Earned from purchasing Fan Coins

---

## Error Responses

All endpoints should return consistent error responses:

```python
{
    "error": {
        "code": str,  # Error code (e.g., "INSUFFICIENT_CREDITS", "STOCK_NOT_FOUND")
        "message": str,  # Human-readable error message
        "details": Optional[Dict]  # Additional error details
    }
}
```

### Common Error Codes

- `INSUFFICIENT_CREDITS`: User doesn't have enough trading credits
- `INSUFFICIENT_HOLDINGS`: User doesn't have enough entries to sell
- `STOCK_NOT_FOUND`: Stock ID doesn't exist
- `LEAGUE_NOT_FOUND`: League ID doesn't exist
- `USER_NOT_FOUND`: User ID doesn't exist
- `UNAUTHORIZED`: Missing or invalid authentication token
- `VALIDATION_ERROR`: Request body validation failed
- `INTERNAL_ERROR`: Server error

---

## Date/Time Format

All datetime fields should be returned in ISO 8601 format:
```
2024-01-15T10:30:00Z
```

---

## Pagination

Endpoints that support pagination should use `limit` and `offset` query parameters:

- `limit`: Number of items per page (default: 20, max: 100)
- `offset`: Number of items to skip (default: 0)

Response should include pagination metadata:
```python
{
    "data": List[...],
    "total": int,  # Total number of items
    "limit": int,
    "offset": int,
    "hasMore": bool  # Whether there are more items
}
```

---

## Rate Limiting

Consider implementing rate limiting:
- Public endpoints: 100 requests/minute per IP
- Authenticated endpoints: 1000 requests/minute per user

---

## App wiring checklist

To wire the mobile app to real data, the backend must support:

- **Cognito JWT** in `Authorization: Bearer <token>` for all protected endpoints; validate token and derive user ID from claims (e.g. `sub` or `userId`).
- **User-scoped data:** Wallet, portfolio, transactions, follows, user profile, and onboarding status are keyed by the authenticated user ID from the token.
- **Onboarding:** Persist and return onboarding completion per user via POST complete, GET status, and optionally POST reset.
- **State restrictions:** The app restricts usage by state (see `lib/state-restrictions.ts`). Backend may need to validate or store user state for compliance (e.g. from IP or profile); no additional endpoints are required unless you add a dedicated compliance endpoint later.

---

## Notes for Backend Developer

1. **Price Updates:** Stock prices should be updated regularly (consider real-time or periodic updates based on trading activity)

2. **Price History:** Maintain historical price data for charts. Consider storing snapshots at regular intervals (e.g., every hour, or on every transaction)

3. **Position Calculation:** Positions are computed from transactions. Consider caching positions for performance, but ensure they're recalculated when transactions occur

4. **Wallet Balances:** Ensure atomic operations when updating wallet balances during purchases and trades

5. **Transaction Validation:** Validate all transactions before processing (check balances, stock existence, etc.)

6. **Search:** Implement full-text search for stocks (name, ticker, league)

7. **Caching:** Consider caching frequently accessed data:
   - Stock lists
   - League data
   - Price history (with TTL)
   - Portfolio data (invalidate on transaction)

8. **Real-time Updates:** Consider WebSocket support for:
   - Real-time price updates
   - Live game scores
   - Portfolio value changes

9. **State Restrictions:** The app has state restrictions logic (see `lib/state-restrictions.ts`). Backend should validate user location for compliance

10. **External APIs:** The app uses backend proxies for Polymarket and The Odds API (`/api/polymarket/search`, `/api/odds/v4/...`). Backend should cache/rate-limit as needed.
