import express, { Request, Response } from 'express';
import { query as dbQuery } from '../db.js';

const router = express.Router();

/**
 * GET /api/currencies
 * Retrieve all active currencies or filter by status
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { active_only } = req.query;
    
    let sqlQuery = 'SELECT id, code, name, symbol, country, is_active, exchange_rate, is_default, created_at, updated_at FROM currencies';
    const params: any[] = [];
    
    if (active_only === 'true') {
      sqlQuery += ' WHERE is_active = TRUE';
    }
    
    sqlQuery += ' ORDER BY is_default DESC, code ASC';
    
    const result = await dbQuery(sqlQuery, params);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('[CURRENCIES] Error fetching currencies:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch currencies',
    });
  }
});

/**
 * GET /api/currencies/:code
 * Retrieve a specific currency by code
 */
router.get('/:code', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    
    const result = await dbQuery(
      'SELECT id, code, name, symbol, country, is_active, exchange_rate, is_default FROM currencies WHERE code = $1',
      [code.toUpperCase()]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Currency not found',
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('[CURRENCIES] Error fetching currency:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch currency',
    });
  }
});

/**
 * POST /api/currencies
 * Create a new currency (Admin only)
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { code, name, symbol, country, exchange_rate = 1.0 } = req.body;
    
    if (!code || !name || !symbol) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: code, name, symbol',
      });
    }
    
    const result = await dbQuery(
      `INSERT INTO currencies (code, name, symbol, country, exchange_rate, is_active)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       RETURNING id, code, name, symbol, country, is_active, exchange_rate, is_default, created_at`,
      [code.toUpperCase(), name, symbol, country || null, parseFloat(String(exchange_rate))]
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Currency created successfully',
    });
  } catch (error) {
    console.error('[CURRENCIES] Error creating currency:', error);
    
    if (error instanceof Error && error.message.includes('duplicate')) {
      return res.status(409).json({
        success: false,
        error: 'Currency code already exists',
      });
    }
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create currency',
    });
  }
});

/**
 * PUT /api/currencies/:code
 * Update an existing currency (Admin only)
 */
router.put('/:code', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const { name, symbol, country, is_active, exchange_rate, is_default } = req.body;
    
    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 1;
    
    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      params.push(name);
    }
    if (symbol !== undefined) {
      updates.push(`symbol = $${paramCount++}`);
      params.push(symbol);
    }
    if (country !== undefined) {
      updates.push(`country = $${paramCount++}`);
      params.push(country);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      params.push(is_active);
    }
    if (exchange_rate !== undefined) {
      updates.push(`exchange_rate = $${paramCount++}`);
      params.push(parseFloat(String(exchange_rate)));
    }
    if (is_default !== undefined) {
      if (is_default === true) {
        // Set all others to false first
        await dbQuery('UPDATE currencies SET is_default = FALSE');
      }
      updates.push(`is_default = $${paramCount++}`);
      params.push(is_default);
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    
    if (updates.length === 1) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update',
      });
    }
    
    params.push(code.toUpperCase());
    
    const result = await dbQuery(
      `UPDATE currencies SET ${updates.join(', ')} WHERE code = $${paramCount} RETURNING *`,
      params
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Currency not found',
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Currency updated successfully',
    });
  } catch (error) {
    console.error('[CURRENCIES] Error updating currency:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update currency',
    });
  }
});

/**
 * DELETE /api/currencies/:code
 * Delete a currency (Admin only, soft delete via is_active flag)
 */
router.delete('/:code', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    
    const result = await dbQuery(
      'UPDATE currencies SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE code = $1 RETURNING *',
      [code.toUpperCase()]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Currency not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Currency deactivated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('[CURRENCIES] Error deleting currency:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete currency',
    });
  }
});

export default router;
