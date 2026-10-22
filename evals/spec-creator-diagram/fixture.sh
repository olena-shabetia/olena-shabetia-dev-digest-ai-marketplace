#!/usr/bin/env bash
# Tiny project with three modules so a feature can span several hops.
set -euo pipefail
cat > AGENTS.md <<'DOC'
# Fixture project

Specs live in `specs/`. Modules: `src/orders`, `src/billing`, `src/notifications`.
DOC
mkdir -p src/orders src/billing src/notifications
cat > src/orders/place-order.ts <<'CODE'
export function placeOrder(userId: string, amountCents: number) {
  return { id: `o-${userId}-${amountCents}`, userId, amountCents };
}
CODE
cat > src/billing/create-invoice.ts <<'CODE'
export function createInvoice(orderId: string, amountCents: number) {
  return { orderId, amountCents, status: 'open' as const };
}
CODE
cat > src/notifications/send-email.ts <<'CODE'
export function sendEmail(userId: string, subject: string) {
  return { userId, subject, sent: true };
}
CODE
