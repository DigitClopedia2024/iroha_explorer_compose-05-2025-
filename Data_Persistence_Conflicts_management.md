**Iroha Explorer Compose Project: Ensuring Robustness & Stability**

This document details critical configurations and operational practices to eliminate "race effects" and "conflicts" during startup, guarantee data integrity, and maintain continuous oversight of your Hyperledger Iroha 2 blockchain network.

**Table of Contents**

Project Overview
Critical: Data Persistence with Bind Mounts
Why Persistence Matters
Implementing Bind Mounts
Essential: Host Directory Permissions
Eliminating Startup Conflicts: Controlled Initialization
Understanding the "Race Effect" and "Race Competition"
The Solution: depends_on with condition: service_healthy
Step-by-Step: Configuring Health Checks
Step-by-Step: Defining Service Dependencies
Why This Approach is Crucial for High-Value Systems
Essential Operational Practices: Monitoring & Logging
The Non-Negotiable Need for Visibility and Control
How to Monitor Your Docker Containers
What to Look For in Iroha Logs (Blockchain Health)
Log Persistence Strategy for Audit & Analysis
Current Status: Known Issues & Troubleshooting
The Odd/Even Block Commitment Anomaly

**Initial Troubleshooting for Consensus Issues**

1. **Project Overview**

This repository outlines a Docker Compose setup for a local Hyperledger Iroha 2 network. It includes multiple Iroha nodes (irohad0, irohad1, irohad2, irohad3), a transaction producer, an iroha_cl_admin tool, and a web-based Iroha Explorer. Our focus here is on the architectural and operational robustness required for a high-integrity blockchain system.

2. Critical: **Data Persistence with Bind Mounts**

For any blockchain managing high-value assets, consistent data persistence is not optional; it's a fundamental requirement. Without it, the entire history of transactions and blocks is lost upon container restarts, rendering the system unreliable.

**Why Persistence Matters**

*Data Integrity & Immutability:* Ensures the blockchain's history is permanently stored and can be fully recovered.
*System Resiliency:* Allows for graceful shutdowns, planned maintenance, and rapid recovery from unexpected failures without data loss.
*Operational Continuity:* Avoids time-consuming re-initialization of the chain and re-submission of historical data.

**Implementing Bind Mounts**

We employ Docker bind mounts to create a direct link between directories inside our Iroha containers (where the blockchain data resides) and dedicated directories on our host machine.

**Create Host Directories:** Before starting our services, its relevant to ensure the necessary directories exist on our host. From our project's root directory:

```Bash

mkdir -p ./data/irohad0 ./data/irohad1 ./data/irohad2 ./data/irohad3
```
Docker Compose will also create these if they don't exist, but manual creation allows for pre-setting permissions.

**Update** docker-compose.yml: For each irohad service, modify its volumes section. The crucial internal path for Iroha V2 data is /storage:

```YAML

services:
  irohad0:
    # ... other configurations ...
    volumes:
      - ./config:/config:ro
      - ./data/irohad0:/storage # This line ensures persistence

  irohad1:
    # ...
    volumes:
      - ./config:/config:ro
      - ./data/irohad1:/storage

  # Repeat for irohad2 and irohad3
```

Essential: **Host Directory Permissions**
For Iroha containers to correctly write data to the bind-mounted host directories, proper permissions are mandatory. Container processes often run as non-root users, requiring write access to these locations.

Action: After creating the directories (or your first docker compose up), execute this command from your project's root:

```Bash

sudo chown -R $USER:$USER ./data
```

This command recursively assigns ownership of the ./data directory and its contents to your current user, granting the necessary write permissions.

3. **Eliminating Startup Conflicts: Controlled Initialization**

In a blockchain network, a "fast boost" startup where all services launch simultaneously can lead to what we term a "race effect" or "race competition." This manifests as services attempting to interact with dependencies (like Iroha nodes) before they are fully operational, synchronized, or capable of processing requests. This often results in connection errors, timeouts, and system instability, as observed with our odd/even block commitment anomaly.

**Understanding the "Race Effect" and "Race Competition"**
Think of it like starting a complex, high-performance engine in a critical system (e.g., an aircraft or commercial ship). You wouldn't simply hit a single "start" button. Instead, you follow a precise checklist: primer, fuel pumps, magnetos, oil pressure check, battery check, and then sequentially engage components. Each step is verified before proceeding to the next.

Without this phased approach, Docker Compose, by default, will launch all services in parallel. This creates a "**race**" where:

Iroha nodes might still be establishing peer-to-peer connections, synchronizing, or building initial blocks.
Dependent services like the producer or iroha_cl_admin might try to send transactions or queries to an Iroha node that isn't yet ready, leading to failures.
The iroha_explorer_backend might attempt to fetch data from an unresponsive Iroha node, and the iroha_explorer_web might fail if the backend isn't up.

**This chaotic startup is unacceptable for systems handling significant financial value.**

The Solution: depends_on with condition: *service_healthy*

