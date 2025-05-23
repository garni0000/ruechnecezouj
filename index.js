require('dotenv').config();
const { getNewTokens, getTokenLiquidity } = require('./utils/security');
const { buyToken, sellToken, getPrice, getConfidenceLevel } = require('./utils/trade');
const { getWallet } = require('./utils/wallet');

(async () => {
  const wallet = getWallet();
  console.log("🔍 Sniping bot running...");

  while (true) {
    try {
      const newTokens = await getNewTokens(); // à personnaliser avec source Pump.fun

      for (const token of newTokens) {
        const liquidity = await getTokenLiquidity(token.address);
        if (liquidity >= parseFloat(process.env.MIN_LIQUIDITY)) {
          const confidence = await getConfidenceLevel(token);

          if (confidence >= parseInt(process.env.CONFIDENCE_LEVEL)) {
            console.log(`🚀 Buying ${token.symbol} with confidence ${confidence}`);
            const txBuy = await buyToken(token.address, parseFloat(process.env.BUY_AMOUNT_SOL), wallet);

            // Attente passive pour monitorer le pump
            let boughtAt = await getPrice(token.address);
            let sold = false;

            while (!sold) {
              const current = await getPrice(token.address);
              const ratio = current / boughtAt;

              if (ratio >= parseFloat(process.env.TAKE_PROFIT_2)) {
                await sellToken(token.address, wallet);
                console.log(`💰 Sold at x${ratio.toFixed(2)} (TP2)`);
                sold = true;
              } else if (ratio >= parseFloat(process.env.TAKE_PROFIT_1) && confidence < 2) {
                await sellToken(token.address, wallet);
                console.log(`💰 Sold at x${ratio.toFixed(2)} (TP1 - low confidence)`);
                sold = true;
              }

              await new Promise(res => setTimeout(res, 5000)); // Attente 5s
            }
          }
        }
      }

      await new Promise(res => setTimeout(res, 10000)); // pause entre chaque cycle
    } catch (err) {
      console.error("❌ Error in main loop:", err);
      await new Promise(res => setTimeout(res, 10000));
    }
  }
})();
