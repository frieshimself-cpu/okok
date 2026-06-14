import { describe, expect, it } from "vitest";
import { leadingZeroBits } from "../bytes";
import { sha256Hex } from "../sha256";
import { merkleRoot } from "../merkle";
import { txId, verifyTransaction, type Transaction } from "../transaction";
import { Wallet } from "../wallet";
import { computeBlockHash, meetsDifficulty, mineHeader, type Block } from "../block";
import {
  Blockchain,
  blockRewardAt,
  expectedDifficulty,
  type ChainConfig,
} from "../blockchain";
import { hexToBytes } from "../bytes";

/** Tiny fixed difficulty so blocks mine in microseconds and never retarget. */
const CFG: Partial<ChainConfig> = {
  initialDifficulty: 8,
  minDifficulty: 8,
  maxDifficulty: 8,
  targetBlockTimeMs: 5_000,
  blockReward: 50,
  halvingInterval: 100,
  maxTransactionsPerBlock: 10,
};

const FULL_CFG = { ...new Blockchain(CFG).config };

describe("sha256", () => {
  it("matches NIST test vectors", () => {
    expect(sha256Hex("")).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
    expect(sha256Hex("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
    expect(sha256Hex("The quick brown fox jumps over the lazy dog")).toBe(
      "d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592",
    );
  });

  it("handles multi-block messages (one million 'a')", () => {
    expect(sha256Hex("a".repeat(1_000_000))).toBe(
      "cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0",
    );
  });
});

describe("leadingZeroBits", () => {
  it("counts bits across bytes", () => {
    expect(leadingZeroBits(new Uint8Array([0x80]))).toBe(0);
    expect(leadingZeroBits(new Uint8Array([0x01]))).toBe(7);
    expect(leadingZeroBits(new Uint8Array([0x00, 0x0f]))).toBe(12);
    expect(leadingZeroBits(new Uint8Array([0x00, 0x00]))).toBe(16);
  });
});

describe("merkle root", () => {
  it("is deterministic and tamper-evident", () => {
    const ids = [sha256Hex("tx1"), sha256Hex("tx2"), sha256Hex("tx3")];
    const root = merkleRoot(ids);
    expect(merkleRoot(ids)).toBe(root);
    expect(merkleRoot([ids[0], sha256Hex("evil"), ids[2]])).not.toBe(root);
    expect(merkleRoot([])).toBe(merkleRoot([]));
  });
});

describe("wallets and signatures", () => {
  it("derives prefixed addresses from the public key", async () => {
    const a = await Wallet.create();
    const b = await Wallet.create();
    expect(a.address).toMatch(/^atb[0-9a-f]{40}$/);
    expect(a.address).not.toBe(b.address);
  });

  it("verifies a signed transaction and rejects tampering", async () => {
    const alice = await Wallet.create();
    const bob = await Wallet.create();
    const tx = await alice.createTransaction(bob.address, 10, 1, 0);

    expect((await verifyTransaction(tx)).ok).toBe(true);

    const inflated: Transaction = { ...tx, amount: 9_999 };
    expect((await verifyTransaction(inflated)).ok).toBe(false);
  });

  it("rejects a signature from a key that does not own the sender address", async () => {
    const alice = await Wallet.create();
    const mallory = await Wallet.create();
    const forged = await mallory.createTransaction(alice.address, 10, 1, 0);
    // Mallory claims to be Alice.
    const impersonation: Transaction = { ...forged, from: alice.address };
    const verdict = await verifyTransaction(impersonation);
    expect(verdict.ok).toBe(false);
    expect(verdict.error).toMatch(/does not match sender address/);
  });

  it("round-trips a wallet through export/restore", async () => {
    const original = await Wallet.create();
    const restored = await Wallet.restore(JSON.parse(JSON.stringify(await original.export())));
    expect(restored.address).toBe(original.address);

    const peer = await Wallet.create();
    const tx = await restored.createTransaction(peer.address, 3, 1, 0);
    expect((await verifyTransaction(tx)).ok).toBe(true);
  });
});

describe("proof-of-work mining", () => {
  it("seals headers whose hash meets the difficulty and matches the canonical payload", async () => {
    const mined = await mineHeader({
      index: 1,
      prevHash: "0".repeat(64),
      merkleRoot: sha256Hex("whatever"),
      timestamp: 1_767_225_600_123,
      difficulty: 8,
      nonce: 0,
    });
    expect(meetsDifficulty(hexToBytes(mined.hash), 8)).toBe(true);
    // The fast-path string grinding must agree byte-for-byte with the canonical JSON.
    expect(computeBlockHash(mined.header)).toBe(mined.hash);
    expect(mined.attempts).toBeGreaterThan(0);
  });

  it("reports progress while grinding", async () => {
    let calls = 0;
    let lastAttempts = 0;
    await mineHeader(
      {
        index: 1,
        prevHash: "0".repeat(64),
        merkleRoot: sha256Hex("progress"),
        timestamp: 1_767_225_600_456,
        difficulty: 8,
        nonce: 0,
      },
      {
        yieldEvery: 1,
        onProgress: (attempts) => {
          calls++;
          lastAttempts = attempts;
        },
      },
    );
    expect(calls).toBeGreaterThan(0);
    expect(lastAttempts).toBe(calls);
  });
});

describe("the blockchain", () => {
  it("pays the miner, transfers funds, collects fees and stays valid", async () => {
    const node = new Blockchain(CFG);
    const miner = await Wallet.create();
    const alice = await Wallet.create();

    await node.mineBlock(miner.address);
    expect(node.getBalance(miner.address)).toBe(50);

    const pay = await miner.createTransaction(alice.address, 20, 2, node.getNonce(miner.address));
    await node.addTransaction(pay);
    await node.mineBlock(miner.address);

    // miner: 50 (block 1) - 20 - 2 (sent) + 50 + 2 (block 2 reward + fee) = 80
    expect(node.getBalance(miner.address)).toBe(80);
    expect(node.getBalance(alice.address)).toBe(20);
    expect(node.totalSupply()).toBe(100);
    expect(node.height).toBe(2);

    const audit = await node.audit();
    expect(audit.valid).toBe(true);
  });

  it("rejects overspends, replays and out-of-order nonces", async () => {
    const node = new Blockchain(CFG);
    const miner = await Wallet.create();
    const alice = await Wallet.create();
    await node.mineBlock(miner.address); // miner: 50

    const overspend = await miner.createTransaction(alice.address, 60, 0, 0);
    await expect(node.addTransaction(overspend)).rejects.toThrow(/insufficient funds/);

    const futureNonce = await miner.createTransaction(alice.address, 5, 0, 7);
    await expect(node.addTransaction(futureNonce)).rejects.toThrow(/nonce/);

    const ok = await miner.createTransaction(alice.address, 5, 0, 0);
    await node.addTransaction(ok);
    await node.mineBlock(miner.address);

    // Replaying the exact same signed transaction must fail: its nonce is spent.
    await expect(node.addTransaction(ok)).rejects.toThrow(/nonce/);
  });

  it("prevents overspending across the mempool before anything is mined", async () => {
    const node = new Blockchain(CFG);
    const miner = await Wallet.create();
    const alice = await Wallet.create();
    await node.mineBlock(miner.address); // miner: 50

    await node.addTransaction(await miner.createTransaction(alice.address, 30, 0, 0));
    const second = await miner.createTransaction(alice.address, 30, 0, 1);
    await expect(node.addTransaction(second)).rejects.toThrow(/insufficient funds/);
  });

  it("orders mempool transactions by fee without breaking nonce order", async () => {
    const node = new Blockchain(CFG);
    const miner = await Wallet.create();
    const cheap = await Wallet.create();
    const generous = await Wallet.create();

    await node.mineBlock(miner.address);
    await node.addTransaction(await miner.createTransaction(cheap.address, 10, 0, 0));
    await node.addTransaction(await miner.createTransaction(generous.address, 10, 0, 1));
    await node.mineBlock(miner.address);

    await node.addTransaction(await cheap.createTransaction(miner.address, 1, 1, 0));
    await node.addTransaction(await generous.createTransaction(miner.address, 1, 5, 0));
    const { block } = await node.mineBlock(miner.address);

    const [, first, second] = block.transactions;
    expect(first.from).toBe(generous.address);
    expect(second.from).toBe(cheap.address);
  });

  it("detects tampering anywhere in history", async () => {
    const node = new Blockchain(CFG);
    const miner = await Wallet.create();
    const alice = await Wallet.create();

    await node.mineBlock(miner.address);
    await node.addTransaction(await miner.createTransaction(alice.address, 10, 1, 0));
    await node.mineBlock(miner.address);

    // 1) Crude tamper: bump the transfer amount. The header hash no longer matches.
    const tampered: Block[] = JSON.parse(JSON.stringify(node.chain));
    tampered[2].transactions[1].amount = 9_999;
    const crude = await Blockchain.validateChain(tampered, node.config);
    expect(crude.valid).toBe(false);

    // 2) Sophisticated tamper: also recompute merkle root and hash. Without
    //    redoing the proof-of-work (and breaking the child links) it still fails.
    tampered[2].merkleRoot = merkleRoot(tampered[2].transactions.map(txId));
    tampered[2].hash = computeBlockHash(tampered[2]);
    const sophisticated = await Blockchain.validateChain(tampered, node.config);
    expect(sophisticated.valid).toBe(false);

    // The untouched chain still audits clean.
    expect((await node.audit()).valid).toBe(true);
  });

  it("rejects a coinbase that prints more than the consensus reward", async () => {
    const node = new Blockchain(CFG);
    const miner = await Wallet.create();

    const greedyCoinbase: Transaction = {
      from: null,
      to: miner.address,
      amount: 999_999,
      fee: 0,
      nonce: 0,
      timestamp: Date.now(),
      publicKey: "",
      signature: "",
    };
    const transactions = [greedyCoinbase];
    const mined = await mineHeader({
      index: 1,
      prevHash: node.tip.hash,
      merkleRoot: merkleRoot(transactions.map(txId)),
      timestamp: Math.max(Date.now(), node.tip.timestamp),
      difficulty: expectedDifficulty(node.chain, node.config),
      nonce: 0,
    });
    const block: Block = { ...mined.header, transactions, hash: mined.hash };

    await expect(node.receiveBlock(block)).rejects.toThrow(/coinbase pays/);
  });

  it("restores a node from a serialized chain and keeps mining", async () => {
    const node = new Blockchain(CFG);
    const miner = await Wallet.create();
    const alice = await Wallet.create();
    await node.mineBlock(miner.address);
    await node.addTransaction(await miner.createTransaction(alice.address, 10, 1, 0));
    await node.mineBlock(miner.address);

    // Simulate a page reload: serialize, parse, rebuild.
    const revived = await Blockchain.fromChain(JSON.parse(JSON.stringify(node.chain)), CFG);
    expect(revived.height).toBe(node.height);
    expect(revived.getBalance(miner.address)).toBe(node.getBalance(miner.address));
    expect(revived.getBalance(alice.address)).toBe(10);
    expect(revived.getNonce(miner.address)).toBe(1);

    // The revived node keeps working: it can mine and stays valid.
    await revived.mineBlock(miner.address);
    expect((await revived.audit()).valid).toBe(true);

    // Tampered storage is rejected, not trusted.
    const corrupted = JSON.parse(JSON.stringify(node.chain));
    corrupted[2].transactions[1].amount = 9_999;
    await expect(Blockchain.fromChain(corrupted, CFG)).rejects.toThrow(/cannot restore/);
  });

  it("adopts a heavier competing chain and refuses a lighter one", async () => {
    const nodeA = new Blockchain(CFG);
    const nodeB = new Blockchain(CFG);
    const minerA = await Wallet.create();
    const minerB = await Wallet.create();

    await nodeA.mineBlock(minerA.address);
    await nodeA.mineBlock(minerA.address);

    await nodeB.mineBlock(minerB.address);
    await nodeB.mineBlock(minerB.address);
    await nodeB.mineBlock(minerB.address);

    await expect(nodeB.replaceChain(nodeA.chain)).rejects.toThrow(/more work/);

    await nodeA.replaceChain(nodeB.chain);
    expect(nodeA.height).toBe(3);
    expect(nodeA.getBalance(minerB.address)).toBe(150);
    expect(nodeA.getBalance(minerA.address)).toBe(0);
    expect((await nodeA.audit()).valid).toBe(true);
  });
});

describe("monetary policy", () => {
  it("halves the block reward on schedule", () => {
    const halvingCfg = { ...FULL_CFG, blockReward: 50, halvingInterval: 2 };
    expect(blockRewardAt(1, halvingCfg)).toBe(50);
    expect(blockRewardAt(2, halvingCfg)).toBe(25);
    expect(blockRewardAt(3, halvingCfg)).toBe(25);
    expect(blockRewardAt(4, halvingCfg)).toBe(12);
    expect(blockRewardAt(40, halvingCfg)).toBe(0);
  });

  it("supply equals the sum of coinbase rewards", async () => {
    const node = new Blockchain({ ...CFG, halvingInterval: 2 });
    const miner = await Wallet.create();
    await node.mineBlock(miner.address); // 50
    await node.mineBlock(miner.address); // 25
    await node.mineBlock(miner.address); // 25
    expect(node.totalSupply()).toBe(100);
  });
});

describe("difficulty retargeting", () => {
  const cfg: ChainConfig = {
    ...FULL_CFG,
    initialDifficulty: 12,
    minDifficulty: 8,
    maxDifficulty: 20,
    targetBlockTimeMs: 1_000,
  };

  const fakeBlock = (timestamp: number, difficulty: number) =>
    ({ timestamp, difficulty }) as Block;

  it("raises difficulty after fast blocks, lowers it after slow ones, within bounds", () => {
    const base = fakeBlock(0, 12);

    expect(expectedDifficulty([base], cfg)).toBe(12);
    expect(expectedDifficulty([base, fakeBlock(100, 12)], cfg)).toBe(13);
    expect(expectedDifficulty([base, fakeBlock(5_000, 12)], cfg)).toBe(11);
    expect(expectedDifficulty([base, fakeBlock(1_000, 12)], cfg)).toBe(12);

    expect(expectedDifficulty([base, fakeBlock(100, 20)], cfg)).toBe(20);
    expect(expectedDifficulty([base, fakeBlock(9_000, 8)], cfg)).toBe(8);
  });
});
