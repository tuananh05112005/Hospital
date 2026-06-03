const db = require('../config/db');

class InventoryRepository {
  async findAll() {
    const [items] = await db.execute('SELECT * FROM inventory ORDER BY item_name ASC');
    return items;
  }

  async findByName(name) {
    const [existing] = await db.execute('SELECT id, quantity FROM inventory WHERE item_name = ?', [name]);
    return existing.length > 0 ? existing[0] : null;
  }

  async count() {
    const [result] = await db.execute('SELECT COUNT(*) as c FROM inventory');
    return result[0].c;
  }

  async updateQuantity(id, newQuantity) {
    await db.execute('UPDATE inventory SET quantity = ? WHERE id = ?', [newQuantity, id]);
  }

  async create(data) {
    const { item_name, category, quantity, unit, unit_price, low_stock_threshold } = data;
    const [result] = await db.execute(
      'INSERT INTO inventory (item_name, category, quantity, unit, unit_price, low_stock_threshold) VALUES (?, ?, ?, ?, ?, ?)',
      [item_name, category || 'medicine', quantity || 0, unit || 'viên', unit_price || 0, low_stock_threshold || 10]
    );
    return result.insertId;
  }
}

module.exports = new InventoryRepository();
