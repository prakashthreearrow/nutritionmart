module.exports = {
  searchList: {
    product_id: 'product_id',
    stock_id: 'stock_id',
    stock_detail_id: 'stock_detail_id',
    upc_code: 'upc_code',
    size: 'size',
    product_name: 'product_name',
    flavor_id: 'flavor_id',
    flavor_name: 'flavor_name',
    deduct_info: 'deduct_info',
  },
  inventoryList: {
    id: 'id',
    status: 'status',
    product_id: 'product_id',
    product_name: 'product_name',
    slug: 'slug',
    flavor_id: 'flavor_id',
    flavor_name: 'flavor_name',
    expiry_date: 'expiry_date',
    mrp: 'mrp',
    qty_blocked: 'qty_blocked',
    qty_available: 'qty_available',
  },
  inventoryLogList: {
    id: 'id',
    date: 'date',
    product_id: 'product_id',
    product_name: 'product_name',
    flavor_id: 'flavor_id',
    flavor_name: 'flavor_name',
    sku: 'sku',
    quantity: 'quantity',
    created_at: 'createdAt',
  },
  outOfStockProductInventoryList: {
    id: 'id',
    product_id: 'product_id',
    product_name: 'product_name',
    flavor_id: 'flavor_id',
    flavor_name: 'flavor_name',
    size: 'size',
    weight: 'weight',
    blocked_stock: 'blocked_stock',
    available_stock: 'available_stock',
    date: 'date',
  },
}
