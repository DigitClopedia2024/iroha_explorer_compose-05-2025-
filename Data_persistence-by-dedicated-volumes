# README: Iroha V2 Persistent Blockchain Data (Docker Compose)

This document addresses a critical operational issue within the `iroha_explorer_compose` Docker Compose setup: **the loss of blockchain data when Iroha V2 containers are removed or recreated.** This issue manifests as containers getting stuck in "waiting" states or becoming "unhealthy" during startup, especially when other services attempt to interact with a seemingly empty or uninitialized blockchain.

## Introduction & Context

For any production-ready blockchain system, particularly one managing high-value assets (7-8 figures), **data persistence is non-negotiable.** Without it, every time your `irohad` (Iroha node) containers are restarted or rebuilt, the entire blockchain ledger, history, and state are wiped clean. This leads to:

* **Data Loss:** All previously committed blocks and transactions are lost.
* **Operational Instability:** Nodes cannot resume from a known state, leading to prolonged initialization, inconsistent behavior, and "unhealthy" statuses as other services expect a functioning chain.
* **Lack of Auditability:** The continuous loss of historical data makes auditing impossible.

This document provides a crucial solution by guiding you through the process of adding dedicated persistent volumes for your Iroha V2 blockchain data within the Docker Compose environment. This complements previous `healthcheck` adjustments, providing a more fundamental fix for node stability.

## The Problem: Non-Persistent Data

In your current `docker-compose.yml`, the `volumes` configuration for `irohad0` (and likely `irohad1`, `irohad2`, `irohad3`) includes: `- ./config:/config:ro`. This entry correctly mounts your local `config` directory into the container as read-only, which is suitable for immutable configuration files.

However, this configuration **does not store the blockchain's mutable data**. The actual blocks, transaction history, and node state are written to a different directory inside the container (commonly `/var/lib/iroha` for Iroha V2). Without a specific volume mapping for this data directory, Docker treats it as ephemeral storage. Consequently, when `docker compose up -d` is run (which often recreates containers), or even sometimes `docker compose start` attempts to resume a container instance that started from an empty state due to previous recreation, the node finds an empty ledger. This leads to:

* `irohad0` (and other nodes) getting stuck in a "waiting" state.
* Eventually transitioning to "unhealthy" because it cannot fully initialize or meet the expectations of dependent services like `producer` or `iroha_cl_admin` (which expect an active blockchain).

## Prerequisites

Before proceeding, ensure you have:

* **Docker and Docker Compose** installed and configured in your environment (e.g., VirtualBox/Debian 12).
* **Access to the `docker-compose.yml` file** for this Iroha V2 setup in your repository.

## Solution: Implementing Persistent Volumes for Iroha Nodes

To ensure your blockchain data is never lost and your Iroha nodes can reliably restart from their last known state, you must add dedicated persistent volumes. The common internal data path for Iroha V2 nodes is `/var/lib/iroha`.

You have two main options for implementing these volumes:

### Option 1: Docker Named Volumes (Recommended)

This is the preferred method for managing persistent data with Docker Compose. Docker handles the creation and management of these volumes, making your setup more portable across different environments.

1.  **Define Named Volumes:** Add a `volumes` section at the top level of your `docker-compose.yml` (usually after `services:` and before `networks:`). Define a unique named volume for each Iroha node (`irohad0`, `irohad1`, `irohad2`, `irohad3`) to ensure their data is isolated.

    ```yaml
    # Add this section at the top level of your docker-compose.yml
    # (e.g., directly below the 'services:' block, before 'networks:')
    volumes:
      iroha_data_0:
      iroha_data_1:
      iroha_data_2:
      iroha_data_3:
    ```

2.  **Mount Named Volumes to Services:** Update the `volumes` section for *each* `irohad` service (`irohad0`, `irohad1`, `irohad2`, `irohad3`) to mount its respective named volume to the Iroha data path (`/var/lib/iroha`) inside the container.

    ```yaml
    services:
      irohad0:
        # ... your existing irohad0 configuration ...
        volumes:
          - ./config:/config:ro
          - iroha_data_0:/var/lib/iroha # Add this line
        # ... rest of irohad0 config ...

      irohad1:
        # ... your existing irohad1 configuration ...
        volumes:
          - ./config:/config:ro
          - iroha_data_1:/var/lib/iroha # Add this line
        # ... rest of irohad1 config ...

      irohad2:
        # ... your existing irohad2 configuration ...
        volumes:
          - ./config:/config:ro
          - iroha_data_2:/var/lib/iroha # Add this line
        # ... rest of irohad2 config ...

      irohad3:
        # ... your existing irohad3 configuration ...
        volumes:
          - ./config:/config:ro
          - iroha_data_3:/var/lib/iroha # Add this line
        # ... rest of irohad3 config ...
    ```

