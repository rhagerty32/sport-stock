# Didit KYC — Backend Implementation Guide

This document is for **sportstock-backend** engineers. The mobile app (`SportStock/`) already calls these endpoints; implement them here so KYC works end-to-end.

## Overview

- **Approach:** Didit Sessions API (Approach A) — backend creates sessions; mobile opens Didit hosted UI via `@didit-protocol/sdk-react-native`.
- **Auth surface:** `https://apx.didit.me` (account only)
- **Verification surface:** `https://verification.didit.me` (all `/v3/...` calls)
- **Mobile callback:** `sportstock://kyc/callback`
- **Webhook URL:** `https://api.sportstock.com/api/webhooks/didit`

## Environment variables

Add to `.env`, Lambda config, and `.github/workflows/deploy.yml`:

| Variable | Required | Description |
|---|---|---|
| `DIDIT_API_KEY` | Yes | Long-lived app API key (`x-api-key` header) |
| `DIDIT_WORKFLOW_ID` | Yes | UUID from workflow creation or Didit console |
| `DIDIT_WEBHOOK_SECRET` | Yes | `secret_shared_key` from webhook destination registration |
| `DIDIT_VERIFICATION_BASE_URL` | No | Default `https://verification.didit.me` |
| `DIDIT_KYC_CALLBACK_URL` | No | Default `sportstock://kyc/callback` |

**Never expose `DIDIT_API_KEY` or `DIDIT_WEBHOOK_SECRET` to the mobile client.**

## One-time Didit setup

### 1. Create KYC workflow

```bash
curl -X POST https://verification.didit.me/v3/workflows/ \
  -H "x-api-key: $DIDIT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_label": "SportStock Standard KYC",
    "features": [
      { "feature": "OCR" },
      { "feature": "LIVENESS", "config": { "face_liveness_method": "PASSIVE" } },
      { "feature": "FACE_MATCH" },
      { "feature": "IP_ANALYSIS" }
    ]
  }'
```

Save `workflow_id` (also `uuid`) as `DIDIT_WORKFLOW_ID`.

### 2. Register webhook destination

```bash
curl -X POST https://verification.didit.me/v3/webhook/destinations/ \
  -H "x-api-key: $DIDIT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "SportStock production session webhooks",
    "url": "https://api.sportstock.com/api/webhooks/didit",
    "webhook_version": "v3",
    "subscribed_events": ["status.updated", "data.updated"]
  }'
```

Save `secret_shared_key` as `DIDIT_WEBHOOK_SECRET` immediately.

### 3. Sandbox testing

For sandbox apps only, pass `"sandbox_scenario": "approve"` in session create to force outcomes.

---

## Database migration

Create `alembic/versions/005_add_kyc_fields.py`:

```python
"""Add KYC fields to users."""

revision = "005"
down_revision = "004"

def upgrade():
    op.add_column("users", sa.Column("kyc_status", sa.String(32), nullable=True))
    op.add_column("users", sa.Column("didit_session_id", sa.String(64), nullable=True))
    op.add_column("users", sa.Column("kyc_verified_at", sa.DateTime(), nullable=True))
    op.add_column("users", sa.Column("kyc_last_event_id", sa.String(64), nullable=True))

def downgrade():
    op.drop_column("users", "kyc_last_event_id")
    op.drop_column("users", "kyc_verified_at")
    op.drop_column("users", "didit_session_id")
    op.drop_column("users", "kyc_status")
```

### Update ORM — `app/db/models/user.py`

```python
kyc_status = Column(String(32), nullable=True)
didit_session_id = Column(String(64), nullable=True)
kyc_verified_at = Column(DateTime, nullable=True)
kyc_last_event_id = Column(String(64), nullable=True)
```

Also update `app/domain/user.py`, `app/schemas/user.py` (`UserResponse`), and `app/db/converters.py`.

### Extend `UserResponse`

```python
class UserResponse(BaseModel):
    # ... existing fields ...
    kyc_status: str | None = None
    didit_session_id: str | None = None
    kyc_verified_at: datetime | None = None
```

