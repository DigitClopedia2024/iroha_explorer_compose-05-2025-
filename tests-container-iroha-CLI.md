# Iroha v2 Docker Compose Installation & CLI Verification Protocol

This document details the installation process and subsequent verification steps for a Hyperledger Iroha v2 blockchain environment, including its block explorer components (backend and web UI), and a dedicated Command Line Interface (CLI) container. The setup is orchestrated using Docker Compose.

The initial deployment attempt of the `iroha_cl_admin` service encountered a dependency error due to the main Iroha node (`irohad0`) not yet being healthy. This document outlines the resolution (a full restart of all services) and confirms the operational status of all containers.

Following the successful container bring-up, this protocol describes the methods used to confirm the correct installation and inter-container communication, specifically focusing on the Iroha CLI's ability to interact with the blockchain. Subsequent sections will log the execution and results of various CLI commands for registering domains, asset definitions, and querying blockchain state.

1. ***New Container Iroha CLI***

The container with Iroha CLI is being installed (with the command *sudo docker compose up \-d \--build iroha\_cli\_admin* ) ... and it seems the docker containers are all up now ...

Before we go inside the docker container and start to add new domains, token etc ...

```# Inside the CLI container  
command iroha-cli \\--peer irohad0:8080 \\--account\\\_id $CLI\\\_ACCOUNT\\\_ID \\--private\\\_key $CLI\\\_PRIVATE\\\_KEY instruction RegisterDomain '{"Domain": {"id": "my\\\_new\\\_domain"}}'
```
... is there an ***option to check if the installation of this new container went right*** ? 

First we used the command to see with the installaiotn of the docker container singularily ... if the dockerfile, the client.toml and new code lines in side the docker-compose.yml file are working:

```
sudo docker compose up \-d \--build iroha\_cli\_admin
```
Yet it didnt go smoothly, we got first an ***error message***:

*✔ iroha\_cl\_admin                                              Built       0.0s* 
*✘ Container iroha\_explorer\_compose-05-2025--irohad0-1         Error      83.4s* 
*✔ Container iroha\_explorer\_compose-05-2025--iroha\_cl\_admin-1  Created     2.4s* 

*dependency failed to start: container iroha\_explorer\_compose-05-2025--irohad0-1 is unhealthy*

Then we stopped all containers and with the command "start" all existing containers inclusive the new one came back:

```✔ Container iroha\_explorer\_compose-05-2025--iroha\_explorer\_web-1      Started7.2s 
✔ Container iroha\_explorer\_compose-05-2025--irohad1-1                 Started10.2s 
✔ Container iroha\_explorer\_compose-05-2025--irohad2-1                 Started4.1s 
✔ Container iroha\_explorer\_compose-05-2025--irohad3-1                 Started10.0s 
✔ Container iroha\_explorer\_compose-05-2025--iroha\_explorer\_backend-1  Started8.9s 
✔ Container iroha\_explorer\_compose-05-2025--irohad0-1                 Healthy23.4s 
✔ Container iroha\_explorer\_compose-05-2025--iroha\_cl\_admin-1          Started5.7s 
✔ Container iroha\_explorer\_compose-05-2025--producer-1                Started6.0s
```
… and checked with “docker ps”. It seems all relevant docker containers are up:

