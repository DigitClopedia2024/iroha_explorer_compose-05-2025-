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
