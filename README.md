# Iroha Explorer Composer - Development & Testing Fork

This repository (`DigitClopedia2024/iroha_explorer_compose-05-2025-`) is a **development and testing fork** of the original [0x009922/iroha_explorer_compose](https://github.com/0x009922/iroha_explorer_compose) project.

**Status Quo:**
This fork is currently under active development and internal testing by the DigitClopedia2024 team. Our primary focus here is to:
* Address specific challenges related to **Iroha CLI integration** within the Docker Compose environment.
* Develop and test extensions that are not yet part of the upstream (original) repository.
* Document procedures, troubleshoot issues, and protocol our findings during this development phase.

---

**Important Disclaimer for Documentation:**

Please note that files within this repository, particularly documents like `[Iroha CLI (inside Iroha Composer - 28052025-1).md](https://github.com/DigitClopedia2024/iroha_explorer_compose-05-2025-/blob/feature/Iroha-CLI-Integration/Iroha%20CLI%20(inside%20Iroha%20Composer%20-%2028052025-1).md)` (or similar protocol files), are **internal discussion protocols and working notes**. They reflect our ongoing investigations, tests, and conversations.

**These documents are NOT intended as official or trustworthy installation guides, definitive architectural blueprints, or stable feature documentation for the original project.** They are raw, work-in-progress content and may contain unverified information, preliminary findings, or specific configurations relevant only to our current testing environment.

---

**Contribution & Collaboration:**
While this fork is primarily for our internal development efforts, we welcome constructive feedback and discussions. If you are a developer interested in similar challenges or contributing to our efforts, please feel free to open an issue or reach out.

**Original Project:**
For the stable and official version of the Iroha Explorer Composer, please refer to the [original repository here](https://github.com/0x009922/iroha_explorer_compose).

---

# iroha_explorer_compose

Sample Docker Compose configuration for Iroha + Iroha Explorer (backend & web) + sample data producer (TODO).

## Usage

**Prerequisites:** Docker and Docker Compose (or podman-compose).

1. Clone the repo (with `--recurse-submodules`)
2. Run docker compose
3. Open http://localhost:8124 for the main frontend (http://localhost:8124/api/docs for interactive backend API docs)

```shell
git clone --recurse-submodules https://github.com/0x009922/iroha_explorer_compose
docker-compose up # or podman-compose
```

### On ARM

Iroha does not yet provide an image built for arm64 architecture ([tracking issue](https://github.com/hyperledger-iroha/iroha/issues/4687)). Thus, it will not work on e.g. Mac M* machines.

As a workaround, it is possible to build the image locally:

```shell
git clone https://github.com/hyperledger-iroha/iroha.git
cd iroha
docker build -t hyperledger/iroha:2.0.0-rc.2.0 .
```

It will build an image with the local architecture and this docker compose must run afterwards.
