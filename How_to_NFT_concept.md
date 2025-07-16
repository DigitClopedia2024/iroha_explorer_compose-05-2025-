# How To Manage Certified NFTs and Real-World Assets (RWAs) on Hyperledger Iroha V2

This guide provides a comprehensive workflow for representing and managing certified Non-Fungible Tokens (NFTs) and diverse Real-World Assets (RWAs) on a private Hyperledger Iroha V2 blockchain. It details the process from asset definition and minting, through ownership tracking, rich metadata management, and handling financial aspects like commissions.

Our core concept involves using the Iroha V2 blockchain as an **immutable, auditable, and transparent internal ledger** for high-value assets. This complements public blockchain activity (e.g., Tezos for art NFTs, objkt.com for marketplaces) and decentralized storage solutions (e.g., Arweave/ARDrive), creating a robust system for verifiable provenance, ownership, and financial tracking.

---

### Important Note: Conceptual Approach & Ongoing Validation

This guide presents a conceptual approach to managing certified NFTs and Real-World Assets (RWAs) on Hyperledger Iroha V2, developed based on our understanding of Iroha's capabilities and our specific use cases. **As of July 16, 2025, we have not found an official, detailed guideline on Iroha's documentation or elsewhere on the web that specifically addresses the comprehensive RWA tokenization and certification workflow described herein.**

We are actively in contact with the developers at Soramitsu/Iroha V2 to validate the relevance, correctness, and any potential required changes or optimizations to this concept. We encourage feedback and contributions from the Iroha community as we continue to refine this approach.

---

## 1\. Understanding Assets in Hyperledger Iroha V2

In Iroha V2, both fungible (interchangeable, like currency) and non-fungible (unique, like an NFT) assets are built upon the same fundamental **Asset** primitive.

  * **Asset Definition:** This is the blueprint or category for your assets (e.g., "Certified Art NFT," "Advertising Capacity," "Loan Receivable"). For NFTs and RWAs, you'll primarily use the `Store` value type for asset definitions, allowing you to attach rich, custom metadata to each unique instance.
  * **Asset Instance (NFT/RWA):** This is a specific, unique item created from an asset definition (e.g., "Fantastic Bestiary - The Griffin," "Prime-Time Ad Slot Q3 2025"). For NFTs/RWAs, these instances typically have a `quantity` of `1` and detailed metadata.
  * **Metadata:** This is the heart of RWA tokenization. It's a flexible JSON object attached to each asset instance, containing all the descriptive, verifiable, and financial data about your asset.

-----

## 2\. Setting Up Your Iroha V2 Environment

Ensure you have a running Hyperledger Iroha V2 instance and the `iroha_client_cli` configured and connected. (Refer to the official Iroha V2 documentation for installation: `https://docs.iroha.tech/get-started/operate-iroha-2-via-cli.html`).

For this guide, we'll assume your Iroha domain is `your_domain_name` (e.g., `wonderland`).

-----

## 3\. Core Iroha V2 Accounts for Asset Management

Before minting assets, establish the necessary Iroha accounts for clear internal roles:

  * **`your_certification_issuing_account@your_domain_name`:** This account will be the initial minter and often the first owner of your newly certified assets. It represents your organization's formal issuance.
  * **`your_organization_accounting_account@your_domain_name`:** An account for receiving your organization's administrative fees/commissions.
  * **`royalty_buffer_account@your_domain_name`:** An optional, dedicated account for holding "potential" commission tokens before they are fully earned or disbursed.
  * **`artist_xyz_royalties@your_domain_name`:** (Create one for each artist) Dedicated accounts for transparently accumulating earned royalties for specific artists.
  * **Client/Partner Accounts:** Accounts for entities that will own the Iroha representation of your RWAs (e.g., `buyer_alice@your_domain_name`, `advertiser_inc@your_domain_name`).

**CLI Command to Register a New Account (Example for an Artist):**

```bash
iroha_client_cli account register \
    --id "artist_xyz_royalties@your_domain_name" \
    --signatories "public_key_of_your_internal_control" # Use a public key controlled by your organization
```

  * **Note on Signatories:** For internal accounts, your organization will typically control the signatory keys. For client accounts, you might generate keys for them or integrate with a system where they can provide their own public keys.

