import { useCallback, useEffect, useState } from 'react'
import { useAssets } from './use-assets'
import { useAccount, useWalletClient } from 'wagmi'
import { erc20ABI } from 'wagmi'
import BigNumber from 'bignumber.js'
import { createPublicClient, http } from 'viem'

import sleep from '../utils/sleep'
import vaultABI from '../utils/abi/Vault.json'
import facilitatorABI from '../utils/abi/Facilitator.json'
import { getAnchorTagTransactionExpolorerByChain } from '../utils/explorer'

const useSwap = () => {
  const { assets, refresh: refreshBalances } = useAssets()
  const { data: walletClient, refetch: refetchWalletClient } = useWalletClient()
  const { address } = useAccount()
  const [sourceAsset, setSourceAsset] = useState(assets[0])
  const [targetAsset, setTargetAsset] = useState(assets[1])
  const [sourceAssetAmount, setSourceAssetAmount] = useState('')
  const [targetAssetAmount, setTargetAssetAmount] = useState('')
  const [step, setStep] = useState(null)
  const [isSwapping, setIsSwapping] = useState(false)
  const [action, setAction] = useState('Mint')

  useEffect(() => {
    if (!address) {
      setSourceAssetAmount('')
      setTargetAssetAmount('')
    }
  }, [address])

  useEffect(() => {
    setSourceAsset(assets[0])
  }, [assets])

  useEffect(() => {
    setTargetAsset(assets[1])
  }, [assets])

  const invert = useCallback(() => {
    const destinatonAssetApp = targetAsset
    const targetAssetAmountApp = targetAssetAmount
    setTargetAsset(sourceAsset)
    setSourceAsset(destinatonAssetApp)
    setTargetAssetAmount(sourceAssetAmount)
    setSourceAssetAmount(targetAssetAmountApp)
    setAction(action === 'Mint' ? 'Burn' : 'Mint')
  }, [action, sourceAsset, targetAsset, sourceAssetAmount, targetAssetAmount])

  const onChangeSourceAssetAmount = useCallback(
    (_amount, _reset = true) => {
      setSourceAssetAmount(_amount)
      setTargetAssetAmount(
        BigNumber(_amount)
          .multipliedBy(sourceAsset.price)
          .dividedBy(targetAsset.price)
          .multipliedBy(action === 'Mint' ? sourceAsset.ltv : targetAsset.ltv)
          .toFixed()
      )

      if (step && _reset) setStep(null)
    },
    [action, sourceAsset, targetAsset, step]
  )

  const onChangeTargetAssetAmount = useCallback(
    (_amount) => {
      setTargetAssetAmount(_amount)
      setSourceAssetAmount(BigNumber(_amount).multipliedBy(targetAsset.price).dividedBy(sourceAsset.price).toFixed())
      if (step) setStep(null)
    },
    [sourceAsset, targetAsset, step]
  )

  const getWalletClient = useCallback(async () => {
    const { data } = await refetchWalletClient()
    return data
  }, [refetchWalletClient])

  const swap = useCallback(async () => {
    try {
      setStep(null)

      let hash
      const amount = BigNumber(sourceAssetAmount)
        .multipliedBy(10 ** sourceAsset.decimals)
        .toFixed()

      const publicClientSource = createPublicClient({
        chain: sourceAsset.chain,
        transport: http()
      })
      const publicClientTarget = createPublicClient({
        chain: targetAsset.chain,
        transport: http()
      })

      let effectiveWalletClient = walletClient

      if (effectiveWalletClient.chain.id !== sourceAsset.chain.id) {
        setStep({
          percentage: 0,
          message: `Switching chain ...`
        })
        await effectiveWalletClient.switchChain({ id: sourceAsset.chain.id })
        await sleep(2000)
      }

      setIsSwapping(true)

      if (sourceAsset.symbol !== 'GHO') {
        const allowance = await publicClientSource.readContract({
          account: address,
          address: sourceAsset.address,
          abi: erc20ABI,
          functionName: 'allowance',
          args: [address, sourceAsset.vaultAddress]
        })

        if (BigNumber(allowance).isLessThan(amount)) {
          setStep({
            percentage: 0,
            message: `Approving ${sourceAssetAmount} ${sourceAsset.symbol} ...`
          })

          effectiveWalletClient = await getWalletClient()
          hash = await effectiveWalletClient.writeContract({
            account: address,
            address: sourceAsset.address,
            abi: erc20ABI,
            functionName: 'approve',
            args: [sourceAsset.vaultAddress, amount]
          })
          setStep({
            percentage: 0,
            message: `${getAnchorTagTransactionExpolorerByChain(
              hash,
              sourceAsset.chain,
              'Transaction'
            )} broadcated. Waiting for confirmation ...`
          })
          await publicClientSource.waitForTransactionReceipt({ hash })

          setStep({
            percentage: 0,
            message: 'Approve transaction confirmed!'
          })
        }

        setStep({
          percentage: 20,
          message: `Depositing ${sourceAssetAmount} ${sourceAsset.symbol} into the vault to mint ${targetAssetAmount} ${targetAsset.symbol} ...`
        })

        hash = await effectiveWalletClient.writeContract({
          account: address,
          address: sourceAsset.vaultAddress,
          abi: vaultABI,
          functionName: 'mint',
          args: [sourceAsset.address, address, amount]
        })

        setStep({
          percentage: 40,
          message: `${getAnchorTagTransactionExpolorerByChain(
            hash,
            sourceAsset.chain,
            'Transaction'
          )} broadcasted. Waiting for confirmation ...`
        })
        await publicClientSource.waitForTransactionReceipt({ hash })
        setStep({
          percentage: 40,
          message: `${getAnchorTagTransactionExpolorerByChain(
            hash,
            sourceAsset.chain,
            'Transaction'
          )} confirmed. Waiting for finality ...`
        })
        await sleep(2000)

        setStep({
          percentage: 60,
          message: 'Waiting for cross chain event propagation ...'
        })
        await sleep(4000)

        setStep({
          percentage: 80,
          message: 'Switching chain ...'
        })

        await effectiveWalletClient.switchChain({ id: targetAsset.chain.id })
        await sleep(2000)
        effectiveWalletClient = await getWalletClient()

        setStep({
          percentage: 80,
          message: `Minting ${targetAssetAmount} GHO ...`
        })
        hash = await effectiveWalletClient.writeContract({
          account: address,
          address: targetAsset.facilitatorAddress,
          abi: facilitatorABI,
          functionName: 'verifyProofAndMint',
          gas: 150000,
          args: [
            address,
            BigNumber(targetAssetAmount)
              .multipliedBy(10 ** targetAsset.decimals)
              .toFixed()
          ]
        })
        setStep({
          percentage: 80,
          message: `${getAnchorTagTransactionExpolorerByChain(
            hash,
            targetAsset.chain,
            'Mint Transaction'
          )} sent. Waiting for confirmation ...`
        })
        await publicClientTarget.waitForTransactionReceipt({ hash })
        setStep({
          percentage: 100,
          message: 'GHO minted succesfully'
        })
      }

      refreshBalances()
    } catch (_err) {
      setStep(null)
      console.error(_err)
    } finally {
      setIsSwapping(false)
    }
  }, [
    address,
    sourceAsset,
    targetAsset,
    walletClient,
    sourceAssetAmount,
    targetAssetAmount,
    refreshBalances,
    getWalletClient
  ])

  /*useEffect(() => {
    if (!BigNumber(sourceAssetAmount).isNaN()) {
      onChangeSourceAssetAmount(sourceAssetAmount, false)
    }
  }, [sourceAssetAmount, onChangeSourceAssetAmount])*/

  return {
    action,
    targetAsset,
    targetAssetAmount,
    invert,
    isSwapping,
    onChangeTargetAssetAmount,
    onChangeSourceAssetAmount,
    setTargetAssetAmount,
    sourceAsset,
    sourceAssetAmount,
    setAction,
    step,
    swap
  }
}

export { useSwap }
