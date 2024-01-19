import { gnosis, goerli } from 'viem/chains'

const settings = {
  assets: [
    {
      address: '0xdA7D9c8C3eBd2F0A790b1AbCFcdA3d309379B4d8',
      chain: gnosis,
      decimals: 18,
      id: 'WETH_GNOSIS',
      img: './assets/png/aave_weth.webp',
      name: 'Aave Gnosis WETH',
      networkImg: './assets/svg/gnosis.svg',
      priceOracleAddress: '0x85Ebb1a38d1a89cd491663B6034EbE75bA093A0A',
      priceOracleChain: gnosis,
      symbol: 'aGnoWETH',
      ltv: 0.85, //85%,
      vaultAddress: '0x7341dCFa7EA11dE8f218f5493edfed9eA5365d90'
    },
    {
      address: '0x2796816304CE26dC515312266Df21b10Bb0cDcc3',
      chain: goerli,
      decimals: 18,
      facilitatorAddress: '0x98EB3aDb154D7A25b42AF9e449Bd131E78EAc15D',
      id: 'GHO_GOERLI',
      img: './assets/png/gho.png',
      name: 'Gho Token',
      networkImg: './assets/svg/goerli.svg',
      priceOracleAddress: '0x85Ebb1a38d1a89cd491663B6034EbE75bA093A0A',
      priceOracleChain: gnosis,
      symbol: 'GHO'
    }
  ]
}

export default settings