-----

## 4\. Defining Asset Types (Asset Definitions)

You'll need to define the blueprint for each category of RWA you manage. We recommend using a general `managed_rwa_asset` type for most unique assets and specific fungible asset types for financial values like commissions.

### A. `managed_rwa_asset` (for Certified NFTs, Ad Capacities, Loans, etc.)

This definition allows you to mint unique, metadata-rich tokens representing any certified RWA.

**CLI Command:**

```bash
iroha_client_cli asset_definition register \
    --id "managed_rwa_asset#your_domain_name" \
    --value_type Store
```

  * `--value_type Store`: Crucial for storing flexible JSON metadata that makes each RWA instance unique.

### B. `commission_payments_usd` (for Your Organization's Earned Fees)

This is a fungible asset used to quantify and track the administrative fees your organization earns from asset re-sales.

**CLI Command:**

```bash
iroha_client_cli asset_definition register \
    --id "commission_payments_usd#your_domain_name" \
    --value_type Quantity
```

  * `--value_type Quantity`: Allows for fractional amounts, suitable for monetary values.

### C. `artist_royalty_fee_usd` (for Artist's Earned Royalties)

This is a fungible asset dedicated to tracking royalties due to specific artists.

**CLI Command:**

```bash
iroha_client_cli asset_definition register \
    --id "artist_royalty_fee_usd#your_domain_name" \
    --value_type Quantity
```

### D. `potential_commission_usd` (for Pre-allocated Future Commissions - Optional Buffer)

This is an optional fungible asset for creating a "buffer" of potential commissions when an asset is first minted, prior to actual re-sale.

**CLI Command:**

```bash
iroha_client_cli asset_definition register \
    --id "potential_commission_usd#your_domain_name" \
    --value_type Quantity
```

-----

## 5\. Minting a New Certified RWA (Example: Certified Art NFT)

This is the process of creating a new digital representation of your real-world asset on Iroha.

### Key Prerequisites for Certified Art NFTs:

  * **Original Art File Hash:** Calculate the SHA256 hash of the original, high-resolution art image file.
      * **Linux/macOS:** `shasum -a 256 /path/to/your/art_image.png`
      * **Windows (PowerShell):** `Get-FileHash -Algorithm SHA256 -Path C:\path\to\your\art_image.png`
  * **Certified PDF Document Hash:** Calculate the SHA256 hash of your final, steganography-protected PDF certificate.
  * **Arweave CIDs:** Obtain CIDs if you've uploaded the original art file and the certified PDF to Arweave/ARDrive.
  * **Tezos NFT Details:** If mirroring a Tezos NFT, have its contract address, token ID, and objkt.com URL ready.

### CLI Command to Mint a `managed_rwa_asset`:

```bash
iroha_client_cli asset mint \
    --id "managed_rwa_asset#your_domain_name" \
    --account "your_certification_issuing_account@your_domain_name" \
    --quantity 1 \
    --value '{
        "asset_id_internal": "CERT-2025-0001-XYZ",
        "asset_type": "Certified Art NFT",
        "status": "Available",
        "description": "Certified representation of a unique art piece, backed by official PDF document and verifiable original art file hash.",
        "original_art_title": "Modern Cubism - Fantastic Bestiary (Certified Edition)",
        "artist_name": "Your Artist Name",
        "artist_id_internal": "artist_xyz",
        "date_of_certification": "2025-07-15",
        "face_value_usd": "500.00",
        "currency": "USD",
        "total_commission_rate_percent": "15",
        "your_admin_fee_rate_percent": "4",
        "artist_royalty_rate_percent": "11",
        "original_art_file_hash": "SHA256_HASH_OF_THE_ORIGINAL_ART_IMAGE_FILE",
        "certificate_hash": "SHA256_HASH_OF_YOUR_PDF_FILE",
        "arweave_cid_art_file": "ARWEAVE_CID_OF_ORIGINAL_ART_FILE",
        "arweave_cid_document": "ARWEAVE_CID_OF_CERTIFIED_PDF",
        "external_tezos_contract_address": "KT1UY2rHAa8WroAg8sBGzUwm5XN9Nmopd565",
        "external_tezos_token_id": "0",
        "objkt_url": "https://objkt.com/tokens/KT1UY2rHAa8WroAg8sBGzUwm5XN9Nmopd565/0"
        # Add any other relevant metadata fields here for this specific asset type
    }'
```

  * `--quantity 1`: **Always `1` for unique NFTs/RWAs.**
  * `--value '{...}'`: This JSON object contains all the crucial metadata. Ensure all fields are populated accurately.

