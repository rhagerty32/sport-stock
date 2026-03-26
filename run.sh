#!/bin/bash

# Local development build: compiles the native iOS app (not Expo Go) and runs Metro.
# Use this for flows that need your app URL scheme (e.g. Cognito Hosted UI callback).

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
DIM='\033[2m'
NC='\033[0m'

usage() {
    echo "Usage: ./run.sh [options]"
    echo ""
    echo "Runs a local iOS dev build (npx expo run:ios)."
    echo ""
    echo "Options:"
    echo "  (no args)              Prompt: Simulator or physical device"
    echo "  --simulator            Build and run on the iOS Simulator"
    echo "  --device [name|UDID]   Physical device: optional name or UDID (skips Expo's device picker)"
    echo "  --clear                Clear native build cache (--no-build-cache) before building"
    echo "  -h, --help             Show this help"
    echo ""
    echo "Examples:"
    echo "  ./run.sh"
    echo "  ./run.sh --simulator"
    echo "  ./run.sh --device"
    echo "  ./run.sh --device \"Ryan's iPhone\""
    echo "  ./run.sh --device 00008120-001A398C116A201E"
}

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

TARGET=""
DEVICE_SPEC=""
CLEAR_CACHE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --simulator|--sim)
            TARGET=simulator
            shift
            ;;
        --device|-d)
            TARGET=device
            shift
            # Optional: device name or UDID (must not look like another flag)
            if [[ $# -gt 0 && $1 != -* ]]; then
                DEVICE_SPEC=$1
                shift
            fi
            ;;
        --clear)
            CLEAR_CACHE=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

if [ -z "$TARGET" ]; then
    echo -e "${CYAN}Where should the dev build run?${NC}"
    PS3=$'\n'"Enter choice (1–3): "
    select opt in "iOS Simulator" "Physical device" "Cancel"; do
        case $REPLY in
            1)
                TARGET=simulator
                break
                ;;
            2)
                TARGET=device
                break
                ;;
            3)
                echo "Cancelled."
                exit 0
                ;;
            *)
                echo "Invalid choice. Enter 1, 2, or 3."
                ;;
        esac
    done
fi

physical_device_hints() {
    echo ""
    echo -e "${YELLOW}Physical device: Expo lists simulators and devices together.${NC}"
    echo -e "${DIM}Real iPhones/iPads appear at the top of the list with a ${NC}🔌${DIM} (USB) or ${NC}🌐${DIM} (network) prefix.${NC}"
    echo -e "${DIM}Names like \"iPhone 17 Pro (26.0)\" without an icon are simulators, not your phone.${NC}"
    echo ""
    echo -e "${YELLOW}If your phone never appears:${NC}"
    echo "  • Unlock the device and keep it awake while Xcode connects."
    echo "  • Use a data-capable USB cable (many cables are charge-only)."
    echo "  • Tap Trust on the phone when prompted; pair in Finder or Xcode if needed."
    echo "  • Settings → Privacy & Security → Developer Mode → On (iOS 16+), then reboot."
    echo "  • Xcode → Settings → Accounts: sign in with your Apple ID; select a Team for signing."
    echo "  • Xcode → Window → Devices and Simulators: confirm the device shows as connected."
    echo ""
    echo -e "${CYAN}Tip:${NC} Get your UDID from Finder (device → show serial/identifier) or Xcode, then run:"
    echo -e "  ${DIM}./run.sh --device <UDID>${NC}"
    echo ""
}

ensure_xcode_selected() {
    local developer_dir
    developer_dir="$(xcode-select -p 2>/dev/null || true)"
    if [ -z "$developer_dir" ] || [ ! -d "$developer_dir" ]; then
        echo -e "${YELLOW}Xcode tools not configured.${NC}"
        echo "Run: sudo xcode-select -s /Applications/Xcode.app"
        echo ""
        return 1
    fi
    # Expo iOS tooling expects the full Xcode Developer dir, not just CommandLineTools.
    if [[ "$developer_dir" != *"/Applications/Xcode.app/Contents/Developer"* ]]; then
        echo -e "${YELLOW}Xcode is not selected for builds.${NC}"
        echo -e "${DIM}Current developer dir:${NC} $developer_dir"
        echo "Fix: sudo xcode-select -s /Applications/Xcode.app"
        echo ""
        return 1
    fi
    return 0
}