Didit status strings are case-sensitive: `"Not Started"`, `"In Progress"`, `"Awaiting User"`, `"In Review"`, `"Approved"`, `"Declined"`, `"Resubmitted"`, `"Abandoned"`, `"Expired"`, `"Kyc Expired"`.

---

## Service — `app/services/didit.py`

```python
import hashlib
import hmac
import json
import os
import time
from typing import Any

import httpx

VERIFICATION_BASE = os.getenv("DIDIT_VERIFICATION_BASE_URL", "https://verification.didit.me")
API_KEY = os.getenv("DIDIT_API_KEY", "")
WORKFLOW_ID = os.getenv("DIDIT_WORKFLOW_ID", "")
WEBHOOK_SECRET = os.getenv("DIDIT_WEBHOOK_SECRET", "")
DEFAULT_CALLBACK = os.getenv("DIDIT_KYC_CALLBACK_URL", "sportstock://kyc/callback")


def _headers() -> dict[str, str]:
    return {"x-api-key": API_KEY, "Content-Type": "application/json"}


def create_session(
    *,
    vendor_data: str,
    callback: str = DEFAULT_CALLBACK,
    language: str | None = None,
    email: str | None = None,
    sandbox_scenario: str | None = None,
) -> dict[str, Any]:
    body: dict[str, Any] = {
        "workflow_id": WORKFLOW_ID,
        "vendor_data": vendor_data,
        "callback": callback,
    }
    if language:
        body["language"] = language
    if email and "@" in email and not email.endswith("@example.com"):
        body["contact_details"] = {"email": email, "send_notification_emails": False}
    if sandbox_scenario:
        body["sandbox_scenario"] = sandbox_scenario

    with httpx.Client(timeout=15.0) as client:
        resp = client.post(f"{VERIFICATION_BASE}/v3/session/", headers=_headers(), json=body)
        resp.raise_for_status()
        return resp.json()


def shorten_floats(value: Any) -> Any:
    if isinstance(value, list):
        return [shorten_floats(v) for v in value]
    if isinstance(value, dict):
        return {k: shorten_floats(v) for k, v in value.items()}
    if isinstance(value, float) and value == int(value):
        return int(value)
    return value


def sort_keys(value: Any) -> Any:
    if isinstance(value, list):
        return [sort_keys(v) for v in value]
    if isinstance(value, dict):
        return {k: sort_keys(value[k]) for k in sorted(value.keys())}
    return value


def verify_webhook_signature_v2(
    parsed_body: dict[str, Any],
    signature_v2: str,
    timestamp_header: str,
    *,
    max_skew_seconds: int = 300,
) -> bool:
    if not WEBHOOK_SECRET or not signature_v2 or not timestamp_header:
        return False
    try:
        ts = int(timestamp_header)
    except ValueError:
        return False
    if abs(time.time() - ts) > max_skew_seconds:
        return False

    canonical = json.dumps(sort_keys(shorten_floats(parsed_body)), ensure_ascii=False, separators=(",", ":"))
    expected = hmac.new(
        WEBHOOK_SECRET.encode("utf-8"),
        canonical.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature_v2)


def apply_kyc_status(user, status: str) -> None:
    """Map Didit session status to user row."""
    user.kyc_status = status
    if status == "Approved":
        from datetime import datetime, timezone
        user.kyc_verified_at = datetime.now(timezone.utc)
    elif status in ("Declined", "Kyc Expired", "Expired", "Abandoned"):
        user.kyc_verified_at = None
```

---

## Router — `app/api/routers/kyc.py`