### Optional: Minting "Potential Commission" (Buffer)

If you use a royalty buffer, mint the calculated potential commission after minting the main asset.

```bash
# Calculate potential commission: $500.00 * (15 / 100) = $75.00
iroha_client_cli asset mint \
    --id "potential_commission_usd#your_domain_name" \
    --account "royalty_buffer_account@your_domain_name" \
    --quantity "75.00" \
    --metadata '{
        "related_rwa_asset_id": "managed_rwa_asset#your_domain_name#UNIQUE_HASH_OF_THE_MINTED_NFT", # You'll need to query Iroha for the full ID after minting the NFT
        "status": "potential",
        "source_face_value": "500.00",
        "commission_rate_percent": "15"
    }'
```

  * **Important:** After you mint a `managed_rwa_asset`, Iroha assigns it a unique hash. You'll need to find this full asset ID (e.g., using `iroha_client_cli asset find_all_by_account_id`) to correctly link it in the `related_rwa_asset_id` metadata field of the potential commission.

-----

## 6\. Managing RWA Ownership Transfers

When an RWA changes ownership (e.g., an art NFT is sold and the certified PDF is transferred to a new buyer), you must reflect this on your Iroha ledger.

### A. Finding the Full Asset ID

First, identify the full Iroha ID of the specific `managed_rwa_asset` you want to transfer.

**CLI Command:**

```bash
iroha_client_cli asset find_all_by_account_id --id "current_owner_account@your_domain_name"
```

  * Look for the `managed_rwa_asset#your_domain_name#UNIQUE_HASH` in the output. This is the `asset_id` you'll use for transfers.

### B. Transferring the RWA

```bash
iroha_client_cli asset transfer \
    --asset_id "managed_rwa_asset#your_domain_name#UNIQUE_HASH_OF_THE_MINTED_NFT" \
    --from "current_owner_account@your_domain_name" \
    --to "new_owner_account@your_domain_name" \
    --quantity 1
```

  * `--quantity 1`: Remains `1` for unique assets.

### C. (Optional) Updating Historical Owners in Metadata

For robust provenance, you might update the NFT's metadata to add the new owner to a historical list. This requires using the `SetKeyValue` instruction.

**CLI Command (conceptual - assumes you read current metadata, append, then set):**

```bash
# 1. First, retrieve the current metadata of the asset
# 2. Append the new owner and date to the "historical_owners" array in the metadata JSON.
# 3. Use SetKeyValue to update the metadata
iroha_client_cli asset set_key_value \
    --asset_id "managed_rwa_asset#your_domain_name#UNIQUE_HASH_OF_THE_MINTED_NFT" \
    --key "historical_owners" \
    --value '[{"account": "old_owner@your_domain_name", "date_acquired": "2025-07-15"}, {"account": "new_owner@your_domain_name", "date_acquired": "2025-08-01"}]'
```

  * **Note:** Manually managing JSON arrays with `SetKeyValue` via CLI can be cumbersome. This is a prime candidate for eventual automation via an SDK.

-----

## 7\. Tracking Commissions and Royalties on Re-Sales

When a re-sale occurs (e.g., on objkt.com for an art NFT), you'll record the actual commissions earned on Iroha.

### A. Minting Your Organization's Admin Fee

```bash
# Assuming re-sale price was $600, your admin fee is 4% = $24
iroha_client_cli asset mint \
    --id "commission_payments_usd#your_domain_name" \
    --account "your_organization_accounting_account@your_domain_name" \
    --quantity "24.00" \
    --metadata '{
        "related_rwa_asset_id": "managed_rwa_asset#your_domain_name#UNIQUE_HASH_OF_THE_MINTED_NFT",
        "asset_type_of_source": "Certified Art NFT",
        "status": "earned",
        "fee_type": "admin_cost",
        "sale_price_usd": "600.00",
        "commission_percentage_applied": "4",
        "tezos_transaction_hash": "0xABC...DEF",
        "date_of_sale": "2025-08-01"
    }'
```

