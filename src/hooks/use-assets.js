import { useCallback, useEffect, useMemo, useState } from 'react'
import BigNumber from 'bignumber.js'
import { createPublicClient, http } from 'viem'
import { erc20ABI } from 'wagmi'
import { useAccount } from 'wagmi'

import settings from '../settings'
import { formatAssetAmount, formatCurrency } from '../utils/amount'
import priceOracleABI from '../utils/abi/PriceOracle.json'

const useAssets = () => {
  const { address: userAddress } = useAccount()
  const [balances, setBalances] = useState([])

  const refresh = useCallback(async () => {
    try {
      if (userAddress) {
        const localBalances = await Promise.all(
          settings.assets.map(({ address: tokenAddress, chain }) => {
            const publicClient = createPublicClient({
              chain,
              transport: http()
            })

            return publicClient.readContract({
              address: tokenAddress,
              abi: erc20ABI,
              functionName: 'balanceOf',
              args: [userAddress]
            })
          })
        )

        const prices = await Promise.all(
          settings.assets.map(({ address: tokenAddress, priceOracleAddress, priceOracleChain }) => {
            const publicClient = createPublicClient({
              chain: priceOracleChain,
              transport: http()
            })

            return publicClient.readContract({
              address: priceOracleAddress,
              abi: priceOracleABI,
              functionName: 'getAssetPrice',
              args: [tokenAddress]
            })
          })
        )

        setBalances(
          localBalances.map((_balance, _index) => {
            const asset = settings.assets[_index]
            const offchainAmount = BigNumber(_balance).dividedBy(10 ** asset.decimals)

            const price = prices[_index]
            const offchainPrice = BigNumber(price).dividedBy(10 ** 8)

            return {
              balance: offchainAmount.toFixed(),
              formattedBalance: formatAssetAmount(offchainAmount, '', {
                decimals: 4,
                forceDecimals: true
              }),
              formattedBalanceWithSymbol: formatAssetAmount(offchainAmount, asset.symbol, {
                decimals: 6,
                forceDecimals: true
              }),
              formattedPrice: formatAssetAmount(offchainPrice, '', {
                decimals: 2,
                forceDecimals: true
              }),
              formattedPriceWithSymbol: formatCurrency(offchainPrice, 'USD'),
              price: offchainPrice.toFixed()
            }
          })
        )
      } else {
        setBalances([])
      }
    } catch (_err) {
      console.error(_err)
    }
  }, [userAddress])

  useEffect(() => {
    refresh()
  }, [refresh])

  const assets = useMemo(() => {
    return settings.assets.map((_asset, _index) => ({
      ..._asset,
      ...balances[_index]
    }))
  }, [balances])

  return {
    assets,
    refresh
  }
}

export { useAssets }