```CONTAINER ID   IMAGE                                                    COMMAND                   CREATED         STATUS                        PORTS                                                                           NAMES
----------------------------------------------------------

71c03a920877   iroha\_explorer\_compose-05-2025--iroha\_cl\_admin           "tail \-f /dev/null"       8 minutes ago   Up About a minute                                                                                             iroha\_explorer\_compose-05-2025--iroha\_cl\_admin-1

9359fee9b8bc   iroha\_explorer\_compose-05-2025--producer                 "/tini \-- docker-ent…"    12 hours ago    Up About a minute                                                                                             iroha\_explorer\_compose-05-2025--producer-1

1ad8bd08aa8d   hyperledger/iroha:2.0.0-rc.2.0                           "irohad"                  12 hours ago    Up About a minute                                                                                             iroha\_explorer\_compose-05-2025--irohad2-1

1ad2dfd0609d   iroha\_explorer\_compose-05-2025--iroha\_explorer\_web       "caddy run \--config …"    12 hours ago    Up About a minute             80/tcp, 443/tcp, 2019/tcp, 443/udp, 0.0.0.0:8124-\>8080/tcp, :::8124-\>8080/tcp   iroha\_explorer\_compose-05-2025--iroha\_explorer\_web-1

c0c46ab23ba5   iroha\_explorer\_compose-05-2025--iroha\_explorer\_backend   "/bin/sh \-c 'iroha\_e…"    12 hours ago    Up About a minute                                                                                             iroha\_explorer\_compose-05-2025--iroha\_explorer\_backend-1

2f93454316cc   hyperledger/iroha:2.0.0-rc.2.0                           "irohad"                  12 hours ago    Up About a minute                                                                                             iroha\_explorer\_compose-05-2025--irohad3-1

4678c684cc74   hyperledger/iroha:2.0.0-rc.2.0                           "/bin/sh \-c '\\n    EX…"   12 hours ago    Up About a minute (healthy)                                                                                   iroha\_explorer\_compose-05-2025--irohad0-1
```

2. ***Question:*** is there any chance to see, if the new container is healthy and can communicate with the others ? \- Or shall we just do a test, sneak into this container and try a registration of a new domain, token, token volume (minting) ? ... with all tests we regularly would do, see installation guide here:

