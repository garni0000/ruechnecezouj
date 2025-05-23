const axios = require('axios');

/**
 * Récupère les nouveaux tokens créés sur Pump.fun.
 * @returns {Array} - Liste des nouveaux tokens.
 */
async function getNewTokens() {
  try {
    const response = await axios.get('https://api.pump.fun/api/tokens/new');
    return response.data.tokens;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des nouveaux tokens:', error);
    return [];
  }
}

/**
 * Récupère la liquidité d'un token sur Pump.fun.
 * @param {string} tokenAddress - Adresse du token.
 * @returns {number} - Liquidité du token en SOL.
 */
async function getTokenLiquidity(tokenAddress) {
  try {
    const response = await axios.get(`https://api.pump.fun/api/token/${tokenAddress}`);
    const liquidity = response.data.liquidity;
    return liquidity;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de la liquidité:', error);
    return 0;
  }
}

module.exports = { getNewTokens, getTokenLiquidity };
