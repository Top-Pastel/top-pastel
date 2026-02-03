import { describe, it, expect, beforeAll } from 'vitest';
import { initializeCTTClient, getCTTClient } from './cttApi';

describe('CTT API Client', () => {
  describe('Initialization', () => {
    it('should initialize CTT client with environment variables', () => {
      // Verificar se as variáveis de ambiente estão configuradas
      expect(process.env.CTT_PUBLIC_KEY).toBeDefined();
      expect(process.env.CTT_SECRET_KEY).toBeDefined();
      expect(process.env.CTT_API_URL).toBeDefined();
    });

    it('should create CTT client instance', () => {
      const client = getCTTClient();
      expect(client).toBeDefined();
    });

    it('should return same client instance on multiple calls', () => {
      const client1 = getCTTClient();
      const client2 = getCTTClient();
      expect(client1).toBe(client2);
    });

    it('should have correct API URL configured', () => {
      expect(process.env.CTT_API_URL).toBe('https://enviosecommerce.ctt.pt');
    });

    it('should have valid public key format', () => {
      const publicKey = process.env.CTT_PUBLIC_KEY;
      // Validar formato UUID
      const uuidRegex = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;
      expect(publicKey).toMatch(uuidRegex);
    });

    it('should have valid secret key format', () => {
      const secretKey = process.env.CTT_SECRET_KEY;
      // Validar formato UUID
      const uuidRegex = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;
      expect(secretKey).toMatch(uuidRegex);
    });
  });

  describe('Client Configuration', () => {
    it('should have all required credentials', () => {
      const publicKey = process.env.CTT_PUBLIC_KEY;
      const secretKey = process.env.CTT_SECRET_KEY;
      const apiUrl = process.env.CTT_API_URL;

      expect(publicKey).toBeTruthy();
      expect(secretKey).toBeTruthy();
      expect(apiUrl).toBeTruthy();
    });

    it('should have correct API URL format', () => {
      const apiUrl = process.env.CTT_API_URL;
      expect(apiUrl).toMatch(/^https:\/\//);
      expect(apiUrl).toContain('ctt.pt');
    });
  });
});
