import { BankConnection } from '../../types';
import { delay } from './client';

const mockConnections: BankConnection[] = [
  { id: 'bc1', bankName: 'Тинькофф Банк', status: 'connected', lastSyncAt: new Date().toISOString(), accountsCount: 2 },
  { id: 'bc2', bankName: 'Сбербанк', status: 'error', lastSyncAt: new Date(Date.now() - 86400000 * 2).toISOString(), errorMessage: 'Требуется повторная авторизация в банке', accountsCount: 1 },
];

/**
 * Mock EasyBank API. Replace with real endpoints, e.g.
 * GET /bank/connections, POST /bank/connections, POST /bank/connections/:id/sync
 */
export const bankApi = {
  async getConnections(): Promise<BankConnection[]> {
    await delay(400);
    return mockConnections;
  },

  async resync(id: string): Promise<BankConnection> {
    await delay(800);
    const conn = mockConnections.find((c) => c.id === id);
    if (!conn) throw new Error('Подключение не найдено');
    conn.status = 'connected';
    conn.lastSyncAt = new Date().toISOString();
    conn.errorMessage = undefined;
    return conn;
  },

  async connectBank(bankName: string): Promise<BankConnection> {
    await delay(1000);
    const conn: BankConnection = {
      id: 'bc' + Date.now(),
      bankName,
      status: 'connected',
      lastSyncAt: new Date().toISOString(),
      accountsCount: 1,
    };
    mockConnections.push(conn);
    return conn;
  },
};