Docker Compose provides built-in mechanisms to enforce a controlled, sequential, and verified startup, mimicking your desired "pre-flight checklist" for each service.

*Health Checks* (healthcheck): Define a health check for each critical service. This check determines if a service is truly "ready" and fully functional, not just "running."
*Dependencies* (depends_on with condition: service_healthy): Configure services to explicitly wait for their dependencies to report as healthy before they themselves attempt to start.
*Step-by-Step:* Configuring Health Checks

For each irohad service (irohad0, irohad1, irohad2, irohad3), ensure its API_ADDRESS is correctly set and then add a healthcheck section. Adjust the API_ADDRESS port (e.g., 8080 for irohad0, 8081 for irohad1, etc.) within both the environment and healthcheck sections:

```YAML

services:
  irohad0:
    # ... other configurations ...
    environment:
      # ... existing Iroha config ...
      API_ADDRESS: 0.0.0.0:8080 # This is the port the healthcheck will target
      # ...
    healthcheck:
      test: ["CMD", "curl", "-f", "http://127.0.0.1:8080/status/blocks"] # Checks if Iroha API is responsive
      interval: 5s    # Check every 5 seconds
      timeout: 2s     # Fail if no response within 2 seconds
      retries: 30     # How many times to retry before declaring the service 'unhealthy'
      start_period: 20s # Initial grace period before health checks begin (give Iroha time to boot)
  
  # Repeat the above healthcheck configuration for irohad1 (port 8081), irohad2 (port 8082), and irohad3 (port 8083)
  irohad1:
    environment:
      API_ADDRESS: 0.0.0.0:8081
    healthcheck:
      test: ["CMD", "curl", "-f", "http://127.0.0.1:8081/status/blocks"]
      interval: 5s; timeout: 2s; retries: 30; start_period: 20s
  # ... and so on for irohad2, irohad3

  # If iroha_explorer_web depends on iroha_explorer_backend, the backend also needs a healthcheck:
  iroha_explorer_backend:
    # ... existing config ...
    healthcheck:
      test: ["CMD", "curl", "-f", "http://127.0.0.1:8080/health"] # Example: replace with actual backend health endpoint
      interval: 5s
      timeout: 2s
      retries: 10
      start_period: 10s
```

Step-by-Step: **Defining Service Dependencies**

Apply the depends_on configurations to ensure a robust startup order:

```YAML

services:
  # ... (irohad0, irohad1, irohad2, irohad3 configurations with healthchecks) ...

  producer:
    # ... existing configuration ...
    depends_on:
      irohad0: # The producer must wait for at least one Iroha node to be fully healthy
        condition: service_healthy
      # If your producer requires a quorum of nodes to be healthy to operate reliably,
      # add the other irohad nodes here as well:
      # irohad1:
      #   condition: service_healthy
      # irohad2:
      #   condition: service_healthy
      # irohad3:
      #   condition: service_healthy

  iroha_cl_admin:
    # ... existing configuration ...
    depends_on:
      irohad0: # CLI tools also need a healthy node to connect to
        condition: service_healthy
      # Add other irohad nodes if CLI operations require full network quorum.

  iroha_explorer_backend:
    # ... existing configuration ...
    depends_on:
      irohad0: # The explorer backend needs a healthy Iroha node to fetch blockchain data
        condition: service_healthy

  iroha_explorer_web:
    # ... existing configuration ...
    depends_on:
      iroha_explorer_backend: # The web frontend must wait for its backend to be healthy
        condition: service_healthy
```

After making these docker-compose.yml changes, initiate your network with:

```Bash

sudo docker compose up -d
```

**Why This Approach is Crucial for High-Value Systems !!**

This systematic approach directly addresses the concerns of a controlled "boot procedure" to fire up the Iroha blockchain system and its compotents (backend, frontend) in a controlled manner:

*Controlled Sequence:* Each component starts only after its prerequisites are fully validated.
*Risk Mitigation:* Eliminates unknown states and reduces the likelihood of transient failures caused by unprepared dependencies.
*Predictable Behavior:* Ensures the blockchain network consistently starts in a stable, operational state, much like a meticulously executed pre-flight checklist guarantees a safe engine start.
*Enhanced Trust:* For systems handling significant financial value, predictability and robust operational procedures are paramount for user and stakeholder confidence.

4. Essential Operational Practices: **Monitoring & Logging**
 
Operating any system, especially a blockchain handling high-value assets, without continuous monitoring and diligent log filing is akin to **flying blind**. It's a non-negotiable aspect of responsible system management.

**The Non-Negotiable Need for Visibility and Control**

Proactive Issue Detection: Identify problems (e.g., consensus stalls, resource exhaustion, network anomalies) before they impact operations.
Rapid Troubleshooting: Logs are your primary diagnostic tool, providing granular details about system behavior.
Performance Optimization: Monitor resource usage to fine-tune configurations and prevent bottlenecks.
Security & Audit: Maintain an immutable record of system events, crucial for forensic analysis, compliance, and auditing.

**How to Monitor Your Docker Containers**