[https://docs.iroha.tech/get-started/operate-iroha-2-via-cli.html](https://docs.iroha.tech/get-started/operate-iroha-2-via-cli.html)

It's good that all your containers are now showing "Up" and `irohad0-1` is "healthy"! 
The initial error (`irohad0-1 is unhealthy`) when you tried to start just `iroha_cl_admin` was expected. It means the `depends_on` condition correctly prevented the CLI container from starting before the main Iroha node was fully ready.

While `docker ps` confirms the `iroha_cl_admin` container is running, it doesn't confirm if the `iroha_client_cli` tool inside it can successfully communicate with the Iroha blockchain.

To verify your setup, the best approach is indeed to go inside the container and try a simple `iroha_client_cli` command.

Here's how you can do it:

(A) **Access the CLI container:** Open your terminal and run the following command to get an interactive shell inside your `iroha_cl_admin` container:

```Bash  
docker exec -it iroha_explorer_compose-05-2025--iroha_cl_admin-1 bash
```
(You can also use the shorter container ID if you prefer, like:)
```
docker exec -it 71c03a920877 bash
```

(B) **Run a test query:** Once you are inside the container's bash shell, you can use `iroha_client_cli`. Since your `client.toml` is configured with the `wonderland` domain admin's keys, a simple query should work without needing to specify `--peer`, `--account_id`, or `--private_key` on the command line (as `iroha_client_cli` will pick them up from the `IROHA_CLIENT_CONFIG` environment variable you set in the Dockerfile).

Try to query the `wonderland` domain:

```Bash  
iroha_client_cli query domain wonderland
```
If this command successfully returns information about the `wonderland` domain without errors (like connection refused or authentication failed), it means:

   * The `iroha_client_cli` is correctly installed and accessible.  
   * The `client.toml` is being found and parsed.  
   * The CLI container can successfully resolve `irohad0` and connect to its API on port `8080`.  
   * The provided account credentials are valid for querying.

(C) If that test works, you can then proceed with your `RegisterDomain`, `RegisterToken`, `MintToken` commands, and other tests you plan to run, as per the [Iroha documentation for operating via CLI](https://docs.iroha.tech/get-started/operate-iroha-2-via-cli.html).

3. ***Thats a good hint. Can we query also other data ? e.g. show all domains , or show all token or show all token volume ?***

… so we cant use the regular command as it is given for the Iroha V2 detaulf setting, e.g. if I want know what kind of domains then I go into the folder iwth the client.toml file, and there for exampleI just type

```
Bash
iroha domain list all
```

... and it shows all domains which are being registered ???

Yes, absolutely! The `iroha_client_cli` is designed to query a wide range of data on the Iroha blockchain. You can indeed query for all domains, assets (which Iroha refers to as "tokens"), and asset quantities (token volumes).

1. Here's the general structure for how you would query these types of data using `iroha_client_cli` from within your container:

**To show all Domains:**

```Bash  
iroha_client_cli query domains
```

**To show all Asset Definitions (Token Types):**

```Bash  
iroha_client_cli query asset_definitions
```

This will list the definitions of all registered assets (e.g. "xor #wonderland", "token_a #test").

**To show all Assets (Tokens) for a specific account:** To see the actual "token volume" or quantity of specific assets held by an account, you would query for assets belonging to a particular account:

```Bash  
iroha_client_cli query account_assets <account_id>
```

*  Replace `<account_id>` with the full ID of the account you want to inspect (e.g., `ed0120CE7FA46C9DCE7EA4B125E2E36BDB63EA33073E7590AC92816AE1E861B7048B03@wonderland`).

*Remember, as we discussed, you'll execute these commands after using `docker exec -it iroha_explorer_compose-05-2025--iroha_cl_admin-1 bash` to get a shell inside your CLI container.*

For more detailed information and all available query types, the [Iroha documentation on operating via CLI](https://docs.iroha.tech/get-started/operate-iroha-2-via-cli.html) is an excellent resource.

*We only asked, as such it is named on the intsallation page, citiatoin:*

To check that a configuration works, run the following query:

```bash
$ iroha domain list all
```
(Source: [https://docs.iroha.tech/get-started/operate-iroha-2-via-cli.html](https://docs.iroha.tech/get-started/operate-iroha-2-via-cli.html) )

***So from where we have now this iroha_client_cli ???*** As in the docker-composer.yml file we named the new service "iroha\_cl\_admin" ???

*You've hit on a common point of confusion when working with different versions of software and Docker\!* - Let's clear this up.

1. **`iroha_client_cli` vs. `iroha` (Executable Name):**  
   * The primary and official executable for the Iroha v2 command-line interface is named `iroha_client_cli`. This is the actual binary that is included in the `hyperledger/iroha` Docker image that you are using.  
   * It's possible that older versions of the documentation, or perhaps some simplified examples, might refer to it as just `iroha`, or there might be a wrapper script named `iroha` in certain environments that calls `iroha_client_cli` behind the scenes. However, to be precise and ensure compatibility with your `2.0.0-rc.2.0` image, `iroha_client_cli` is the command you should use.  
   * The `query domains` syntax is also the current and correct way to interact with the Iroha v2 API for listing all domains, rather than `domain list all`. Command syntaxes can evolve between release candidates.  
2. **`iroha_cl_admin` (Docker Service Name) vs. `iroha_client_cli` (Executable Name):**  
   * You are absolutely correct that you named your new service `iroha_cl_admin` in your `docker-compose.yml` file. This is the **name of the Docker service** (and container) as managed by Docker Compose.  
   * When you run `docker compose up iroha_cl_admin`, Docker Compose knows to build and start the container defined under that service name. When other services want to communicate with it, they might refer to it by `iroha_cl_admin` if it were a server.  
   * However, `iroha_cl_admin` is **not** the name of the executable *inside* the container. Just like a "web server" Docker container might be named `my_nginx_web_server` but runs the `nginx` executable inside it, your `iroha_cl_admin` container runs the `iroha_client_cli` executable.

So, to summarize:

* `iroha_cl_admin` is the **Docker service name**.  
* `iroha_client_cli` is the **actual command** you run *inside* that Docker container to interact with Iroha.  
* The syntax `iroha_client_cli query domains` is the correct way to list domains using the `2.0.0-rc.2.0` client.

I hope this clarifies the distinctions!
