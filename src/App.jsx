import React from 'react'
import { IoIosArrowDown } from 'react-icons/io'
import { useCallback, useMemo } from 'react'
import { useAccount, useNetwork } from 'wagmi'
import { useChainModal, useConnectModal } from '@rainbow-me/rainbowkit'

import { useSwap } from './hooks/use-swap'

import Header from './components/complex/Header'
import SwapLine from './components/complex/SwapLine'
import StepProgressBar from './components/base/StepProgressBar'
import Box from './components/base/Box'
import BigNumber from 'bignumber.js'

const App = () => {
  const { isConnected, isConnecting } = useAccount()
  const { openConnectModal } = useConnectModal()
  const { openChainModal } = useChainModal()
  const { chain } = useNetwork()
  const {
    action,
    targetAsset,
    targetAssetAmount,
    invert,
    isSwapping,
    onChangeTargetAssetAmount,
    onChangeSourceAssetAmount,
    sourceAsset,
    sourceAssetAmount,
    step,
    swap
  } = useSwap()

  const onButtonClick = useCallback(() => {
    if (!isConnected) {
      openConnectModal()
      return
    }

    if (chain?.unsupported) {
      openChainModal()
      return
    }

    swap()
  }, [isConnected, chain?.unsupported, openConnectModal, openChainModal, swap])

  const buttonText = useMemo(() => {
    if (!isConnected && !isConnecting) return 'Connect Wallet'
    if (isConnecting) return 'Connecting ...'
    if (chain?.unsupported /* || chain.id !== sourceAsset.chain.id*/) return 'Wrong network'
    if (sourceAssetAmount === '') return 'Enter an amount ...'
    if (BigNumber(sourceAssetAmount).isGreaterThan(sourceAsset?.balance)) return 'Insufficient balance'
    if (isSwapping) return action + 'ing ...'
    if (isConnected) return action
  }, [action, isConnected, isConnecting, isSwapping, sourceAssetAmount, chain?.unsupported, sourceAsset])

  const btnDisabled = useMemo(() => {
    if (chain?.unsupported || !isConnected) return false
    return (
      isConnecting ||
      sourceAssetAmount === '' ||
      isSwapping ||
      BigNumber(sourceAssetAmount).isGreaterThan(sourceAsset?.balance)
    )
  }, [chain?.unsupported, isConnecting, sourceAssetAmount, isSwapping, isConnected, sourceAsset?.balance])

  const swapLineDisabled = useMemo(() => {
    if (!isConnected || chain?.unsupported || isSwapping) return true
    return false
  }, [isConnected, chain?.unsupported, isSwapping])

  return (
    <React.Fragment>
      <Header />
      <div className="p-2 md:p-0">
        <Box className="max-w-md mx-auto pt-3 pb-1 pl-1 pr-1 mt-10">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-sm font-semibold ml-3">{action}</span>
            <div className="relative">
              <div
                className={`flex bg-blue-100 pt-1 pl-2 pb-1 mr-3 rounded-xl items-center cursor-pointer hover:bg-blue-200`}
              >
                <span className="mr-2 text-xs">
                  LTV: <span className="font-semibold">{(sourceAsset.ltv || targetAsset.ltv) * 100}%</span>
                </span>
              </div>
            </div>
          </div>
          <div className="mt-3">
            <SwapLine
              disabled={swapLineDisabled}
              amount={sourceAssetAmount}
              asset={sourceAsset}
              onChangeAmount={onChangeSourceAssetAmount}
              withMax
              withArrowDown={sourceAsset.symbol !== 'GHO'}
            />
          </div>
          <div className="relative">
            <button
              className="absolute bg-gray-100 p-1 rounded-lg border-4 border-white hover:bg-gray-200 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              onClick={() => invert()}
            >
              <IoIosArrowDown className="text-gray-600 " />
            </button>
          </div>
          <div className="mt-1">
            <SwapLine
              disabled={swapLineDisabled}
              amount={targetAssetAmount}
              asset={targetAsset}
              onChangeAmount={onChangeTargetAssetAmount}
              withArrowDown={targetAsset.symbol !== 'GHO'}
            />
          </div>
          {step && (
            <div className="mt-6 mb-6 pl-4 pr-4">
              <StepProgressBar percent={step.percentage} hasStepZero={true} stepPositions={[0, 20, 40, 60, 80, 100]} />
              <div className="mt-4 flex items-center justify-center">
                <span className="text-gray-600 text-sm font-medium">
                  <div dangerouslySetInnerHTML={{ __html: step.message }} />
                </span>
              </div>
            </div>
          )}
          <div className="mt-2">
            <button
              disabled={btnDisabled}
              className="pt-2 pb-2 pl-3 pr-3 bg-purple-200 text-purple-500 rounded-3xl font-semibold text-lg w-full h-14 hover:text-opacity-50 disabled:opacity-50"
              onClick={onButtonClick}
            >
              {buttonText}
            </button>
          </div>
        </Box>
      </div>
    </React.Fragment>
  )
}

export default App