### B. Minting Artist's Royalty Fee to Their Dedicated Account

```bash
# Assuming re-sale price was $600, artist royalty is 11% = $66
iroha_client_cli asset mint \
    --id "artist_royalty_fee_usd#your_domain_name" \
    --account "artist_xyz_royalties@your_domain_name" \
    --quantity "66.00" \
    --metadata '{
        "related_rwa_asset_id": "managed_rwa_asset#your_domain_name#UNIQUE_HASH_OF_THE_MINTED_NFT",
        "asset_type_of_source": "Certified Art NFT",
        "status": "earned",
        "artist_id_internal": "artist_xyz",
        "sale_price_usd": "600.00",
        "commission_percentage_applied": "11",
        "tezos_transaction_hash": "0xABC...DEF",
        "date_of_sale": "2025-08-01"
    }'
```

### C. (Optional) Burning "Potential Commission"

If you used the "potential commission" buffer, you can burn those tokens from the `royalty_buffer_account` once the actual commissions are earned and recorded.

```bash
iroha_client_cli asset burn \
    --id "potential_commission_usd#your_domain_name" \
    --quantity "75.00" \
    --account "royalty_buffer_account@your_domain_name"
```

  * The `quantity` here would be the amount you initially put into the buffer for this specific asset.

-----

## 8\. Managing Other RWA Types (Examples)

The same `managed_rwa_asset` definition can be used for other asset types by changing the `asset_type` field in the metadata and including relevant, type-specific fields.

### Example: Minting a "Loan Receivable" Asset

This represents a loan your organization has issued, treated as an asset.

```bash
iroha_client_cli asset mint \
    --id "managed_rwa_asset#your_domain_name" \
    --account "your_finance_department_account@your_domain_name" \
    --quantity 1 \
    --value '{
        "asset_id_internal": "LOAN-CORP-2025-001",
        "asset_type": "Loan Receivable",
        "status": "Active",
        "description": "Corporate loan to XYZ Corp for project pre-financing.",
        "loan_amount_usd": "100000.00",
        "currency": "USD",
        "interest_rate_percent": "5.5",
        "maturity_date": "2027-12-31",
        "borrower_internal_id": "XYZ_CORP_INTERNAL_ID",
        "loan_agreement_hash": "SHA256_HASH_OF_LOAN_AGREEMENT_PDF",
        "arweave_cid_agreement": "ARWEAVE_CID_OF_LOAN_AGREEMENT"
        # ... other loan-specific details (e.g., repayment schedule, collateral details)
    }'
```

-----

## 9\. Retrieving Asset Data (for Reporting and Auditing)

You can query your Iroha blockchain to retrieve information about your assets and accounts.

### A. Find All Assets by an Account

```bash
iroha_client_cli asset find_all_by_account_id --id "your_organization_accounting_account@your_domain_name"
```

  * This will list all assets (both unique `managed_rwa_asset` instances and fungible `commission_payments_usd` etc.) held by that account.

### B. Find a Specific Asset by Its Full ID

```bash
iroha_client_cli asset find --id "managed_rwa_asset#your_domain_name#UNIQUE_HASH_OF_THE_MINTED_NFT"
```

  * This will return the full metadata of that specific RWA.

### C. Find All Asset Definitions

```bash
iroha_client_cli asset_definition find_all
```

  * This lists all asset types you've defined (e.g., `managed_rwa_asset`, `commission_payments_usd`).

-----

## 10\. The Importance of Automation (Future Steps)

While manual operations are suitable for initial testing and low volumes, they carry significant risks of human error (typos like `110%` instead of `11%`). For robust, production-ready asset management, consider building an **off-chain automation layer** (e.g., a Python script using an Iroha SDK) that:

  * **Validates Input:** Ensures data integrity before blockchain submission.
  * **Calculates Automatically:** Computes values like commissions precisely.
  * **Constructs Transactions:** Programmatically builds Iroha commands, eliminating manual typing.
  * **Manages Keys Securely:** Handles private keys without direct human exposure.

This automation layer will transform your Iroha V2 implementation into a reliable, efficient, and secure "digital vault" for high-value assets.

+++
