# Peer Communication and Network Stability in Hyperledger Iroha 2.0 Docker Compose

This document details a critical configuration aspect for running a stable Hyperledger Iroha 2.0 network using Docker Compose. It addresses common issues related to peer communication, leading to inconsistent block production and `handshake` failures.

## 1. The Problem: Inconsistent Block Production and Handshake Failures

During our development and testing phase, we observed peculiar behavior in our Iroha 2.0 network deployed via Docker Compose. Specifically:

* **Inconsistent Block Numbers:** The blockchain would sometimes register only odd or only even block numbers, rather than a continuous sequence.
* **"Failure during handshake" Errors:** Analysis of the `irohad` container logs (`docker-compose-log-iroha0-03062025-1-txt.pdf`, `docker-logs-all-services-after-start-04062025-1-txt.pdf`, `docker-logs-all-services-after-stopped-04062025-1-txt.pdf`) consistently showed `Failure during handshake` errors between Iroha peer nodes.

This issue directly impacted the network's ability to form consensus and produce blocks reliably, causing significant delays in our development process.

## 2. Understanding Peer Integration in Iroha 2.0

While Docker Compose creates an internal network allowing containers to communicate by service name, the Hyperledger Iroha blockchain has its own application-level Peer-to-Peer (P2P) network. For Iroha nodes to participate in consensus and synchronize the ledger, they need explicit instructions on how to discover and connect to their fellow peers.

### Reference: Original Hyperledger IrohaV2 `docker-compose.yml`

Upon reviewing the official Iroha 2.0 Docker Compose configuration (e.g., `original-IrohaV2-docker-compose-yml-file.pdf`), we identified a crucial mechanism for peer discovery: the `TRUSTED_PEERS` environment variable.

Here's an example snippet from the original configuration (e.g., for `irohad0`), showing how it explicitly lists other peers:

```yaml
services:
  irohad0:
    # ... other configuration ...
    environment:
      # ... other environment variables ...
      P2P PUBLIC ADDRESS: irohad0:1337
      P2P ADDRESS: 0.0.0.0:1337
      API ADDRESS: 0.0.0.0:8080
      # CRITICAL: Explicit list of trusted peers with their public keys
      TRUSTED PEERS:
        [
          "ed0120A98BAFB0663CE08075EBD506FEC38A84E576A7C9B0897693ED4B04FD9EF20180@irohad0:1337",
          "ed01204EE2E36BDB63EA33073E7590AC92816AE1E861B7048803@irohad1:1338",
          "ed01209897952014BDFAEA780087C38FF3EB800CB20B882748FC95A575ADB9CD2CB21D@irohad2:1339",
          "ed01204164BF554923ECE1FD412D2410360863A6AE430476C89824888237077534CFC4@irohad3:1340"
        ]
    # ... rest of irohad0 service ...
```
This TRUSTED_PEERS variable explicitly informs each node about the public keys and addresses of all other nodes in the network, enabling secure and reliable peer discovery and handshake initiation.

## 3. Analysis of Our docker-compose.yml (The Discrepancy)
Our existing docker-compose.yml file (e.g., docker-compose-04062025-11-yml-txt.pdf), which we have continuously refined with additional services (Iroha CLI, producer, health checks, dependencies), lacked this crucial TRUSTED_PEERS (or a similar PEERS) environment variable for the irohad services.

This absence meant that while Docker provided the underlying network connectivity, the Iroha application itself within each container did not have the explicit list of its peers, leading to the repeated Failure during handshake errors and network instability.

## 4. Discussed Alternatives for Peer Discovery
During our troubleshooting, we considered two main approaches for configuring peer discovery:

**Option A:** TRUSTED_PEERS with Persistent Keys (Recommended for Production)
*Mechanism:* Uses the TRUSTED_PEERS variable, including the public key of each peer along with its address (e.g., public_key@host:port). This provides strong cryptographic identity verification.
- Pros: Highly secure and robust.
- Cons (for current testing): If Iroha nodes regenerate their key pairs on every docker compose down --volumes && up --build (which happens without persistent volumes), manually updating the TRUSTED_PEERS list becomes a cumbersome manual task, especially for many nodes. While persistent Docker volumes can solve this, our current testing setup prioritizes direct host access to data for debugging.

