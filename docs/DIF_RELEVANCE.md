# DIF Relevance for SilentLedger

> **Canonical source**: [`/home/js/DIDzMonolith/monolith-docs/DIF_KNOWLEDGE_BASE.md`](/home/js/DIDzMonolith/monolith-docs/DIF_KNOWLEDGE_BASE.md)
>
> This file is a short pointer. The deep content (specs, ecosystem, integration patterns, anti-patterns) lives in the canonical knowledge base. Refresh this file only when SilentLedger's DIF needs materially change.

## Why DIF matters for SilentLedger

SilentLedger obfuscated orderbook and asset attestations benefit from Confidential Storage (for trade record vaults), BBS+ (for selective disclosure of trade attributes), and Creator Assertions (for provenance of the underlying assets).

## DIF specs to adopt

- **Confidential Storage**: encrypted vaults for trade records and audit trails
- **BBS+ Signatures**: selective disclosure of trade attributes (volume bucket, asset class, jurisdiction) without revealing counterparties
- **Creator Assertions WG**: provenance attestations for traded assets (especially RWA)
- **Presentation Exchange**: counterparty credential checks (accredited investor, jurisdiction)

## Integration patterns from the canonical doc

- Pattern B (Presentation Exchange for credential proofs)
- Pattern D (Confidential Storage for trade record vaults)
- Pattern E (BBS+ for selective disclosure)

## Concrete next steps

1. Evaluate Confidential Storage as the home for trade record archives.
2. Switch credential signatures to BBS+ where selective disclosure matters.
3. Use Creator Assertions for RWA provenance attestations.

## Last refreshed

May 24, 2026 from DIF homepage and GitHub org listing.
