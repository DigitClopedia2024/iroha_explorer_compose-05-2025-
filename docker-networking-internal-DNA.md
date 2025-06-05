# Docker Network Stability: Understanding and Troubleshooting DNS Resolution

This document addresses a common challenge in Docker Compose environments: "Temporary failure in name resolution," and how it impacts the stability of distributed applications like Hyperledger Iroha 2.0.

## 1. The Problem: Intermittent Peer Connectivity and "Temporary failure in name resolution"

During the deployment and operation of our Hyperledger Iroha 2.0 multi-node network via Docker Compose, we observed critical errors in the `irohad` service logs, such as:

```LOG
WARN run{listen_addr=0.0.0.0:1337 public_key=...}:run{connection="outgoing to irohad2:1339" conn_id=20}: iroha_p2p::peer::run: Failure during handshake. error=Io(Custom { kind: Uncategorized, error: "failed to lookup address information: Temporary failure in name resolution" })
```
This error indicates that an `irohad` node (e.g., `irohad0`) is unable to resolve the hostname of its peer (`irohad2`) into an IP address within the Docker network. This fundamental failure in name resolution prevents the crucial peer handshake from even initiating, leading to:

* **Inconsistent Block Production:** Some nodes commit blocks, while others fall behind or reject blocks due to `PrevBlockHeightMismatch` errors.
* **Fragmented Consensus:** Nodes fail to synchronize, leading to an unstable and unreliable blockchain state.
* **Explorer Discrepancies:** The blockchain explorer shows an incomplete or outdated view of the ledger.

## 2. Docker Networking: Strengths and "Fluctuations"

Docker Compose is designed to provide a stable and isolated networking environment for your services. It accomplishes this through:

### Strengths of Docker Networking

* **Automatic Service Discovery:** Services can refer to each other by their service names (e.g., `irohad0` can communicate with `irohad1`) without needing to know their dynamic IP addresses. Docker's internal DNS handles this.
* **Network Isolation:** Each Compose project gets its own isolated network by default, preventing conflicts with other Docker containers or the host network.
* **Simplified Configuration:** `docker-compose.yml` abstracts away complex network setup, making it easy to define inter-service communication.
* **Port Mapping:** Seamlessly exposes container ports to the host or other containers.

### Where "Fluctuations" and Resolution Issues Arise

Despite its strengths, "Temporary failure in name resolution" can occur due to various factors, often tied to transient conditions or resource management:

* **Race Conditions on Startup:** When multiple services start simultaneously (e.g., after `docker compose up`), a service might attempt to resolve another service's hostname before that service's container is fully initialized and its DNS entry is registered within Docker's internal resolver.
* **Resource Contention/Exhaustion:** If the host machine (or the Docker daemon itself) is under heavy load regarding CPU, memory, or disk I/O, Docker's internal DNS resolver can become sluggish or unresponsive, leading to timeouts during name lookups.
* **Transient Network Glitches:** Less common, but like any network, Docker's internal bridges and DNS can experience momentary stalls or hangups.
* **Docker Daemon Health:** A struggling or unhealthy Docker daemon can manifest in various ways, including issues with networking and DNS resolution.
* **External Network Interference:** While Docker networks are isolated, underlying host network issues, VPNs, or aggressive firewall rules *could* indirectly affect the Docker daemon's ability to manage its internal DNS.

## 3. Dealing with DNS Resolution Problems: Troubleshooting Steps

When facing "Temporary failure in name resolution" or general network flakiness in Docker Compose, consider these troubleshooting steps:

1.  **Full Docker System Restart (Most Common Fix):**
    This is often the quickest way to clear up transient Docker daemon issues, including its internal DNS cache and network state.
    ```bash
    # First, bring down your services
    sudo docker compose down --volumes

    # Then, restart the Docker daemon
    sudo systemctl restart docker

    # Wait a few seconds for Docker to fully come back online
    # Then, bring your services back up
    sudo docker compose up -d --build
    ```

2.  **Docker System Prune (for Hygiene):**
    Over time, Docker can accumulate unused images, containers, volumes, and networks. While less directly related to DNS resolution errors, cleaning up old resources can free up disk space and sometimes resolve subtle performance issues that contribute to network flakiness.
    ```bash
    sudo docker system prune -a --volumes
    ```
    **WARNING:** This command will remove *all* stopped containers, all networks not used by at least one container, all dangling images, and optionally all unused images and all unused volumes. Use with caution.

3.  **Check Host Resources:**
    Monitor your host machine's CPU, memory, and disk usage. If any of these are consistently high, it could explain Docker's performance issues.
    ```bash
    htop # for interactive process/resource monitoring
    df -h # for disk usage
    ```

4.  **Inspect Docker Network:**
    Examine the details of the network created by Docker Compose. This can reveal if there are any unexpected configurations or issues with IP addressing.
    ```bash
    sudo docker network ls
    # Find your project's default network (e.g., yourprojectname_default)
    sudo docker network inspect <your_project_network_name>
    ```

5.  **Utilize `depends_on` and `healthcheck` (for Readiness):**
    While your current `docker-compose.yml` likely uses these, ensure they are appropriately configured. `depends_on` (especially with `condition: service_healthy`) helps ensure services start in a logical order, giving dependencies time to become ready and register their DNS entries. A robust `healthcheck` in your Iroha services ensures that dependent services only attempt to connect when Iroha is truly listening and functional.

    Example from your `docker-compose.yml`:
    ```yaml
    # Example for a service that depends on irohad0
    iroha_explorer_backend:
      # ...
      depends_on:
        irohad0:
          condition: service_healthy
        irohad1:
          condition: service_healthy
        irohad2:
          condition: service_healthy
        irohad3:
          condition: service_healthy
    ```
    Ensure your `irohad` services themselves have solid `healthcheck` definitions.

## 4. Log File Analysis: A Case Study in Instability

Our log analysis from `docker-logs-all-nodes-05062025-1-txt.pdf` and `docker-logs-all-services-live-05062025-2-txt.pdf` clearly showed the combined effects of these network issues:

* **`Temporary failure in name resolution`:** This specific error indicates that at certain points, nodes like `irohad0` were unable to even find `irohad2` by name within the Docker network. This is a primary cause for handshakes not even beginning.
* **`Block committed` followed by `PrevBlockHeightMismatch`:** Even if some name resolutions succeed and some initial handshakes occur, the intermittent failures lead to nodes falling out of sync. When `irohad3` commits block 16, other nodes might not receive it, or might reject it if their local chain is at a different height (e.g., still at block 15 or earlier). This `PrevBlockHeightMismatch` error is a strong indicator of a fragmented network view among peers.
* **Explorer Discrepancy:** The blockchain explorer (which queries the Iroha nodes) only showing block 15 while logs show block 16 committed confirms the network's instability. If the explorer's connected node is one that's out of sync or can't consistently connect to the leader, it won't have the latest chain.

In conclusion, while Docker strives for stability, complex distributed systems require careful attention to potential transient network issues, especially during startup. Addressing the root cause of "Temporary failure in name resolution" is paramount for establishing a truly stable and synchronized Hyperledger Iroha 2.0 network. Once network connectivity is consistently reliable, ensuring `TRUSTED_PEERS` are always up-to-date (possibly via persistent volumes or automated key rotation) becomes the next step towards a robust production environment.
