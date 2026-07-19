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

    if (endpoint === '/auth/login' && method === 'POST') {
      try {
        const body = options.body ? JSON.parse(options.body as string) : {};
        const { email } = body;
        
        // Find user by email (accept any password for demo purposes)
        const user = mockDb.getUsers().find(u => u.email === email);
        if (user) {
          return new Response(JSON.stringify({
            data: {
              user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                name: user.username, 
              },
              token: 'mock-jwt-token-12345'
            }
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        } else {
          return new Response(JSON.stringify({ message: 'Invalid credentials. User not found in mock DB.' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      } catch (e) {
        return new Response(JSON.stringify({ message: 'Bad request' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Default 404 for unhandled routes
    console.warn(`[MockServer] Unhandled route: ${method} ${endpoint}`);
    return new Response(JSON.stringify({ message: 'Not Found in Mock Server' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