### Option 2: Bind Mounts to Host Directories

This option mounts a specific directory on your host machine directly into the container. This makes it easy to inspect the data on your host, but it can be less portable and requires you to manage the host directories.

* **Mount Host Directories to Services:** Update the `volumes` section for *each* `irohad` service (`irohad0`, `irohad1`, `irohad2`, `irohad3`) to create a distinct data directory on your host and mount it to `/var/lib/iroha` inside the container.

    ```yaml
    services:
      irohad0:
        # ... your existing irohad0 configuration ...
        volumes:
          - ./config:/config:ro
          - ./data/irohad0:/var/lib/iroha # Add this line. Creates 'data/irohad0' in your project root.
        # ... rest of irohad0 config ...

      irohad1:
        # ... your existing irohad1 configuration ...
        volumes:
          - ./config:/config:ro
          - ./data/irohad1:/var/lib/iroha # Add this line
        # ... rest of irohad1 config ...

      irohad2:
        # ... your existing irohad2 configuration ...
        volumes:
          - ./config:/config:ro
          - ./data/irohad2:/var/lib/iroha # Add this line
        # ... rest of irohad2 config ...

      irohad3:
        # ... your existing irohad3 configuration ...
        volumes:
          - ./config:/config:ro
          - ./data/irohad3:/var/lib/iroha # Add this line
        # ... rest of irohad3 config ...
    ```
    **Note:** For bind mounts, ensure the specified host directories (e.g., `./data/irohad0`) exist in the same location as your `docker-compose.yml` file, or Docker Compose will create them automatically.

## Step-by-Step Implementation Guide

Follow these steps to apply the persistent volume configuration to your Iroha V2 setup:

1.  **Choose a Volume Option:** Decide whether you want to use Docker Named Volumes (recommended) or Bind Mounts to Host Directories.
2.  **Edit `docker-compose.yml`:**
    * If using **Docker Named Volumes**, add the top-level `volumes:` section as shown in Option 1.
    * For **both** options, update the `volumes:` section for *each* of your `irohad0`, `irohad1`, `irohad2`, and `irohad3` services, adding the new line that maps the persistent data path to `/var/lib/iroha` (or your specific Iroha data path).
3.  **Save the `docker-compose.yml` file.**
4.  **Apply Changes and Recreate Containers:**
    * It is **CRUCIAL** to stop and remove your existing containers so that new ones can be created with the correct volume attachments.
    * Open your terminal in the directory where your `docker-compose.yml` file is located and run:
        ```bash
        docker compose down # This stops and removes ALL current containers and their non-persisted data.
        docker compose up -d --build # This will create brand new containers with the volumes attached and start them.
        ```
    * The `--build` flag ensures that if any image definitions have changed, they are rebuilt, and it guarantees that new containers are created with your updated volume configurations.

## Verification

After executing `docker compose up -d --build`:

1.  **Check Container Status:**
    ```bash
    docker ps
    ```
    Verify that all `irohad` containers are in a `healthy` state (this may take some time depending on your `healthcheck` settings).

2.  **Check Logs:**
    ```bash
    docker logs irohad0 # Check logs for irohad0, then other irohad nodes
    ```
    Look for messages indicating successful initialization and block production without errors related to missing data.

3.  **Confirm Data Persistence:**
    * Let the system run for a bit, creating some blocks/transactions.
    * Then, stop all services: `docker compose stop`
    * Start them again: `docker compose start`
    * Verify that the blockchain state (e.g., block height, existing assets) is preserved and the nodes do not start from an empty ledger.

By implementing these persistent volumes, you establish a foundational layer of data integrity, significantly improving the stability and reliability of your Iroha V2 blockchain environment. This is a vital step towards building the robust and auditable system required for high-value asset management.
