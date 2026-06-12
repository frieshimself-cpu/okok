/**
 * Verdant end-to-end demo — run with `npm run demo`.
 *
 * Spins up a node, mints wallets, mines blocks, moves money, audits the
 * chain, demonstrates tamper detection and heaviest-chain fork choice.
 */

import {
  Blockchain,
  computeBlockHash,
  merkleRoot,
  shortAddress,
  txId,
  Wallet,
  type Block,
  type ChainConfig,
} from "../src/chain/index";

const CONFIG: Partial<ChainConfig> = {
  initialDifficulty: 14,
  minDifficulty: 8,
  maxDifficulty: 20,
  targetBlockTimeMs: 2_000,
  blockReward: 50,
  halvingInterval: 100,
  maxTransactionsPerBlock: 100,
};

const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`;

const rule = dim("─".repeat(64));
const log = console.log;

function step(n: number, title: string) {
  log(`\n${rule}\n${bold(` ${n}. ${title}`)}\n${rule}`);
}

function describeBlock(block: Block, attempts: number, ms: number) {
  const rate = ms > 0 ? Math.round(attempts / (ms / 1000)).toLocaleString() : "∞";
  log(`   block ${bold(`#${block.index}`)}  ${cyan(block.hash.slice(0, 20))}…`);
  log(
    dim(
      `   difficulty ${block.difficulty} bits · nonce ${block.nonce.toLocaleString()} · ` +
        `${attempts.toLocaleString()} hashes in ${(ms / 1000).toFixed(2)}s (${rate} H/s) · ` +
        `${block.transactions.length} tx`,
    ),
  );
}

async function main() {
  log(`\n${bold(" VERDANT")} ${dim("· a proof-of-work blockchain, end to end")}`);

  step(1, "Mint wallets (ECDSA P-256 via WebCrypto)");
  const node = new Blockchain(CONFIG);
  const miner = await Wallet.create();
  const alice = await Wallet.create();
  const bob = await Wallet.create();
  log(`   miner  ${cyan(miner.address)}`);
  log(`   alice  ${cyan(alice.address)}`);
  log(`   bob    ${cyan(bob.address)}`);

  step(2, "Mine the first block — coinbase pays the miner");
  const b1 = await node.mineBlock(miner.address);
  describeBlock(b1.block, b1.attempts, b1.durationMs);
  log(`   miner balance: ${green(`${node.getBalance(miner.address)} LEAF`)}`);

  step(3, "Sign transfers, admit them to the mempool, mine them in");
  const t1 = await miner.createTransaction(alice.address, 20, 2, node.getPendingNonce(miner.address));
  await node.addTransaction(t1);
  const t2 = await miner.createTransaction(bob.address, 5, 1, node.getPendingNonce(miner.address));
  await node.addTransaction(t2);
  log(dim(`   tx ${txId(t1).slice(0, 16)}… miner → alice, 20 LEAF (fee 2)`));
  log(dim(`   tx ${txId(t2).slice(0, 16)}… miner → bob,   5 LEAF (fee 1)`));
  const b2 = await node.mineBlock(miner.address);
  describeBlock(b2.block, b2.attempts, b2.durationMs);

  const t3 = await alice.createTransaction(bob.address, 7, 1, node.getPendingNonce(alice.address));
  await node.addTransaction(t3);
  log(dim(`   tx ${txId(t3).slice(0, 16)}… alice → bob,   7 LEAF (fee 1)`));
  const b3 = await node.mineBlock(miner.address);
  describeBlock(b3.block, b3.attempts, b3.durationMs);

  step(4, "Ledger state");
  for (const [name, wallet] of [["miner", miner], ["alice", alice], ["bob", bob]] as const) {
    log(
      `   ${name.padEnd(6)} ${dim(shortAddress(wallet.address))}  ` +
        green(`${node.getBalance(wallet.address)} LEAF`),
    );
  }
  log(dim(`   total supply ${node.totalSupply()} LEAF · height ${node.height} · work 2^${Math.log2(node.work()).toFixed(2)}`));

  step(5, "Audit, then try to rewrite history");
  const audit = await node.audit();
  log(`   full revalidation from genesis: ${audit.valid ? green("VALID ✓") : red("INVALID ✗")}`);

  const tampered: Block[] = JSON.parse(JSON.stringify(node.chain));
  tampered[2].transactions[1].amount = 999_999;
  const crude = await Blockchain.validateChain(tampered, node.config);
  log(`   bump a past transfer to 999,999 LEAF → ${red(`INVALID ✗  (${crude.error})`)}`);

  tampered[2].merkleRoot = merkleRoot(tampered[2].transactions.map(txId));
  tampered[2].hash = computeBlockHash(tampered[2]);
  const sneaky = await Blockchain.validateChain(tampered, node.config);
  log(`   …even after recomputing merkle root + hash → ${red(`INVALID ✗  (${sneaky.error})`)}`);

  step(6, "Fork choice — the heaviest valid chain wins");
  const rival = new Blockchain(CONFIG);
  const rivalMiner = await Wallet.create();
  for (let i = 0; i < 4; i++) {
    const mined = await rival.mineBlock(rivalMiner.address);
    describeBlock(mined.block, mined.attempts, mined.durationMs);
  }
  log(
    dim(
      `   our chain: height ${node.height}, work 2^${Math.log2(node.work()).toFixed(2)} · ` +
        `rival: height ${rival.height}, work 2^${Math.log2(rival.work()).toFixed(2)}`,
    ),
  );
  await node.replaceChain(rival.chain);
  log(`   adopted the heavier rival chain → height ${bold(String(node.height))}, ` +
    `rival miner now holds ${green(`${node.getBalance(rivalMiner.address)} LEAF`)}`);
  await rival.replaceChain(node.chain).then(
    () => log(red("   (should not happen)")),
    (err: Error) => log(`   rival refuses our identical-weight chain → ${green("correctly rejected")} ${dim(`(${err.message})`)}`),
  );

  log(`\n${green(bold(" Done."))} ${dim("Every rule above is enforced by the same code the website runs in your browser.")}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
