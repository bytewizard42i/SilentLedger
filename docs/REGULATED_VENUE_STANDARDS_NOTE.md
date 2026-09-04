# Regulated Venues and Token Standards — Note for SilentLedger

> **Source**: Blockenfy / Cardano Ambassadors / UZH, *"CIP-0113 vs ERC-3643"* (Aug
> 2026). Full aggregation:
> [`DIDzMonolith-docs/compliance/RWA_CIP-0113_vs_ERC-3643_DIDZM_IMPLICATIONS.md`](../../DIDzMonolith-docs/compliance/RWA_CIP-0113_vs_ERC-3643_DIDZM_IMPLICATIONS.md).
> Cross-pollination note, Sept 4, 2026. SilentLedger is a hackathon-era educational
> DApp; nothing here changes its evidence label.

## Why SilentLedger cares

SilentLedger's core rule — **a seller must prove ownership in zero knowledge before a
sell order is accepted** (prevents naked shorting, hides balances) — is the same rule
regulated secondary venues enforce for security tokens, just done privately. The paper
documents the venue landscape those tokens trade on:

| Venue | Regime | Standard |
|---|---|---|
| **21X** | First regulated exchange under the EU DLT Pilot Regime | ERC-3643 exclusively |
| **BX Digital** (Börse Stuttgart) | Swiss regulated exchange | ERC-3643 |
| **Securitize Europe SNL** | Spain's first CNMV-authorized blockchain Trading and Settlement System; Securitize is also an ERIR | ERC-3643 |
| **Archax** | Announced on the exchange side for CIP-0113 | CIP-0113 (early) |

Every one of these venues gates trading on the token's compliance layer: the buyer must
be in the Identity Registry with required claims (ERC-3643) or pass the token's
sub-standard (CIP-0113), and the seller's balance is public on-chain.

## What the paper's checklist means for a private orderbook

| Venue / regulator requirement | SilentLedger today | Gap / opportunity |
|---|---|---|
| Seller actually holds the asset | ZK ownership proof before sell order | ✅ already the design; RWAz `assert_i_own` is the engine-level version |
| Buyer is eligible (KYC, jurisdiction, accreditation) | none | Consume KYCz predicates (`kyc_passed`, `resident_in_set`, `accredited_under`) at order time — one bit each, no cap table published |
| Asset not frozen / paused / encumbered | none | Query RWAz Phase 5 policy state (frozen, paused, lien) before matching |
| Time / exchange limits (ERC-3643 `TimeExchangeLimitsCompliance`) | none | Venue-level policy on order frequency; fits the orderbook layer |
| Front-running prevention | private order details via commitments | ✅ SilentLedger's original thesis; regulated venues get this from off-chain matching, we get it from ZK |
| Audit trail for the regulator | dev "God Windows" (demo only) | Replace with Action Receipts (`DIDzMonolith-docs/standards/AUTHORITY_IS_A_RECEIPT.md`) — permanent, selectively disclosed, refusal-inclusive |

## One-line positioning

> SilentLedger + RWAz + KYCz = a **private regulated venue**: the venue proves to the
> regulator that every match was between eligible parties holding real assets, without
> publishing who they were or what they held.

## Not doing now

- No code changes; SilentLedger remains the hackathon demo.
- Any venue-grade rebuild would sit on RWAz Phase 3 (fractional shares) and Phase 5
  (policies), which are design-only.
