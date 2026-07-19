import { mockDb } from './mockDb';

export class MockServer {
  static async handle(method: string, endpoint: string, options: RequestInit): Promise<Response> {
    console.log(`[MockServer] Intercepted ${method} ${endpoint}`);
    
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 300));

    // Basic routing
    if (endpoint.startsWith('/interns') && method === 'GET') {
      return new Response(JSON.stringify({ data: mockDb.getInterns() }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (endpoint.startsWith('/users') && method === 'GET') {
      return new Response(JSON.stringify({ data: mockDb.getUsers() }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Default 404 for unhandled routes
    console.warn(`[MockServer] Unhandled route: ${method} ${endpoint}`);
    return new Response(JSON.stringify({ message: 'Not Found in Mock Server' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
