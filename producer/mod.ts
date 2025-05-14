import { Client } from "@iroha/client";
import * as types from "@iroha/core/data-model";
import { assert } from "@std/assert";
import { delay } from "@std/async";

const TORII_URL = Deno.env.get("TORII_URL");
assert(TORII_URL, "Please set TORII_URL env var");

const TXS_CHUNK = 20;
const PUSH_DELAY = 100;

const CHAIN = `00000000-0000-0000-0000-000000000000`;
const ACCOUNT = `ed0120CE7FA46C9DCE7EA4B125E2E36BDB63EA33073E7590AC92816AE1E861B7048B03@wonderland`;
const ACCOUNT_PRIVATE_KEY = `802620CCF31D85E3B32A4BEA59987CE0C78E3B8E2DB93881468AB2435FE45D5C9DCD53`;

const client = new Client({
  chain: CHAIN,
  authority: types.AccountId.parse(ACCOUNT),
  authorityPrivateKey: types.PrivateKey.fromMultihash(ACCOUNT_PRIVATE_KEY),
  toriiBaseURL: new URL(TORII_URL),
});

console.info("Producing dummy transactions...");
while (true) {
  await produceChunk(async () => {
    await client.transaction(
      types.Executable.Instructions([
        types.InstructionBox.Log({
          msg: "Hello, world!",
          level: types.Level.INFO,
        }),
      ]),
      {
        nonce: new types.NonZero(~~(Math.random() * 100_000)),
        metadata: [{ key: new types.Name("foo"), value: types.Json.fromValue(["a", 1, false, null, [], {}]) }],
      },
    ).submit({ verify: false });
  });

  await delay(PUSH_DELAY);
}

async function produceChunk(cb: () => Promise<void>) {
  await Array.fromAsync({ length: TXS_CHUNK }, () => cb());
}
