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