```python
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from app.api.deps import CurrentUserId, DbSession
from app.db.models import UserModel
from app.services import didit

router = APIRouter(tags=["kyc"])


class KycSessionCreateRequest(BaseModel):
    language: str | None = None


class KycSessionCreateResponse(BaseModel):
    session_id: str
    session_token: str
    url: str
    status: str


@router.post("/api/kyc/session", response_model=KycSessionCreateResponse)
def create_kyc_session(
    body: KycSessionCreateRequest,
    user_id: CurrentUserId,
    db: DbSession,
):
    user = db.query(UserModel).filter_by(user_id=user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        session = didit.create_session(
            vendor_data=user_id,
            language=body.language,
            email=user.email,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Didit session create failed: {exc}") from exc

    user.didit_session_id = session["session_id"]
    user.kyc_status = session.get("status", "Not Started")
    db.commit()

    return KycSessionCreateResponse(
        session_id=session["session_id"],
        session_token=session["session_token"],
        url=session["url"],
        status=session["status"],
    )


@router.post("/api/webhooks/didit")
async def didit_webhook(request: Request, db: DbSession):
    raw = await request.body()
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    sig = request.headers.get("x-signature-v2", "")
    ts = request.headers.get("x-timestamp", "")
    if not didit.verify_webhook_signature_v2(parsed, sig, ts):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    event_id = parsed.get("event_id")
    vendor_data = parsed.get("vendor_data")
    status = parsed.get("status")
    if not vendor_data or not status:
        return {"ok": True}

    user = db.query(UserModel).filter_by(user_id=vendor_data).first()
    if not user:
        return {"ok": True}

    if event_id and user.kyc_last_event_id == event_id:
        return {"ok": True}

    didit.apply_kyc_status(user, status)
    if parsed.get("session_id"):
        user.didit_session_id = parsed["session_id"]
    if event_id:
        user.kyc_last_event_id = event_id
    db.commit()
    return {"ok": True}
```

Register in `app/main.py`:

```python
from app.api.routers import kyc
app.include_router(kyc.router)
```

---

## Mobile contract

### `POST /api/kyc/session`

- **Auth:** Bearer Cognito ID token (same as other `/api` routes)
- **Body:** `{ "language": "en" }` (optional)
- **Response:**

```json
{
  "session_id": "uuid",
  "session_token": "12-char-token",
  "url": "https://verify.didit.me/session/...",
  "status": "Not Started"
}
```

### `GET /api/users/me` (extended)

Add to existing `UserResponse`:

```json
{
  "kyc_status": "Approved",
  "didit_session_id": "uuid-or-null",
  "kyc_verified_at": "2026-06-29T12:00:00Z"
}
```

### `POST /api/webhooks/didit`

- **Auth:** None (HMAC signature only)
- **Headers:** `X-Signature-V2`, `X-Timestamp`
- **Response:** `200 {"ok": true}` within 5 seconds

---

## Webhook status state machine

```python
# In apply_kyc_status or webhook handler:
# - Approved → set kyc_verified_at
# - Declined → clear kyc_verified_at, keep status
# - In Review / In Progress / Awaiting User → update status only
# - Kyc Expired → clear kyc_verified_at
# - Resubmitted → update status; mobile may reopen flow
```

Dedupe on `event_id` (stable across retries). Never key on `timestamp`.

Optional: after webhook, call `GET /v3/session/{session_id}/decision/` for full decision JSON if you need to store compliance data.

---

## Deploy checklist

- [ ] Run Alembic migration `005_add_kyc_fields`
- [ ] Set `DIDIT_API_KEY`, `DIDIT_WORKFLOW_ID`, `DIDIT_WEBHOOK_SECRET` in Lambda
- [ ] Register webhook destination pointing to production URL
- [ ] Allowlist Didit webhook egress IP `18.203.201.92` if using Cloudflare/WAF
- [ ] Test `POST /api/kyc/session` with dev JWT
- [ ] Test webhook via Didit console "Try Webhook"
- [ ] Confirm mobile receives updated `kyc_status` on `GET /api/users/me`

## References

- [Didit Sessions API](https://docs.didit.me/sessions-api/overview)
- [Webhooks](https://docs.didit.me/integration/webhooks)
- [Verification statuses](https://docs.didit.me/integration/verification-statuses)
- Mobile integration: `SportStock/docs/DIDIT_KYC_BACKEND.md` (this file) + `lib/kyc-api.ts`
