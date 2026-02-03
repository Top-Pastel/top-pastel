/**
 * Script para extrair session_id do último pedido criado
 */

import mysql from 'mysql2/promise';

async function getSessionId() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'top_pastel'
    });

    const [rows] = await connection.execute(
      'SELECT stripePaymentId FROM orders ORDER BY id DESC LIMIT 1'
    );

    if (rows.length > 0) {
      console.log('Session ID:', rows[0].stripePaymentId);
    } else {
      console.log('Nenhum pedido encontrado');
    }

    await connection.end();
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

getSessionId();
