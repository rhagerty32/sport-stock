# SportStock - Product Requirements Document

## Executive Summary

SportStock is a mobile investment platform that allows users to invest in professional sports teams. The app provides a Robinhood-style experience with real-time pricing, portfolio management, and social features, all wrapped in a premium Apple-designed aesthetic with liquid glass UI elements.

---

## Product Overview

### Vision
Create the most intuitive and visually stunning platform for sports team investments, combining the simplicity of Robinhood with the polish of Apple's native apps.

### Target Audience
- Sports enthusiasts aged 18-45
- Casual to experienced investors
- Users comfortable with mobile-first financial applications

### Success Metrics
- Daily Active Users (DAU)
- Portfolio value growth
- Transaction volume
- Average session duration
- User retention rate

---

## Technical Stack

### Framework & Architecture
- **Framework**: Expo SDK 54+ with React Native
- **Router**: Expo Router v6 with Native Tabs (experimental)
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **UI Components**: 
  - @expo/ui (Expo UI with SwiftUI for liquid glass effects)
  - NativeTabs from expo-router/unstable-native-tabs (for tab bar)
  - @gorhom/bottom-sheet for modals
  - Reanimated 3 for animations
  - React Native Gesture Handler

### Native Liquid Glass Implementation (CRITICAL)

**Approach**: Use **Expo UI** (`@expo/ui/swift-ui`) - Expo's built-in SwiftUI integration available in SDK 54+.

