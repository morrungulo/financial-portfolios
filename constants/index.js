// the different statuses an asset can have
const ASSET_STATUS = {
  NEW: 'new',
  OPEN: 'open',
  CLOSE: 'close',
  ERR: 'error',
}
const ASSET_STATUS_LIST = Object.values(ASSET_STATUS);

// the different types of assets
const ASSET_TYPE = {
  STOCK: 'stock',
  CRYPTO: 'crypto',
  CASH: 'cash'
}

module.exports = {
  ASSET_STATUS,
  ASSET_STATUS_LIST,
  ASSET_TYPE,
}