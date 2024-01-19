const getTransactionExplorerLinkByChain = (_transactionHash, _chain) =>
  `${_chain.blockExplorers.default.url}/tx/${_transactionHash}`

const getAnchorTagTransactionExpolorerByChain = (_transactionHash, _chain, _text) =>
  `<a href="${getTransactionExplorerLinkByChain(
    _transactionHash,
    _chain
  )}" class="text-blue-500 underline" target="_blank">${_text}</a>`

export { getTransactionExplorerLinkByChain, getAnchorTagTransactionExpolorerByChain }