**Option B:** PEERS (Host:Port Only) - Chosen for Current Development/Testing
*Mechanism:* Uses a simpler PEERS variable, listing only the host and P2P port of each peer (e.g., irohad1:1338,irohad2:1339).
- Pros: Simpler to manage in a development environment, fully automated on rebuilds (no key management required).
- Cons: Less secure than TRUSTED_PEERS as it does not include public key verification at this layer of peer discovery.

## 5. Implemented Solution for This Repository
For our current development and testing phase, prioritizing rapid iteration and automation over the complexity of dynamic key management with TRUSTED_PEERS during frequent rebuilds, we have chosen Option B: Using the PEERS environment variable with host:port addresses.

This will provide the necessary explicit peer list to allow our Iroha nodes to communicate and form a stable network.

**Action:** Modify docker-compose.yml
You need to add the PEERS environment variable to the environment section of each irohad service (irohad0, irohad1, irohad2, irohad3).

Example modification for irohad0 (apply similarly for others):

```YAML

services:
  irohad0:
    image: hyperledger/iroha:2.0.0-rc.2.0
    environment:
      CHAIN: 00000000-0000-0000-0000-000000000000
      PUBLIC KEY: ed012004F79C976A13CFBD72DBBAA255C657E92655E95D8FBD21C0A1578536F5685CCE
      PRIVATE KEY: 802620834BCEC4477C62ABC9EFBB6B147A5699CAFEE223DF385A8C53D9EBD320A8DBBF
      P2P PUBLIC ADDRESS: irohad0:1337
      P2P ADDRESS: 0.0.0.0:1337
      API ADDRESS: 0.0.0.0:8080 # This is the port the healthcheck will target
      GENESIS PUBLIC KEY: ed0120A5F4F231A1E8ACA399ACC5D967C37A6724E3133D4F5A6D63E63B48F0E2A2E6E2D
      # ADD THIS NEW LINE TO EXPLICITLY LIST PEERS:
      PEERS: irohad1:1338,irohad2:1339,irohad3:1340 # List all OTHER peers
    # ... rest of irohad0 service ...

  irohad1:
    image: hyperledger/iroha:2.0.0-rc.2.0
    environment:
      # ... other common environment variables ...
      P2P PUBLIC ADDRESS: irohad1:1338
      P2P ADDRESS: 0.0.0.0:1338
      API ADDRESS: 0.0.0.0:8081
      # ADD THIS NEW LINE:
      PEERS: irohad0:1337,irohad2:1339,irohad3:1340 # List all OTHER peers
    # ...

  irohad2:
    image: hyperledger/iroha:2.0.0-rc.2.0
    environment:
      # ... other common environment variables ...
      P2P PUBLIC ADDRESS: irohad2:1339
      P2P ADDRESS: 0.0.0.0:1339
      API ADDRESS: 0.0.0.0:8082
      # ADD THIS NEW LINE:
      PEERS: irohad0:1337,irohad1:1338,irohad3:1340 # List all OTHER peers
    # ...

  irohad3:
    image: hyperledger/iroha:2.0.0-rc.2.0
    environment:
      # ... other common environment variables ...
      P2P PUBLIC ADDRESS: irohad3:1340
      P2P ADDRESS: 0.0.0.0:1340
      API ADDRESS: 0.0.0.0:8083
      # ADD THIS NEW LINE:
      PEERS: irohad0:1337,irohad1:1338,irohad2:1339 # List all OTHER peers
    # ...
```
**Deployment Steps:**
After making these changes to your docker-compose.yml:
1. Save the file as docker-compose.yml in your project root.
2. Bring down your current setup and rebuild:
```Bash
sudo docker compose down --volumes
sudo docker compose up -d --build
```
*Monitor Logs:* Observe the irohad container logs for consistent block production and an absence of Failure during handshake errors:
```Bash
sudo docker compose logs -f irohad0 irohad1 irohad2 irohad3
```
## 6. Future Considerations
While the PEERS (host:port) approach addresses immediate stability needs for our test environment, scalability for a large number of nodes (20+) and robust security in production will require further steps:

*Persistent Node Identities:* Implementing Docker named volumes for Iroha's data directories will ensure nodes retain their key pairs across restarts, allowing for the use of TRUSTED_PEERS (with public keys) for enhanced security.
*Automated Peer Discovery:* For very large, dynamic networks, industry-standard solutions rely on bootstrap/seed nodes and gossip protocols (or DHTs) for automated peer discovery, avoiding the need to manually list every single peer. This would be a future step for production deployments.