**Official Documentation**: 
- [Expo UI and SwiftUI Guide](https://docs.expo.dev/guides/expo-ui-swift-ui/)
- [Expo Router - Native Tabs](https://docs.expo.dev/router/advanced/native-tabs/)

**Additional References**: 
- [Expo Blog - Liquid Glass App with Expo UI and SwiftUI](https://expo.dev/blog/liquid-glass-app-with-expo-ui-and-swiftui)
- [YouTube Tutorial - Liquid Glass Tabs](https://youtu.be/2wXYLWz3YEQ)
- [YouTube Tutorial Video](https://youtu.be/vMumCKJlU4M)

Expo UI brings **actual SwiftUI primitives** directly to React Native with 1-to-1 mapping. No custom native modules needed!

**Installation**:
```bash
npx expo install @expo/ui
```

**Key Concepts**:
- **`<Host>` component**: Container for SwiftUI views (like `<svg>` in DOM or `<Canvas>` in Skia)
- **SwiftUI Components**: `VStack`, `HStack`, `Text`, `Image`, `Form`, `Section`, `Button`, etc.
- **Modifiers**: SwiftUI modifiers for styling (import from `@expo/ui/swift-ui/modifiers`)
- **Liquid Glass**: Use `glassEffect` modifier (requires iOS 18+, Xcode 16+)

**Available SwiftUI Components**:
- Layout: `VStack`, `HStack`, `ZStack`, `Spacer`, `ScrollView`
- Text & Images: `Text`, `Image` (with SF Symbols support)
- Forms: `Form`, `Section`, `Toggle`, `Switch`, `Button`
- Progress: `CircularProgress`, `LinearProgress`
- And many more with 1-to-1 SwiftUI mapping

**Liquid Glass Example**:
```tsx
import { Host, VStack, Text } from '@expo/ui/swift-ui';
import { glassEffect, padding, background } from '@expo/ui/swift-ui/modifiers';

export default function GlassCard() {
  return (
    <Host style={{ flex: 1 }}>
      <VStack 
        spacing={16}
        modifiers={[
          padding({ all: 20 }),
          background('.regularMaterial'),
          glassEffect({ 
            glass: { variant: 'clear' }
          })
        ]}
      >
        <Text size={24}>Portfolio Value</Text>
        <Text size={48}>$1,996.19</Text>
      </VStack>
    </Host>
  );
}
```

**Material Types (via modifiers)**:
- `.ultraThinMaterial` - Very subtle glass
- `.thinMaterial` - Light glass (recommended for cards)
- `.regularMaterial` - Standard glass (recommended for tab bars)
- `.thickMaterial` - Strong glass
- `.ultraThickMaterial` - Heaviest glass
- Plus `glassEffect` modifier for liquid glass

**Benefits**:
- ✅ Actual Apple SwiftUI components, not simulations
- ✅ No custom native module development needed
- ✅ 1-to-1 SwiftUI mapping - explore any SwiftUI docs
- ✅ Automatic light/dark mode adaptation
- ✅ Full SwiftUI modifier system
- ✅ Can mix with React Native components
- ✅ True iOS design language and performance

**DO NOT**:
- ❌ Use expo-blur (limited, not truly native)
- ❌ Use `backgroundColor` with opacity to fake glass
- ❌ Use CSS backdrop-filter (not available in RN)
- ❌ Create custom blur implementations
- ❌ Use shadow/gradient tricks to simulate glass

**Required**:
- Expo SDK 54+ 
- iOS 18+ and Xcode 16+ for `glassEffect` modifier and Native Tabs liquid glass
- iOS 15+ for basic SwiftUI materials
- Note: Native Tabs is experimental and API may change

### Design System
- **Color Palette**:
  - Primary Green: `#217C0A`
  - Success Green (variations): `#1a6408`, `#2d9410`
  - Error Red: `#dc2626`
  - Background Light: `#FFFFFF`, `#F9FAFB`
  - Background Dark: `#000000`, `#1C1C1E`
  - Surface Light: `#FFFFFF` with blur
  - Surface Dark: `#2C2C2E` with blur
  - Text Light: `#000000`, `#6B7280`
  - Text Dark: `#FFFFFF`, `#9CA3AF`

- **Typography**:
  - Primary Font: SF Pro (iOS native)
  - Font Weights: 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)
  - Scale: 12px, 14px, 16px, 20px, 24px, 32px, 48px

- **Spacing**: 4px base unit (4, 8, 12, 16, 24, 32, 48, 64)

- **Border Radius**: 
  - Small: 8px
  - Medium: 12px
  - Large: 16px
  - XLarge: 24px

---

## Data Models

### Core Entities

```typescript
type Stock = {
    id: number;
    name: string;
    leagueID: number;
    photoURL: string;
    price: number;
    volume: number;
    createdAt: Date;
    updatedAt: Date;
}

type League = {
    id: number;
    name: string;
    marketCap: number;
    volume: number;
    stocks?: Stock[];
    photoURL: string;
    sport: string;
    createdAt: Date;
    updatedAt: Date;
}

type User = {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    birthday: Date;
    photoURL: string;
    createdAt: Date;
    updatedAt: Date;
}

type Transaction = {
    id: number;
    action: 'buy' | 'sell';
    quantity: number;
    price: number;
    totalPrice: number;
    userID: number;
    stockID: number;
    createdAt: Date;
    updatedAt: Date;
}

type Follow = {
    id: number;
    userID: number;
    stockID: number;
    createdAt: Date;
    updatedAt: Date;
}

type Movement = {
    id: number;
    type: 'deposit' | 'withdrawal';
    userID: number;
    amount: number;
    source: 'user' | 'system';
    destination: 'user' | 'system';
    paymentMethod: 'bank' | 'paypal' | 'stripe';
    createdAt: Date;
    updatedAt: Date;
}

type Color = {
    id: number;
    stockID: string | null;
    leagueID: string | null;
    hex: string;
    createdAt: Date;
    updatedAt: Date;
}
```

### Computed Properties

```typescript
type Portfolio = {
    totalValue: number;
    totalInvested: number;
    totalGainLoss: number;
    totalGainLossPercentage: number;
    positions: Position[];
}

type Position = {
    stock: Stock;
    shares: number;
    avgCostPerShare: number;
    currentValue: number;
    totalGainLoss: number;
    gainLossPercentage: number;
    colors: Color[];
}

type PriceHistory = {
    stockID: number;
    timestamp: Date;
    price: number;
    change: number;
    changePercentage: number;
}
```

---

## Feature Specifications

**⚠️ IMPORTANT**: Throughout all features, any reference to "glass", "blur", "liquid glass", or similar effects means using **Expo UI** (`@expo/ui/swift-ui`) with SwiftUI components and the `glassEffect` modifier. Do NOT use expo-blur, CSS effects, or opacity tricks. All glass surfaces must use Expo UI's `<Host>` component with SwiftUI views and modifiers.

---

### 1. Navigation Structure

#### Bottom Tab Bar (Native Tabs with Liquid Glass)
- **Home** - Portfolio overview, account value, news feed
- **Search** - Browse teams by league, search functionality
- **Investing** - Active positions and portfolio analytics
- **Profile** - User profile, settings, account management

**Implementation**: Use Expo Router's `NativeTabs` (experimental, SDK 54+)

**Reference**: [Expo Router - Native Tabs](https://docs.expo.dev/router/advanced/native-tabs/)

**Design Requirements**:
- Use `<NativeTabs>` from `expo-router/unstable-native-tabs`
- Native iOS UITabBar with automatic liquid glass effect
- Tab icons with SF Symbols via `<Icon sf="..." />`
- Smooth haptic feedback on tab change
- Active tab indicator with green accent (via `tintColor` prop)
- Auto-adapts to light/dark mode (native behavior)
- Maintains visibility over scrolled content
- Proper safe area insets (handled by native tab bar)

**Example Implementation**:
```tsx
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { DynamicColorIOS } from 'react-native';

export default function TabLayout() {
  return (
    <NativeTabs
      tintColor={DynamicColorIOS({ dark: '#217C0A', light: '#217C0A' })}
      labelStyle={{
        color: DynamicColorIOS({ dark: 'white', light: 'black' }),
      }}
    >
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'chart.line.uptrend.xyaxis', selected: 'chart.line.uptrend.xyaxis.fill' }} />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      
      <NativeTabs.Trigger name="search">
        <Icon sf={{ default: 'magnifyingglass', selected: 'magnifyingglass' }} />
        <Label>Search</Label>
      </NativeTabs.Trigger>
      
      <NativeTabs.Trigger name="investing">
        <Icon sf={{ default: 'briefcase', selected: 'briefcase.fill' }} />
        <Label>Investing</Label>
      </NativeTabs.Trigger>
      
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: 'person', selected: 'person.fill' }} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
```

**Benefits**:
- ✅ Native UITabBar with built-in liquid glass on iOS
- ✅ SF Symbols support out of the box
- ✅ No custom styling needed for glass effect
- ✅ Native scrolling behavior and interactions
- ✅ Automatic iPad/Vision Pro adaptation

---

### 2. Home Screen

#### Header
- **Logo**: "SportStock" in green (#217C0A)
- **Balance Display**: Current buying power (e.g., "$120.00")

#### Portfolio Summary Card (Expo UI with Glass Effect)
- **Card Container**: Expo UI `<Host>` with `<VStack>` and glass modifiers
  - Use `background('.thinMaterial')` and `glassEffect` modifiers
- **Total Value**: Large, prominent display (48px font) - `<Text size={48}>`
- **Today's Change**: Green/Red with percentage - `<Text color="green">`
- **Time Period Label**: "Today"
- **Portfolio Chart**: Line chart showing value over time
  - Mix React Native chart library with Expo UI layout
  - Interactive touch/drag for different time periods
  - Smooth animations between timeframes
- **Time Period Selector**: 1D, 1W, 1M, 1Y, ALL
  - Use `<HStack>` with `<Button>` components
  - Selected period underlined
  - Smooth sliding indicator

**Animations**:
- Parallax scroll effect on portfolio card
- Fade-in animations for cards as they enter viewport
- Smooth number counting animations for value changes
- Haptic feedback on interactions

**Empty State**:
- Illustration of charts and sports equipment
- "Start Your Sports Portfolio"
- "Browse teams and make your first investment" subtitle
- CTA button: "Explore Teams"

---

### 3. Search/Browse Screen

#### Search Bar
- Prominent at top with blur effect
- Placeholder: "Search teams, leagues..."
- Magnifying glass icon
- Clear button when typing
- Results appear with smooth slide-down animation

#### League Filter Pills
- Horizontal scrollable pills
- "All", "NFL", "NBA", "MLB", "NHL", "MLS", "Premier League", etc.
- Active pill has green background
- Smooth morphing animation on selection

#### Team List/Grid
- Organized by league
- Each item shows:
  - Team logo (large, circular)
  - Team name
  - Current price
  - Price change (green/red)
  - Small sparkline chart
  - Brand colors as subtle gradient background

**Grid View** (Default):
- 2 columns
- Card format using Expo UI glass effects

**List View** (Toggle):
- Single column
- More detailed info (volume, market cap)
- Cards also use Expo UI glass effects

#### Search Results
- Real-time filtering as user types
- Shows matching teams and leagues
- Highlighted matched text
- Recent searches saved locally

**Animations**:
- Staggered fade-in for list items
- Smooth filter transitions
- Shared element transition to team detail page

**Empty State**:
- "No teams found"
- Suggestions based on popular teams
- Clear search button

---

### 4. Team Detail Screen

#### Header
- **Back Button**: Left side with haptic feedback
- **Team Name**: "SportStock" logo (centered, smaller)
- **Balance**: Current buying power (right)
- **Share/Follow Icons**: Top right

#### Team Info Section
- **Large Team Logo**: Circular, centered
- **Team Name**: Bold, 24px
- **Current Price**: Prominent pill button (can tap to see price history)
- **Price Change**: Percentage with up/down indicator

#### Price Chart
- Large, interactive chart
- Uses team's brand colors
- Touch and drag to see historical prices
- Smooth animations when changing timeframes
- Time period selector: 1D, 1W, 1M, 1Y, ALL

#### Action Buttons (Expo UI Buttons)
- **Buy/Short**: Expo UI `<Button>` with green styling and glass background
- **Sell**: Expo UI `<Button>` with gray styling and glass background
- Full width with rounded corners via modifiers
- Haptic feedback on press
- Disabled state if no positions (Sell button)
- Use SwiftUI button modifiers for styling

#### About Section (Collapsible)
- League information
- Market cap
- 24h volume
- Expandable with smooth animation


**Animations**:
- Hero animation from search/home
- Parallax on team logo
- Chart animations
- Smooth button press animations
- Page curl transition for news articles

**Empty State** (News):
- "No recent news"
- "Check back later for updates"

---

### 5. Buy/Sell Bottom Sheet

#### Sheet Configuration
- Uses @gorhom/bottom-sheet
- Snap points: [40%, 90%]
- Background: Expo UI `<Host>` with glass effect modifiers in `backgroundComponent`
- Apply `.thickMaterial` background and `glassEffect` modifiers
- Smooth spring animation
- Can drag to dismiss
- Content uses Expo UI SwiftUI components for native feel

#### Content
- **Title**: "Buy [Team Name]" or "Sell [Team Name]"
- **Subtitle**: "One-Time Order"
- **Order Type Dropdown**: 
  - "Change Order Type" with chevron
  - Options: One-Time, Recurring
  - Green text (#217C0A)

#### Amount Selection
- **Quick Amount Buttons**:
  - Grid layout: $1, $10, $20, $50, $100, "..."
  - Rounded corners, subtle shadow
  - Active state with green border
  - Haptic feedback on selection

- **Custom Amount Input**:
  - Large currency display at top
  - Custom numeric keypad
  - Real-time share calculation
  - Shows: "You'll get approximately X.XX shares"

#### Order Summary
- Estimated shares/amount
- Current price per share
- Total cost
- Available buying power (for buy orders)
- Current position (for sell orders)

#### Action Button
- **Buy**: Large green button with "Add" or "Review Order"
- **Sell**: Large red button with "Review Order"
- Disabled state if insufficient funds/shares
- Loading state during processing

#### Confirmation Sheet (Second Sheet)
- Summary of order
- Final confirm button
- Swipe down to cancel

**Animations**:
- Spring animation on sheet appearance
- Number animations for calculations
- Confetti animation on successful order
- Haptic success feedback

---

### 6. Investing/Portfolio Screen

#### Header
- Portfolio value (large)
- Today's change
- Time period chart

#### My Positions Card (Expo UI with Glass)
- **Card Container**: Expo UI `<Host>` with `<VStack>` and `.thinMaterial` background
- **Invested**: Total amount invested - `<Text>`
- **Gain/Loss**: Colored green/red - `<Text color="green">` or `<Text color="red">`
- **Total Value $**: Current portfolio value
- **Total Gain %**: Percentage return
- **Shares Owned**: Total shares across all positions
- **Avg Cost Per Share**: Weighted average
- **Current Share Price**: (if single position view)

#### Positions List
- Sortable by:
  - Value (default)
  - Gain/Loss %
  - Alphabetical
  
- Each position shows:
  - Team logo with colored border (using team colors)
  - Team name
  - Number of shares
  - Current value
  - Gain/Loss percentage (colored)
  - Small sparkline

- Tap to view team detail page

#### Performance Chart
- Portfolio value over time
- Color-coded by position
- Stacked area chart option
- Interactive tooltips

#### Filters & Actions
- Filter by league
- Filter by gain/loss
- Export portfolio button
- Share portfolio button (screenshot with blurred sensitive data)

**Animations**:
- Smooth list animations
- Number counting animations
- Chart animations
- Pull-to-refresh with custom indicator

**Empty State**:
- Illustration of empty portfolio
- "Start Investing"
- "Browse teams and make your first investment"
- CTA: "Explore Teams"

---

### 7. Profile Screen

#### Profile Header
- Large circular profile photo
- User name (large, bold)
- Account type badge (if applicable)
- Settings icon (top right)
- Cash balance indicator

#### My Holdings Visual
- Grid of circular team logos
- Each shows:
  - Team logo
  - Gain/Loss percentage
  - Colored border (green for gains, red for losses)
  - Color intensity based on performance
- Max 6 visible, "See all" button if more

#### Account Metrics (Cards with Expo UI Glass)
- **Total Gains**: Dollar amount
- **Current Gains**: Dollar amount  
- **Current % Gain**: Percentage
- All prominently displayed in card format using Expo UI `<Host>` with glass modifiers

#### Account Actions
- Deposit
- Withdraw  
- Transfer
- Statements

#### Settings Sections
- **Account**
  - Personal Information
  - Linked Accounts
  - Tax Documents
  
- **Security**
  - Change Password
  - Two-Factor Authentication
  - Biometric Login
  
- **Notifications**
  - Push Notifications
  - Email Preferences
  - Price Alerts
  
- **Appearance**
  - Light/Dark Mode toggle
  - Haptics toggle
  
- **Help & Support**
  - Help Center
  - Contact Support
  - Terms of Service
  - Privacy Policy

**Animations**:
- Profile photo zoom on tap (view full screen)
- Holdings grid stagger animation
- Smooth transitions to setting pages

---

### 8. Deposit/Withdraw Flow

#### Deposit Screen
- Clean, minimal design
- **Header**: "Add Cash" with close button (X)
- **Large Amount Display**: "$0" in green, centered
- **Custom Number Pad**:
  - Numbers 1-9, 0
  - Decimal point
  - Backspace
  - Clean, large tap targets
  - Haptic feedback
  
- **Payment Method Selector**:
  - List of linked payment methods
  - Add new payment method option
  - Shows last 4 digits, icon
  
- **Action Button**: 
  - "Add" button at bottom
  - Green (#217C0A)
  - Disabled if $0
  - Shows processing state

#### Confirmation
- Success animation (checkmark)
- "Cash Added Successfully"
- Updated balance display
- Auto-dismiss after 2 seconds

**Withdraw** follows same pattern with red accent for destructive action

**Animations**:
- Slide-up modal transition
- Number pad with spring animation
- Success checkmark with scale animation
- Haptic success feedback

---

### 9. Notifications & Alerts

#### Price Alerts
- User-set price targets
- Push notifications when reached
- In-app notification center

#### Portfolio Updates
- Daily/weekly summary
- Significant changes alert
- Market open/close notifications

#### News Alerts
- Breaking news for followed teams
- Major trades/roster changes
- League updates

#### Transaction Confirmations
- Order filled notifications
- Deposit/withdrawal confirmations

---

### 10. Theme System (Light & Dark Mode)

#### Implementation
- System-based default
- Manual override in settings
- Smooth transition animation between modes
- All components theme-aware

#### Light Mode
- Backgrounds: White, Light Gray (#F9FAFB)
- Text: Black, Dark Gray (#374151)
- Surfaces: Expo UI with SwiftUI materials (`.thinMaterial`, `.regularMaterial`)
- Glass Effect: Automatically adapts to light appearance via SwiftUI

#### Dark Mode
- Backgrounds: Pure Black (#000000), Dark Gray (#1C1C1E)
- Text: White, Light Gray (#E5E7EB)
- Surfaces: Expo UI with SwiftUI materials (automatically adapt to dark)
- Glass Effect: Automatically adapts to dark appearance via SwiftUI

**IMPORTANT**: All glass/blur surfaces MUST use Expo UI (`@expo/ui/swift-ui`) with `<Host>` components and SwiftUI modifiers. The SwiftUI system will automatically handle light/dark mode transitions. Do NOT use expo-blur, opacity tricks, or CSS backdrop-filter.

#### Color Consistency
- Green accent (#217C0A) works in both modes
- Charts adapt opacity for visibility
- Team colors remain vibrant in both modes

---

## Animation & Interaction Specifications

### Micro-Interactions
1. **Button Press**: Scale down to 0.96, bounce back
2. **Tab Switch**: Cross-fade icons, slide indicator
3. **Pull-to-Refresh**: Custom sport-themed loader
4. **Number Changes**: Counting animation with easing
5. **Success Actions**: Confetti or checkmark animation
6. **Loading States**: Skeleton screens with shimmer

### Page Transitions
1. **Push/Pop**: iOS native slide transition
2. **Modal Present**: Spring animation from bottom
3. **Hero Transitions**: Shared element between screens
4. **Tab Switch**: Quick fade, no slide

### Chart Animations
1. **Initial Load**: Draw line from left to right
2. **Data Update**: Morph between values
3. **Time Period Change**: Fade out/in with data update
4. **Touch Interaction**: Crosshair appears, value tooltip

### List Animations
1. **Scroll**: Subtle parallax on cards
2. **Item Appear**: Stagger fade-in from bottom
3. **Item Delete**: Swipe with spring animation
4. **Pull-to-Refresh**: Custom rubber band effect

---

## Haptic Feedback Patterns

- **Light Impact**: Tab switches, button taps
- **Medium Impact**: Confirmation actions, sheet snaps
- **Heavy Impact**: Destructive actions, alerts
- **Success**: Order completed, deposit successful
- **Warning**: Insufficient funds, validation errors
- **Error**: Failed transactions, network errors
- **Selection**: Scrolling through picker, slider adjustments

---

## Empty States

### Portfolio Empty State
- Illustration: Charts with sports elements
- Headline: "Start Your Sports Portfolio"
- Subtext: "Browse teams and make your first investment"
- CTA: "Explore Teams" button

### Search No Results
- Illustration: Magnifying glass
- Headline: "No Teams Found"
- Subtext: "Try searching for a different team or league"
- Suggestions: Show popular teams

### News Feed Empty
- Illustration: Newspaper
- Headline: "No Recent News"
- Subtext: "Check back later for updates"

### Positions Empty
- Illustration: Empty portfolio
- Headline: "No Positions Yet"
- Subtext: "Start investing to see your holdings here"
- CTA: "Browse Teams"

### Watchlist Empty
- Illustration: Star/bookmark
- Headline: "No Teams Followed"
- Subtext: "Follow teams to track them here"
- CTA: "Find Teams"

---

## Error Handling

### Network Errors
- Toast notification at top
- Retry button
- Cached data shown when possible
- "Tap to retry" on failed requests

### Insufficient Funds
- Warning in bottom sheet
- Suggested deposit amount
- Quick deposit CTA
- Clear messaging

### Failed Orders
- Alert modal with reason
- Support contact option
- Order retry if applicable

### Server Errors
- User-friendly error messages
- Error code for support (hidden in debug)
- Fallback UI where possible

---

## Performance Requirements

### App Launch
- Cold start: < 2 seconds
- Warm start: < 1 second
- Splash screen with brand logo

### Navigation
- 60 FPS animations
- Instant tab switches
- < 300ms page transitions

### Data Loading
- Skeleton screens during load
- Optimistic updates for user actions
- Background refresh for real-time data
- Maximum 3 seconds for initial data load

### Memory Management
- Efficient image loading and caching
- List virtualization for long lists
- Cleanup on unmount
- Target: < 150MB memory usage

---

## Accessibility

### Screen Reader Support
- All interactive elements labeled
- Descriptive button labels
- Value announcements for changes
- Navigation hints

### Color Contrast
- WCAG AA compliance minimum
- Alternative indicators beyond color
- High contrast mode support

### Font Scaling
- Support dynamic type
- Layout adapts to larger text
- Minimum 12sp font size

### Touch Targets
- Minimum 44x44pt tap targets
- Adequate spacing between elements
- No precision gestures required

---

## Security & Privacy

### Data Handling
- No authentication for MVP (using dummy data)
- Local storage for preferences only
- Encrypted storage for sensitive data (future)

### Future Authentication
- Biometric login (Face ID/Touch ID)
- 2FA support
- Session management
- Secure token storage

---

## Development Phases

### Phase 1: MVP Core (Current Focus)
- [ ] Project setup with Expo SDK 54+
- [ ] Install and configure @expo/ui package
- [ ] Setup Expo Router with Native Tabs layout
  - [ ] Configure `_layout.tsx` with `<NativeTabs>`
  - [ ] Add SF Symbols icons for each tab
  - [ ] Configure green tint color for selected state
- [ ] Create reusable glass card components using Expo UI
  - [ ] GlassCard wrapper component (VStack with glass modifiers)
  - [ ] GlassSheet component for bottom sheets
- [ ] Theme system (Light/Dark mode - SwiftUI handles auto-adaptation)
- [ ] Dummy data generation (comprehensive mock data)
- [ ] Home screen with portfolio summary (Expo UI glass cards)
- [ ] Search/Browse teams (Expo UI glass cards)
- [ ] Team detail page with glass effects
- [ ] Buy/Sell bottom sheet with Expo UI glass (UI only, no real transactions)
- [ ] Portfolio/Investing screen with glass cards
- [ ] Profile screen (basic) with glass cards
- [ ] Chart components (mix with Expo UI layouts)

### Phase 2: Enhanced Experience
- [ ] News feed integration
- [ ] Social feed (X, Instagram)
- [ ] Live game scores
- [ ] Price alerts
- [ ] Notifications
- [ ] Watchlist/Following
- [ ] Advanced charts and analytics
- [ ] Share portfolio feature
- [ ] Deposit/Withdraw UI

### Phase 3: Real Data & Transactions
- [ ] API integration
- [ ] Authentication system
- [ ] Real payment processing
- [ ] Transaction history
- [ ] Tax documents
- [ ] Real-time price updates via WebSocket
- [ ] Backend infrastructure

### Phase 4: Polish & Scale
- [ ] Performance optimization
- [ ] Advanced animations
- [ ] Onboarding flow
- [ ] Push notifications
- [ ] Deep linking
- [ ] Analytics integration
- [ ] A/B testing framework
- [ ] Beta testing program

---

## File Structure

```
SportStock/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx            # Native tabs layout with liquid glass
│   │   ├── index.tsx              # Home screen
│   │   ├── search.tsx             # Search/Browse
│   │   ├── investing.tsx          # Portfolio
│   │   └── profile.tsx            # Profile
│   ├── team/
│   │   └── [id].tsx               # Team detail (outside tabs)
│   ├── _layout.tsx                # Root layout
│   └── +not-found.tsx             # 404 page
├── components/
│   ├── ui/
│   │   ├── GlassCard.tsx          # Expo UI glass card wrapper
│   │   ├── GlassSheet.tsx         # Expo UI glass sheet background
│   │   ├── GlassButton.tsx        # Expo UI button with glass effect
│   │   └── ...
│   ├── charts/
│   │   ├── PortfolioChart.tsx
│   │   ├── SparklineChart.tsx
│   │   └── PriceChart.tsx
│   ├── sheets/
│   │   ├── BuySheet.tsx
│   │   ├── SellSheet.tsx
│   │   └── DepositSheet.tsx
│   ├── portfolio/
│   │   ├── PositionCard.tsx
│   │   ├── PortfolioHeader.tsx
│   │   └── MyInvestmentsCard.tsx
│   ├── team/
│   │   ├── TeamCard.tsx
│   │   ├── TeamHeader.tsx
│   │   └── TeamNewsCard.tsx
│   ├── home/
│   │   ├── LiveGameCard.tsx
│   │   ├── NewsCard.tsx
│   │   └── PortfolioSummary.tsx
│   └── EmptyState.tsx
├── hooks/
│   ├── useTheme.ts
│   ├── usePortfolio.ts
│   ├── useStockPrice.ts
│   └── useHaptics.ts
├── store/
│   ├── portfolioStore.ts          # Zustand store
│   ├── userStore.ts
│   └── themeStore.ts
├── api/
│   ├── queries/
│   │   ├── useStocks.ts           # TanStack Query
│   │   ├── usePortfolio.ts
│   │   └── useNews.ts
│   └── client.ts
├── lib/
│   ├── dummy-data.ts              # Mock data generator
│   ├── utils.ts
│   └── constants.ts
├── theme/
│   ├── colors.ts
│   ├── typography.ts
│   └── spacing.ts
├── types.ts                       # Type definitions
└── assets/
    ├── images/
    └── animations/
```

---

## Dummy Data Requirements

### Teams
- Minimum 30 teams across leagues
- NFL: 10 teams
- NBA: 10 teams
- MLB: 5 teams
- NHL: 5 teams

### User Portfolio
- 5-8 active positions
- Mix of gains and losses
- Various position sizes
- Recent transaction history

### News Items
- 20+ news articles
- Mix of sources (X, Instagram, official)
- Various timestamps
- Team-specific and league-wide

### Price History
- 1 year of daily data per team
- Realistic price movements
- Volume data
- Support all chart timeframes

### Live Games
- 5-10 games with varying statuses
- Live, upcoming, and completed
- Realistic scores and times

---

## Success Criteria for MVP

### Functional Requirements
✅ All navigation works smoothly
✅ Charts render and animate properly
✅ Buy/Sell sheets open and close correctly
✅ Theme switching works flawlessly
✅ All screens populated with dummy data
✅ Haptic feedback on all interactions
✅ Smooth 60 FPS animations

### Visual Requirements
✅ Matches design mockups
✅ Liquid glass effect on surfaces
✅ Proper light/dark mode implementation
✅ Consistent spacing and typography
✅ Team colors properly integrated
✅ Empty states for all screens

### Performance Requirements
✅ App launches in < 2 seconds
✅ No frame drops during navigation
✅ Smooth chart interactions
✅ Efficient list rendering
✅ Proper memory management

---

## Future Considerations

### Features for Later Phases
- Recurring investments
- Fractional shares
- Options trading
- Fantasy-style competitions
- Social features (following other users)
- Portfolio sharing
- Educational content
- Dividend tracking
- Tax loss harvesting
- Advanced order types (limit, stop-loss)

### Potential Integrations
- Plaid for bank linking
- Stripe for payments
- Twilio for SMS verification
- SendGrid for emails
- Firebase for push notifications
- Sentry for error tracking
- Mixpanel/Amplitude for analytics

---

## Open Questions & Decisions Needed

1. **League Coverage**: Which leagues to launch with?
2. **Pricing Model**: Commission-free or per-transaction fees?
3. **Minimum Investment**: $1, $5, or $10 minimum?
4. **Market Hours**: 24/7 or aligned with stock market hours?
5. **Price Determination**: How are team "stock" prices calculated and updated?
6. **Regulatory**: What securities regulations apply?
7. **Data Sources**: Real-time sports data provider?
8. **Banking Partner**: Who handles the actual money movement?

---

## Notes

- This is MVP phase focusing on UI/UX with dummy data
- **ALL liquid glass effects MUST use Expo UI (`@expo/ui/swift-ui`) with SwiftUI components**
- Requires Expo SDK 54+ and iOS 18+ for full `glassEffect` support
- Real payment processing to be implemented after UI is approved
- Authentication system will be added in Phase 3
- All financial transactions are simulated for now
- Focus on making the app feel premium and polished using REAL Apple SwiftUI components
- Every interaction should feel intentional and smooth
- When in doubt, make it more like Robinhood or Apple's native apps
- The glass effect must be authentic - we're using actual SwiftUI via Expo UI, not simulations

---

**Document Version**: 2.0  
**Last Updated**: October 22, 2025  
**Author**: Product Team  
**Status**: Ready for Development

**Key Changes**:
- v2.0: Updated to use Expo UI (`@expo/ui/swift-ui`) package - no custom native modules needed
- v1.1: Updated to use native SwiftUI materials through Expo Modules API
- v1.0: Initial version with expo-blur