ensure_simulator_app_available() {
    # Expo CLI sometimes checks for Simulator.app even when targeting a device.
    if [ -d "/Applications/Xcode.app/Contents/Developer/Applications/Simulator.app" ] || [ -d "/Applications/Simulator.app" ]; then
        return 0
    fi
    echo -e "${YELLOW}Simulator.app not found.${NC}"
    echo -e "${DIM}Expected one of:${NC}"
    echo "  /Applications/Xcode.app/Contents/Developer/Applications/Simulator.app"
    echo "  /Applications/Simulator.app"
    echo ""
    echo -e "${YELLOW}Fix:${NC}"
    echo "  • Install full Xcode (not just Command Line Tools) and open it once to finish installation."
    echo "  • Then run: sudo xcodebuild -runFirstLaunch"
    echo ""
    return 1
}

pick_connected_ios_device_udid() {
    # Uses xctrace because it's widely available and returns both devices and simulators.
    # We parse only the '== Devices ==' section and filter out the Mac.
    if ! ensure_xcode_selected; then
        return 1
    fi

    local raw
    raw="$(xcrun xctrace list devices 2>/dev/null || true)"
    if [ -z "$raw" ]; then
        return 1
    fi

    local parsed
    parsed="$(python3 - <<'PY'
import re, sys
raw = sys.stdin.read()
m = re.search(r"== Devices ==\\n(.*?)(?:\\n\\n|\\n==|\\Z)", raw, re.S)
if not m:
    sys.exit(0)
lines = [ln.strip() for ln in m.group(1).splitlines() if ln.strip()]
out = []
for ln in lines:
    # Example: Ryan’s iPhone (26.4) (00008130-000E1DC12152001C)
    mm = re.match(r"^(?P<name>.+?)\\s*\\([^)]*\\)\\s*\\((?P<udid>[0-9A-Fa-f-]+)\\)\\s*$", ln)
    if not mm:
        continue
    name = mm.group('name')
    udid = mm.group('udid')
    if 'Mac' in name or 'macOS' in ln:
        continue
    out.append((name, udid))
for name, udid in out:
    print(f"{name}\t{udid}")
PY
<<<"$raw")"

    if [ -z "$parsed" ]; then
        return 1
    fi

    local names=()
    local udids=()
    while IFS=$'\t' read -r name udid; do
        [ -z "$name" ] && continue
        names+=("$name")
        udids+=("$udid")
    done <<< "$parsed"

    if [ "${#udids[@]}" -eq 0 ]; then
        return 1
    fi

    if [ "${#udids[@]}" -eq 1 ]; then
        echo "${udids[0]}"
        return 0
    fi

    echo -e "${CYAN}Select a connected iOS device:${NC}"
    local i=0
    for n in "${names[@]}"; do
        echo "  $((i+1))) $n"
        i=$((i+1))
    done
    echo ""
    read -r -p "Enter choice (1-${#udids[@]}): " choice
    if [[ ! "$choice" =~ ^[0-9]+$ ]] || [ "$choice" -lt 1 ] || [ "$choice" -gt "${#udids[@]}" ]; then
        echo "Invalid choice."
        return 1
    fi
    echo "${udids[$((choice-1))]}"
    return 0
}

EXPO_CMD=(npx expo run:ios)

if [ "$CLEAR_CACHE" = true ]; then
    EXPO_CMD+=(--no-build-cache)
    echo -e "${YELLOW}Using --no-build-cache (native build cache cleared).${NC}"
fi

if [ "$TARGET" = "device" ]; then
    if ! ensure_xcode_selected; then
        exit 1
    fi
    if ! ensure_simulator_app_available; then
        exit 1
    fi
    if [ -n "$DEVICE_SPEC" ]; then
        EXPO_CMD+=(--device "$DEVICE_SPEC")
        echo -e "${GREEN}Building and running on device: ${DEVICE_SPEC}${NC}"
    else
        physical_device_hints
        UDID="$(pick_connected_ios_device_udid || true)"
        if [ -n "$UDID" ]; then
            EXPO_CMD+=(--device "$UDID")
            echo -e "${GREEN}Building and running on device UDID: ${UDID}${NC}"
        else
            EXPO_CMD+=(--device)
            echo -e "${GREEN}Select your phone at the top of the list (look for 🔌 or 🌐).${NC}"
        fi
    fi
else
    echo -e "${GREEN}Building and running on the iOS Simulator.${NC}"
fi

echo ""
export RCT_BUILD_HERMES_FROM_SOURCE=true
exec "${EXPO_CMD[@]}"