Verify Running Containers:
```Bash

sudo docker ps
This command shows the status of all active containers, including their STATUS (e.g., Up X minutes (healthy)), indicating they've passed their health checks.
Real-time Resource Utilization:
```Bash
sudo docker stats
```
**Provides live metrics (CPU %, MEM USAGE, Network I/O, Disk I/O) for all running containers !** - Use this to identify any service experiencing resource bottlenecks or unusual spikes.
View Service Logs: The docker compose logs command is your window into what each service is doing.
View logs for a specific service:
```Bash
sudo docker compose logs <service_name>
```
# Example: sudo docker compose logs irohad0
Follow logs in real-time (highly recommended for live debugging):
```Bash
sudo docker compose logs -f <service_name>
```
# Example: sudo docker compose logs -f irohad3

View combined logs from all services:

```Bash
sudo docker compose logs -f
```

**What to Look For in Iroha Logs (Blockchain Health) ?**
When analyzing your irohad node logs (e.g., irohad3-1):

INFO consensus: iroha_core::sumeragi::main_loop: Block committed: The ultimate confirmation that a block was successfully added to the blockchain. This is the "all clear" signal.
INFO consensus: iroha_core::sumeragi::main_loop: Block received: Indicates a block was proposed and received by the node, but does not guarantee it was committed to the local ledger.
INFO consensus: iroha_core::sumeragi::main_loop: View changed to X: This is a critical indicator of a consensus failure. It means the current consensus round (view) could not finalize a block, often due to timeouts, a lack of quorum (not enough validators responding in time), or a leader failure. Frequent "view changes" point directly to network instability or node health issues.

*Error/Warning Messages:* Any lines marked ERROR, WARN, or DEBUG provide crucial context about internal service problems, misconfigurations, or external communication issues.
*Peer Connectivity:* Messages detailing successful or failed connections to TRUSTED_PEERS are important for network health.

**Log Persistence Strategy for Audit & Analysis**
While docker compose logs is good for immediate viewing, for long-term auditing, troubleshooting, and compliance, you need to persist logs beyond container lifecycles:

*Docker Logging Drivers:* Configure Docker Compose to use a robust logging driver (e.g., json-file with log rotation for local storage, or syslog, fluentd to forward logs to external systems).
*Centralized Log Aggregation:* For a multi-node, high-stakes system, consider implementing a centralized logging solution (e.g., ELK Stack, Grafana Loki, Splunk). This allows you to collect, index, visualize, and analyze logs from all services in one place, greatly simplifying auditing and large-scale troubleshooting.

5. Current Status: **Known Issues & Troubleshooting**

*The Odd/Even Block Commitment Anomaly*

*Observation:* The Iroha Web UI Explorer currently displays only odd-numbered blocks. Logs from irohad nodes confirm that even-numbered blocks are "received" and voted on, but are not committed, leading to consistent "View changed" messages for those blocks.
*Root Cause Hypothesis:* This behavior strongly indicates an intermittent failure within the Iroha Sumeragi consensus algorithm, specifically impacting the rounds responsible for finalizing even-numbered blocks. This could be due to:
*Consensus Timeout:* Nodes (especially the designated leader for even blocks) not responding within the required timeframes.
*Subtle Network Instability:* Minor, transient network delays or packet loss between peers preventing a quorum for even blocks.
*Resource Constraints:* A specific node responsible for leading even-block consensus rounds might be intermittently CPU/memory-starved.
*TRUSTED_PEERS Configuration Errors:* Even a minor mismatch in public keys or addresses in the TRUSTED_PEERS list can silently disrupt communication.

**Initial Troubleshooting for Consensus Issues**
When faced with consensus issues, systematically verify the following: **Re-verify TRUSTED_PEERS Configuration** (Highly Critical)
*Absolute Precision:* Ensure that the PUBLIC_KEY environment variable for each irohad node is an exact match for how it appears in the TRUSTED_PEERS list of all other irohad nodes (and its own, if included by design). Even a single character typo invalidates trust.
*Correct Addresses:* Confirm that the peer_id@service_name:port entries in TRUSTED_PEERS are correct and resolvable within the Docker network (e.g., irohad0:1337, irohad1:1338, etc.).
*Monitor docker stats closely:* While the system is running and exhibiting the odd/even block problem, continuously run sudo docker stats. Look for any irohad container that shows:
- Consistently high CPU usage (e.g., near 100% or more than 1 core).
- Frequent CPU throttling.
- High memory usage (approaching its allocated limit).
- Unusual network I/O patterns.
- Adjust Health Check & Consensus Timeouts (Experimental): While the healthcheck start_period helps startup, you might experiment with slightly increasing the interval and timeout values in the healthcheck definition for irohad services. This provides more leeway for nodes to respond during consensus. Iroha also has internal consensus timeouts, which might need to be adjusted via environment variables if the network is inherently slow, but this is a more advanced step.

By applying these rigorous configurations and maintaining continuous operational vigilance, you will build a blockchain system that meets the highest standards of reliability and security, akin to the meticulously controlled environments you are accustomed to.
