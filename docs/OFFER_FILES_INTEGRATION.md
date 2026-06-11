# SilentLedger and Zswap Offer Files

> Cross-pollination note: how SilentLedger's privacy-preserving orderbook relates to Midnight's new offer-file primitive, and what we should borrow vs keep.
> Source of concepts: Midnight fireside June 10, 2026 (DIDz KB: `monolith-docs/midnight/ZSWAP_OFFER_FILES.md`).
> Sibling projects: p2p4me (`../p2p4me_app`, private peer transfers) and superSwap (`../superSwap_me_us`, public sweep matching).

---

## What SilentLedger already does

SilentLedger's three contracts implement a privacy-preserving DEX in Compact:

- `SilentOrderbook.compact` — commitment orders in a `Map<Bytes<32>, OrderCommit>`, off-chain `matchOrder` per pair, ownership proved via a private-data witness.
- `ObfuscatedOrderbook.compact` — orders with explicit prices/amounts plus **anti-short-sell**: sell orders require a prior ownership `verificationId`.
- `AssetVerification.compact` — ZK ownership proofs (prove you hold >= minAmount without revealing balance), with replay protection and expiry.

This was built before offer files existed, so it puts the **order lifecycle on-chain** (place / cancel / fill all call circuits).

## What the offer-file model changes

The fireside primitive moves the order lifecycle **off-chain** and only settles (and cancels) on-chain:

| Concern | SilentLedger today | Offer-file model |
|---|---|---|
| Placing an order | on-chain `placeOrder` / `addOrder` circuit | off-chain: build + serialize an offer file, no tx |
| Privacy of order details | commitment hash hides details; owner hash on-chain | inputs/outputs/addresses shielded; only deltas public (and only to whoever holds the file) |
| Matching | off-chain matcher calls `matchOrder` / `fillOrders` circuit | off-chain `offer.merge(...)`; one atomic settlement when deltas net to zero |
| Throughput | every action is a tx + proof | only settlement is on-chain; scales to thousands |
| Liquidity | siloed in this contract | shared Celestia namespace across all Midnight apps |

The headline: **for the common DEX path, offer files remove the need for a custom Compact orderbook entirely.** A contract-free SilentLedger MVP can settle far more cheaply and tap shared liquidity.

## Recommendation: hybrid, not rewrite

Keep Compact only where it adds something offer files cannot express on their own:

1. **Anti-short-sell stays valuable.** Offer files prove you can settle a swap, but SilentLedger's distinctive feature is requiring *proof of asset ownership before a sell can be posted*. Keep `AssetVerification` (and the verification-gate idea) as an **on-chain policy layer** that an offer must reference to be surfaced by SilentLedger's matcher. The raw offer-file pool has no such gate, so this is a genuine SilentLedger differentiator.
2. **Adopt offer files as the order transport.** Replace `addOrder` / `placeOrder` on-chain writes with off-chain offer files; let `matchOrder` become an off-chain sweep that produces one atomic settlement.
3. **Read the book via EffectStream**, do not hand-roll an indexer.
4. **Reuse `AssetVerification` for superSwap** too (it is the anti-short-sell piece superSwap's doc flags as a candidate Compact addition).

## Anti-short-sell as a shared DIDz primitive

`AssetVerification.compact` is the most reusable asset here. It can serve as the ownership-gating layer for:

- **SilentLedger** (its original purpose)
- **superSwap** (gate public sell offers)
- any future offer-file DEX in DIDz that wants to prevent selling assets you do not hold

That makes it worth treating as a small shared contract rather than a SilentLedger-only file.

---

*Last updated 2026-06-11. Concepts from the 2026-06-10 fireside; verify against the official blog + MIP before implementation.*
