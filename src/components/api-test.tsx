import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { getObjetivos, getHealthCheck, getDashboard, initializeAuth, refreshToken } from '../lib/api';

export function ApiTestComponent() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (test: string, success: boolean, data: any, error?: any, requestInfo?: any) => {
    const result = {
      timestamp: new Date().toLocaleTimeString(),
      test,
      success,
      data: success ? data : null,
      error: success ? null : error?.message || error,
      requestInfo: requestInfo || null
    };
    setResults(prev => [result, ...prev.slice(0, 9)]); // Manter apenas os últimos 10 resultados
  };

  const testHealthCheck = async () => {
    setLoading(true);
    try {
      const response = await getHealthCheck();
      addResult('Health Check', true, response);
    } catch (error) {
      addResult('Health Check', false, null, error);
    }
    setLoading(false);
  };

  const testGetObjetivos = async () => {
    setLoading(true);
    try {
      const response = await getObjetivos();
      addResult('Get Objetivos', true, response);
    } catch (error) {
      addResult('Get Objetivos', false, null, error);
    }
    setLoading(false);
  };

  const testGetDashboard = async () => {
    setLoading(true);
    try {
      const response = await getDashboard();
      addResult('Get Dashboard', true, response);
    } catch (error) {
      addResult('Get Dashboard', false, null, error);
    }
    setLoading(false);
  };

  const testRawFetch = async () => {
    setLoading(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
      const USER_ID = import.meta.env.VITE_USER_ID || '550e8400-e29b-41d4-a716-446655440000';
      const token = localStorage.getItem('auth_token') || `dev-token-${USER_ID}`;
      
      const requestInfo = {
        url: `${API_BASE_URL}/health`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        token: token,
        tokenSource: localStorage.getItem('auth_token') ? 'localStorage (real)' : 'fallback (fictício)',
        userId: USER_ID
      };

      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });

      const data = await response.json();
      addResult('Raw Fetch Test', true, data, null, requestInfo);
    } catch (error) {
      const USER_ID = import.meta.env.VITE_USER_ID || '550e8400-e29b-41d4-a716-446655440000';
      const token = localStorage.getItem('auth_token') || `dev-token-${USER_ID}`;
      addResult('Raw Fetch Test', false, null, error, { 
        token, 
        tokenSource: localStorage.getItem('auth_token') ? 'localStorage (real)' : 'fallback (fictício)',
        userId: USER_ID 
      });
    }
    setLoading(false);
  };

  const testLogin = async () => {
    setLoading(true);
    try {
      // Limpar token atual
      localStorage.removeItem('auth_token');
      
      // Fazer login
      await initializeAuth();
      
      const token = localStorage.getItem('auth_token');
      addResult('Login Test', true, { 
        message: 'Login realizado com sucesso',
        token: token,
        stored: !!token
      });
    } catch (error) {
      addResult('Login Test', false, null, error);
    }
    setLoading(false);
  };

  const testRefreshToken = async () => {
    setLoading(true);
    try {
      const oldToken = localStorage.getItem('auth_token');
      
      // Forçar refresh do token
      await refreshToken();
      
      const newToken = localStorage.getItem('auth_token');
      addResult('Refresh Token Test', true, { 
        message: 'Token renovado com sucesso',
        oldToken: oldToken?.substring(0, 20) + '...',
        newToken: newToken?.substring(0, 20) + '...',
        tokenChanged: oldToken !== newToken
      });
    } catch (error) {
      addResult('Refresh Token Test', false, null, error);
    }
    setLoading(false);
  };

  const testExpiredToken = async () => {
    setLoading(true);
    try {
      // Simular token expirado definindo um token inválido
      const oldToken = localStorage.getItem('auth_token');
      localStorage.setItem('auth_token', 'expired-token-123');
      
      addResult('Simulating Expired Token', true, {
        message: 'Token expirado simulado',
        expiredToken: 'expired-token-123'
      });
      
      // Tentar fazer uma requisição que deve falhar com 401 e renovar automaticamente
      const response = await getObjetivos();
      
      const newToken = localStorage.getItem('auth_token');
      addResult('Auto Token Refresh Test', true, {
        message: 'Token renovado automaticamente após 401',
        data: response,
        newToken: newToken?.substring(0, 20) + '...',
        autoRefreshWorked: newToken !== 'expired-token-123'
      });
    } catch (error) {
      // Restaurar token antigo se houver erro
      const oldToken = localStorage.getItem('auth_token');
      if (oldToken === 'expired-token-123') {
        localStorage.removeItem('auth_token');
        await initializeAuth();
      }
      addResult('Auto Token Refresh Test', false, null, error);
    }
    setLoading(false);
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>🧪 Teste de API - GoalManager</CardTitle>
        <div className="text-sm text-gray-600">
          <p><strong>User ID:</strong> {import.meta.env.VITE_USER_ID}</p>
          <p><strong>API Base URL:</strong> {import.meta.env.VITE_API_BASE_URL}</p>
          <p><strong>Token Atual:</strong> {localStorage.getItem('auth_token') ? '✅ Token real do backend' : '🔄 Token fictício'}</p>
          <p><strong>Credenciais de Login:</strong> teste@goalmanager.com / password</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={testHealthCheck} 
            disabled={loading}
            variant="outline"
          >
            🏥 Test Health Check
          </Button>
          <Button 
            onClick={testGetObjetivos} 
            disabled={loading}
            variant="outline"
          >
            🎯 Test Get Objetivos
          </Button>
          <Button 
            onClick={testGetDashboard} 
            disabled={loading}
            variant="outline"
          >
            📊 Test Dashboard
          </Button>
          <Button 
            onClick={testRawFetch} 
            disabled={loading}
            variant="secondary"
          >
            🔍 Raw Fetch Debug
          </Button>
          <Button 
            onClick={testLogin} 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            🔑 Test Login
          </Button>
          <Button 
            onClick={testRefreshToken} 
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            🔄 Refresh Token
          </Button>
          <Button 
            onClick={testExpiredToken} 
            disabled={loading}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            ⏰ Test Auto-Refresh
          </Button>
          <Button 
            onClick={clearResults} 
            disabled={loading}
            variant="destructive"
          >
            🗑️ Clear
          </Button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            <span className="ml-2">Testando...</span>
          </div>
        )}

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {results.map((result, index) => (
            <div 
              key={index} 
              className={`p-3 rounded border-l-4 ${
                result.success 
                  ? 'bg-green-50 border-l-green-500' 
                  : 'bg-red-50 border-l-red-500'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium">
                  {result.success ? '✅' : '❌'} {result.test}
                </span>
                <span className="text-xs text-gray-500">{result.timestamp}</span>
              </div>
              
              {result.requestInfo && (
                <div className="mb-2">
                  <div className="text-xs font-medium text-blue-600 mb-1">Request Info:</div>
                  <pre className="text-xs bg-blue-50 p-2 rounded overflow-x-auto">
                    {JSON.stringify(result.requestInfo, null, 2)}
                  </pre>
                </div>
              )}
              
              {result.success ? (
                <div>
                  <div className="text-xs font-medium text-green-600 mb-1">Response:</div>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="text-red-600 text-sm">
                  <strong>Erro:</strong> {result.error}
                </div>
              )}
            </div>
          ))}
        </div>

        {results.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            Clique nos botões acima para testar as chamadas da API
          </div>
        )}
      </CardContent>
    </Card>
  );
}