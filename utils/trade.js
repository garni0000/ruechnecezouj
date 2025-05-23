const axios = require('axios');
const { Connection, PublicKey, sendAndConfirmRawTransaction } = require('@solana/web3.js');
require('dotenv').config();

const RPC_URL = process.env.RPC_URL;
const connection = new Connection(RPC_URL, 'confirmed');

/**
 * Effectue un achat de token via l'API de Jupiter.
 * @param {string} tokenAddress - Adresse du token à acheter.
 * @param {number} amountSol - Montant en SOL à utiliser pour l'achat.
 * @param {Keypair} wallet - Portefeuille de l'utilisateur.
 */
async function buyToken(tokenAddress, amountSol, wallet) {
  try {
    // Obtenir le devis pour l'échange
    const quoteResponse = await axios.get('https://quote-api.jup.ag/v6/quote', {
      params: {
        inputMint: 'So11111111111111111111111111111111111111112', // SOL
        outputMint: tokenAddress,
        amount: Math.floor(amountSol * 1e9), // Convertir SOL en lamports
        slippageBps: 50, // 0.5% de slippage
      },
    });

    const quote = quoteResponse.data;

    // Construire la transaction d'échange
    const swapResponse = await axios.post('https://quote-api.jup.ag/v6/swap', {
      userPublicKey: wallet.publicKey.toBase58(),
      route: quote.routes[0],
      wrapUnwrapSOL: true,
      feeAccount: null,
    });

    const { swapTransaction } = swapResponse.data;

    // Décoder et signer la transaction
    const transactionBuffer = Buffer.from(swapTransaction, 'base64');
    const transaction = await connection.deserializeTransaction(transactionBuffer);
    transaction.sign(wallet);

    // Envoyer la transaction
    const txid = await sendAndConfirmRawTransaction(connection, transaction.serialize());
    console.log(`✅ Achat effectué avec succès. TXID: ${txid}`);
  } catch (error) {
    console.error('❌ Erreur lors de l\'achat du token:', error);
  }
}

/**
 * Effectue une vente de token via l'API de Jupiter.
 * @param {string} tokenAddress - Adresse du token à vendre.
 * @param {Keypair} wallet - Portefeuille de l'utilisateur.
 */
async function sellToken(tokenAddress, wallet) {
  try {
    // Obtenir le solde du token
    const tokenAccounts = await connection.getTokenAccountsByOwner(wallet.publicKey, {
      mint: new PublicKey(tokenAddress),
    });

    if (tokenAccounts.value.length === 0) {
      console.log('❌ Aucun token à vendre.');
      return;
    }

    const tokenAccountInfo = await connection.getParsedAccountInfo(tokenAccounts.value[0].pubkey);
    const amount = tokenAccountInfo.value.data.parsed.info.tokenAmount.uiAmount;

    // Obtenir le devis pour l'échange
    const quoteResponse = await axios.get('https://quote-api.jup.ag/v6/quote', {
      params: {
        inputMint: tokenAddress,
        outputMint: 'So11111111111111111111111111111111111111112', // SOL
        amount: Math.floor(amount * 1e6), // Convertir en unités minimales du token
        slippageBps: 50, // 0.5% de slippage
      },
    });

    const quote = quoteResponse.data;

    // Construire la transaction d'échange
    const swapResponse = await axios.post('https://quote-api.jup.ag/v6/swap', {
      userPublicKey: wallet.publicKey.toBase58(),
      route: quote.routes[0],
      wrapUnwrapSOL: true,
      feeAccount: null,
    });

    const { swapTransaction } = swapResponse.data;

    // Décoder et signer la transaction
    const transactionBuffer = Buffer.from(swapTransaction, 'base64');
    const transaction = await connection.deserializeTransaction(transactionBuffer);
    transaction.sign(wallet);

    // Envoyer la transaction
    const txid = await sendAndConfirmRawTransaction(connection, transaction.serialize());
    console.log(`✅ Vente effectuée avec succès. TXID: ${txid}`);
  } catch (error) {
    console.error('❌ Erreur lors de la vente du token:', error);
  }
}

/**
 * Obtient le prix actuel d'un token via l'API de Jupiter.
 * @param {string} tokenAddress - Adresse du token.
 * @returns {number} - Prix du token en SOL.
 */
async function getPrice(tokenAddress) {
  try {
    const response = await axios.get('https://price.jup.ag/v4/price', {
      params: {
        ids: tokenAddress,
      },
    });

    const price = response.data.data[tokenAddress].price;
    return price;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du prix:', error);
    return null;
  }
}

/**
 * Calcule le niveau de confiance d'un token.
 * @param {string} tokenAddress - Adresse du token.
 * @returns {number} - Niveau de confiance (1 à 3).
 */
async function getConfidenceLevel(tokenAddress) {
  // Implémentez votre logique pour déterminer le niveau de confiance
  // Par exemple, en analysant le nombre de détenteurs, la liquidité, etc.
  // Pour l'instant, retourne un niveau de confiance aléatoire
  return Math.floor(Math.random() * 3) + 1;
}

module.exports = { buyToken, sellToken, getPrice, getConfidenceLevel };
