Iroha V2 Stress Test & Scalability Assessment Report

Date: July 1, 2025

Purpose: This report summarizes the strategic objectives, methodology, findings, and implications of recent stress tests conducted on our Hyperledger Iroha V2 deployment. The primary goal is to validate Iroha V2's suitability for our enterprise-scale content publishing and asset management system, identify potential bottlenecks, and inform future architectural decisions.

**1. Project Context & Strategic Imperative**

DiCLO is developing an AI-assisted, semi-automated content publishing system with a profound mission: to provide vital resources for a healthy and mindful life, directly addressing the global mental health crisis. Our vision is to build a publishing system, where content value is tracked and managed as digital assets on a blockchain.

This ambitious undertaking necessitates a highly robust, scalable, and reliable blockchain infrastructure for:

(A) Asset Management: Tracking content units (e.g., pre-planning sketches, main production units, media distribution rights) as digital assets, potentially with 5-10 sub-asset classes per production unit.
(B) Investor Engagement: Leveraging blockchain-backed assets (commodities e.g., ship certificates, media bonds, community token etc ...) for funding and transparency.

Operational Visibility: Ensuring real-time tracking and auditing of content production and distribution.

The urgency of our mission, coupled with significant daily operational value tied to content production, means that delays in core infrastructure development have a critical impact on our ability to deliver essential support to those in need.

**2. Projected Transaction Volume & Data Scale**

To quantify our enterprise-level requirements, we project the following transaction and data volumes for the Iroha V2 blockchain and its associated indexing services:

- Hourly Content Production: ~1 production unit per hour (24/7), comprising 5-10 sub-asset classes/transactions.
- Annual Transactions: Approximately 100,000 new transactions per year.
- Total Transactions (2-3 years): Expected to reach 200,000 - 300,000 records.
- Estimated Blocks (2-3 years): Between 10,000 to 60,000 blocks (assuming 20-50 transactions per block).

**Hint: Current Data Footprint: Observed ~40 MB for 4,000 transactions (with 3 Iroha nodes).*

Future Network Scale: Planned expansion to ~10 Iroha nodes (representing different departments/media types).

**Projected Indexed Database Size (2-3 years): Estimated 7-10 GB.**

**Hint: Worst-case Future (AI content inflation): Could potentially scale to 7 terabytes (TB) of indexed data. Note: Large media files (e.g., MP4s) will be stored off-chain (e.g., IPFS, cloud storage), with only their cryptographic hashes and metadata stored on-chain.*

**3. Test Methodology & Key Findings**

DiCLI's testing focuses on evaluating the iroha2-block-explorer-backend's performance under sustained transaction load, distinguishing its behavior from the core irohad blockchain nodes.

**3.1. Test Phases & Rationale:*

Initial "Endless Loop" (Implicit): Our very first setup between 27th May 2025 and 15th June 2025 involved a producer running in an "endless loop." This initial phase, while uncontrolled, served to validate the raw throughput and stability of the core Iroha V2 blockchain (irohad). It demonstrated that irohad itself could process thousands of transactions rapidly (e.g., 4,000 transactions in ~5 minutes) without crashing, confirming its high performance.

Controlled, Finite Loops (Current Focus) from 16th June on till 1st July 2025: Recognizing the need for systematic testing, we re-configured the producer to run in controlled, finite loops with specific transaction counts and delays. 

This setting aimed to:
(A) Simulate more realistic, batch-oriented transaction flows.
(B) Precisely identify the transaction volume at which auxiliary components (like the explorer) would exhibit performance degradation or failure.

Our re-programmed producer code is available at:

https://github.com/DigitClopedia2024/iroha_explorer_compose-05-2025-/blob/feature/Iroha-CLI-Integration/producer/mod.ts

(Original for comparison: https://github.com/DigitClopedia2024/iroha_explorer_compose-05-2025-/blob/feature/Iroha-CLI-Integration/producer/mod-original.ts)

Varying Transaction Rates/Block Sizes: We experimented with different TXS_CHUNK sizes and PUSH_DELAY intervals (e.g., 30 transactions/2000ms, and previously 50 transactions/1500ms). This was to determine if the issue was sensitive to transaction rate, block size, or overall accumulated transaction count.

Distinguishing Component Limitations: A key strategic aspect was to differentiate between the core blockchain's capabilities and the performance of auxiliary services like the block explorer.

**3.2. Key Findings & Evidence:*

*Core Iroha V2 Performance:* 
The core irohad blockchain nodes consistently demonstrated high performance and stability, successfully committing all submitted transactions even under significant load. We have observed that the blockchain itself reliably records all data.

*iroha2-block-explorer-backend Bottleneck:* 
The iroha2-block-explorer-backend (using its internal SQLite database) consistently and reliably hits a critical scalability limit at approximately 3,000 to 4,000 total transactions.

- Latest Test on 1st July 2025 (10 loops x 30 transactions/2000ms):
After ~2,970 successful transactions (40 blocks), the explorer frontend failed to display the subsequent batch for block 41.

- Prior Test on 29th July 2025 (20 loops x 50 transactions/1500ms): 
The same failure mode and error messages were observed consistently when total transactions approached the 3,000-4,000 range.

*Consistent Error Message:* 
In all instances of failure, the iroha_explorer_backend Docker logs repeatedly showed:

```ERROR iroha_explorer::database_update: Error while attempting to update the database. Will try again. err Failed to scan Iroha
Caused by:
0: error returned from database: (code: 1) too many SQL variables
1: (code: 1) too many SQL variables
Location: src/repo/from_iroha.rs:110:5
```

This error points to a fundamental limitation of SQLite when handling a large number of parameters in a single query or during bulk indexing operations, confirming the explorer's internal database as the bottleneck.

*Frontend Impact:* 
The iroha2-block-explorer-web (frontend) becomes unresponsive, displaying a "semi-transparent milky ring," as it cannot fetch data from the stalled backend.

*Producer Handshake Failures (Observed in earlier tests):* 
Separately, during earlier testing, attempting to reduce the stress by significantly increasing the PUSH_DELAY (e.g., from the default 1,500ms to 10-15 seconds) and lowering transactions per chunk (e.g., to 4 transactions) occasionally led to handshake failures or interruptions in the producer's data flow, sometimes resulting in blocks with zero hash values. This suggests sensitivities in the producer's interaction with the blockchain under certain timing conditions, and that simply slowing down the producer did not resolve all issues.

**4. Implications & Next Steps**

DiCL's findings indicate that while the core Iroha V2 blockchain is highly capable of handling our projected transaction volumes, the current iroha2-block-explorer-backend (with its SQLite implementation) is not suitable for our long-term, enterprise-scale needs for continuous indexing and real-time visibility beyond approximately 3,000-4,000 transactions. This bottleneck directly impacts our ability to showcase functionality for investors and leverage our content assets.

We are now reaching out to the Iroha V2 development team for immediate assistance and long-term architectural guidance.
