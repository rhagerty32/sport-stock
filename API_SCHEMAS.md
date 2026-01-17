# SportStock API Schemas & Endpoints Documentation

This document provides comprehensive schemas and endpoint specifications for the SportStock backend API. The backend is built with FastAPI on AWS Lambda.

## Base URL

```
https://api.thesportstock.com
```

## Authentication

All endpoints (except public ones) should include an Authorization header with a JWT token provided by AWS Cognito:
```
Authorization: Bearer <jwt_token>
```

The JWT token will be validated using AWS Cognito. The token will contain user claims including the user ID (`sub` or `userId` claim).

**Token Validation:**
- Verify JWT signature using Cognito public keys
- Check token expiration
- Validate issuer matches your Cognito User Pool
- Extract user ID from token claims for user-specific operations

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

The frontend integrates with external APIs. The backend may need to proxy or cache these:

### Polymarket API

Used for prediction markets data. Frontend queries:
- `https://gamma-api.polymarket.com/public-search?q={query}`

**Considerations:**
- Backend may want to cache/proxy these requests
- Frontend uses queries like:
  - League playoff queries (e.g., "nfl playoffs")
  - Division/conference champion queries
  - Championship queries (e.g., "nfl champion")

### Odds API (The Odds API)

Used for game odds. Frontend queries:
- `https://api.the-odds-api.com/v4/sports/{sportKey}/odds?regions=us&markets=h2h,spreads,totals&oddsFormat=american&bookmakers=draftkings&apiKey={key}`

**Considerations:**
- Backend may want to cache/proxy these requests
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

10. **External APIs:** Consider proxying/caching external API calls (Polymarket, Odds API) to:
    - Reduce frontend API key exposure
    - Improve performance
    - Add rate limiting
    - Add error handling/retries
