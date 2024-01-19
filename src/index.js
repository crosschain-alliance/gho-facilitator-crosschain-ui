import './styles/index.css'
import '@rainbow-me/rainbowkit/styles.css'
import 'react-step-progress-bar/styles.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { configureChains, createConfig, WagmiConfig } from 'wagmi'
import { goerli, gnosis } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'
import { alchemyProvider } from 'wagmi/providers/alchemy'
import { HashRouter } from 'react-router-dom'

import App from './App'
import reportWebVitals from './reportWebVitals'

gnosis.iconUrl = './assets/svg/gnosis.svg'

const { chains, publicClient } = configureChains(
  [gnosis, goerli],
  [
    jsonRpcProvider({ rpc: () => ({ http: process.env.REACT_APP_GNOSIS_NODE }) }),
    alchemyProvider({ apiKey: process.env.REACT_APP_ALCHEMY_API_KEY }),
    publicProvider()
  ]
)

const { connectors } = getDefaultWallets({
  appName: 'GHO Cros Chain Facilitator',
  projectId: process.env.REACT_APP_WC2_PROJECT_ID,
  chains
})

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient
})

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains}>
        <HashRouter>
          <App />
        </HashRouter>
      </RainbowKitProvider>
    </WagmiConfig>
  </React.StrictMode>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
