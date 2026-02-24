import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { neon } from '@/api/neonClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ email: '', password: '', name: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await neon.auth.login(loginData.email, loginData.password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await neon.auth.register(registerData.email, registerData.password, registerData.name);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Erro ao criar conta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-pink-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/neon-prod/public/69405b4dfc2b80b38d51b395/689d504d8_LogoViralzera.png" 
              alt="Viralzera" 
              className="h-20 w-auto"
            />
          </div>
          <CardTitle className="text-2xl">Bem-vindo ao Viralzera</CardTitle>
          <CardDescription>Faça login ou crie sua conta para continuar</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="register">Criar Conta</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button 
                  type="submit" 
                  className="w-full bg-pink-600 hover:bg-pink-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">Nome</Label>
                  <Input
                    id="register-name"
                    type="text"
                    placeholder="Seu nome"
                    value={registerData.name}
                    onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Senha</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="••••••••"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    required
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button 
                  type="submit" 
                  className="w-full bg-pink-600 hover:bg-pink-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Criando...' : 'Criar Conta'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
