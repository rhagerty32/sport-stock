#!/usr/bin/env bash
# Amplify's backend deployer wires the CDK toolkit with BaseCredentials.awsCliCompatible({ profile }).
# Profiles that use `aws login` (credential type "login") can open a browser on every CDK subprocess if
# we only pass --profile. We export credentials once into the environment and run ampx without --profile
# so CDK uses env keys (CDK_DEFAULT_ACCOUNT/REGION are set below).
set -euo pipefail

PROFILE="${AWS_PROFILE:-sportstock}"
export AWS_SDK_LOAD_CONFIG="${AWS_SDK_LOAD_CONFIG:-1}"
export AWS_REGION="${AWS_REGION:-us-east-1}"
export CDK_DEFAULT_REGION="$AWS_REGION"

if [[ -n "${SANDBOX_CLEAR_CDK_ACCOUNT_CACHE:-}" ]]; then
    rm -f "${HOME}/.cdk/cache/accounts_partitions.json" || true
fi

if ! aws configure export-credentials --profile "$PROFILE" --format env > /dev/null 2>&1; then
    echo "error: Could not load credentials for profile \"$PROFILE\"." >&2
    cred_type="$(aws configure list --profile "$PROFILE" 2>/dev/null | awk '/access_key/ {print $3}' || true)"
    if [[ "$cred_type" == "login" ]]; then
        echo "  This profile uses 'aws login'. Refresh once, then re-run sandbox:" >&2
        echo "    aws login --profile $PROFILE" >&2
        echo "  To avoid browser prompts entirely, use long-lived IAM access keys in ~/.aws/credentials instead." >&2
    else
        echo "  Configure [profile $PROFILE] or [sportstock] in ~/.aws/credentials, then: npm run aws:verify" >&2
    fi
    exit 1
fi

# shellcheck disable=SC1090
eval "$(aws configure export-credentials --profile "$PROFILE" --format env)"
unset AWS_PROFILE

CDK_DEFAULT_ACCOUNT="$(
    aws sts get-caller-identity --query Account --output text 2>/dev/null || true
)"
if [[ -z "${CDK_DEFAULT_ACCOUNT:-}" || "$CDK_DEFAULT_ACCOUNT" == "None" ]]; then
    echo "error: Exported credentials could not call sts get-caller-identity." >&2
    exit 1
fi
export CDK_DEFAULT_ACCOUNT

BOOTSTRAP_TARGET="aws://${CDK_DEFAULT_ACCOUNT}/${CDK_DEFAULT_REGION}"
echo "Using account ${CDK_DEFAULT_ACCOUNT} in ${CDK_DEFAULT_REGION} (profile ${PROFILE})."

# One-time per account/region. "Sign in to the console" in ampx errors means bootstrap, not aws login.
if ! aws cloudformation describe-stacks --stack-name CDKToolkit --region "$CDK_DEFAULT_REGION" > /dev/null 2>&1; then
    echo "CDK bootstrap required for ${BOOTSTRAP_TARGET} (creates CDKToolkit stack; no browser login)..."
    npx -y aws-cdk@2 bootstrap "$BOOTSTRAP_TARGET"
fi

# Env credentials avoid repeated 'aws login' popups; --profile keeps ampx/CDK account resolution correct.
exec npx ampx sandbox --profile "$PROFILE" "$@"
