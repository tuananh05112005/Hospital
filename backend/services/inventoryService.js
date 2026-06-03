const inventoryRepo = require('../repositories/inventoryRepository');
const { GoogleGenerativeAI } = require('@google/generative-ai');

class InventoryService {
  async getInventory() {
    return await inventoryRepo.findAll();
  }

  async addStock(stockData) {
    const { item_name, quantity } = stockData;
    
    // Check if exists
    const existing = await inventoryRepo.findByName(item_name);
    
    if (existing) {
      // Add up
      const newQty = existing.quantity + parseInt(quantity);
      await inventoryRepo.updateQuantity(existing.id, newQty);
      return { message: 'Đã nhập thêm hàng vào kho', id: existing.id, newQuantity: newQty };
    } else {
      // Create new
      const insertId = await inventoryRepo.create(stockData);
      return { message: 'Đã tạo mã sản phẩm mới trong kho', id: insertId };
    }
  }

  async seedInventory() {
    const count = await inventoryRepo.count();
    if (count > 0) return { message: 'Dữ liệu Kho đã tồn tại.' };

    const items = [
        { item_name: 'Paracetamol 500mg', category: 'medicine', quantity: 500, unit: 'viên', unit_price: 2000, low_stock_threshold: 50 },
        { item_name: 'Amoxicillin 500mg (Kháng sinh)', category: 'medicine', quantity: 20, unit: 'viên', unit_price: 5000, low_stock_threshold: 30 },
        { item_name: 'Bơm kim tiêm 5ml', category: 'equipment', quantity: 1000, unit: 'cái', unit_price: 1500, low_stock_threshold: 100 },
        { item_name: 'Cồn y tế 90 độ', category: 'supply', quantity: 50, unit: 'chai', unit_price: 15000, low_stock_threshold: 20 }
    ];

    for (let it of items) {
        await inventoryRepo.create(it);
    }
    return { message: 'Đã khởi tạo hệ thống Dược phẩm/Vật tư gốc!' };
  }

  async aiSuggest(keyword) {
    const text = (keyword || '').toLowerCase();
    let suggestions = [];

    if (process.env.GEMINI_API_KEY) {
        try {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const prompt = `You are a Pharmacy AI. Suggest exactly ONE standard medical name, category (medicine/equipment/supply), unit, price for: "${text}".
            Respond only in valid JSON array format. Example: [{"item_name": "Aspirin 81mg", "category": "medicine", "unit": "viên", "unit_price": 2000}]`;
            
            const result = await model.generateContent(prompt);
            const responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
            suggestions = JSON.parse(responseText);
            return { source: 'gemini', result: suggestions[0] };
        } catch (aiError) {
            console.error("Gemini AI failed, fallback to heuristic.");
        }
    }

    // Heuristic fallback
    await new Promise(resolve => setTimeout(resolve, 800)); // fake delay
    
    const fallbackData = [
        { item_name: 'Panadol Extra', category: 'medicine', unit: 'viên', unit_price: 1500 },
        { item_name: 'Vitamin D3 K2', category: 'medicine', unit: 'lọ', unit_price: 120000 },
        { item_name: 'Băng gạc y tế', category: 'supply', unit: 'hộp', unit_price: 25000 },
        { item_name: 'Khẩu trang N95', category: 'supply', unit: 'chiếc', unit_price: 5000 },
        { item_name: 'Máy đo huyết áp Omron', category: 'equipment', unit: 'máy', unit_price: 850000 }
    ];

    const matched = fallbackData.find(d => d.item_name.toLowerCase().includes(text));
    const result = matched || fallbackData[Math.floor(Math.random() * fallbackData.length)];

    return { source: 'heuristic', result };
  }
}

module.exports = new InventoryService();
