const { Keypair } = require('@solana/web3.js');
const bs58 = require('bs58');
require('dotenv').config();

function getWallet() {
  const secretKey = bs58.decode(process.env.PRIVATE_KEY);
  const keypair = Keypair.fromSecretKey(secretKey);
  return keypair;
}

module.exports = { getWallet };
