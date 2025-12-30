import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { User, Lock, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from 'react-router-dom';

export default function UserSettings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Password state
  const [passwords, setPasswords] = useState({
    password: "",
    confirmPassword: ""
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.password !== passwords.confirmPassword) {
      return toast.error("As senhas não coincidem.");
    }
    if (passwords.password.length < 6) {
      return toast.error("A senha deve ter pelo menos 6 caracteres.");
    }

    setIsSaving(true);
    try {
      // Attempting to update password via updateMe
      // Note: This depends on the underlying provider allowing password updates via this method
      await base44.auth.updateMe({ password: passwords.password });
      toast.success("Senha atualizada com sucesso!");
      setPasswords({ password: "", confirmPassword: "" });
    } catch (error) {
      toast.error("Erro ao atualizar senha: " + (error.message || "Tente novamente."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await base44.auth.logout();
      navigate('/'); // Redirect after logout (though logout usually handles redirect)
    } catch (error) {
      toast.error("Erro ao sair");
    }
  };

  if (loading) return <div className="p-8">Carregando...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">Configurações da Conta</h1>
        <p className="text-slate-500">Gerencie seus dados pessoais e segurança.</p>
      </div>

      <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-500" />
                Alterar Senha
              </CardTitle>
              <CardDescription>
                Atualize sua senha de acesso. Escolha uma senha forte e segura.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handlePasswordChange}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nova Senha</Label>
                  <Input 
                    id="new-password" 
                    type="password" 
                    value={passwords.password}
                    onChange={(e) => setPasswords({...passwords, password: e.target.value})}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                  <Input 
                    id="confirm-password" 
                    type="password" 
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                    placeholder="••••••••"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t px-6 py-4">
                <div className="text-xs text-slate-400">
                  Mínimo de 6 caracteres
                </div>
                <Button type="submit" disabled={isSaving || !passwords.password} className="bg-indigo-600 hover:bg-indigo-700">
                  {isSaving ? "Salvando..." : "Atualizar Senha"}
                </Button>
              </CardFooter>
            </form>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-500" />
                Dados do Usuário
              </CardTitle>
              <CardDescription>
                Informações da sua conta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email || ''} disabled className="bg-slate-50" />
              </div>
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={user?.full_name || ''} disabled className="bg-slate-50" />
                <p className="text-xs text-slate-400">Para alterar seu nome, entre em contato com o suporte.</p>
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4 bg-slate-50 flex justify-between items-center">
               <span className="text-xs text-slate-500">ID: {user?.id}</span>
               <Button variant="destructive" onClick={handleLogout} type="button" size="sm">
                 <LogOut className="w-4 h-4 mr-2" />
                 Sair da Conta
               </Button>
            </CardFooter>
          </Card>
      </div>
    </div>
  );
}