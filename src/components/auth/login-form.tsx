"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, LogIn, Mail, Key } from "lucide-react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message === "Invalid login credentials"
        ? "邮箱或密码错误"
        : error.message);
      setLoading(false);
    } else {
      toast.success("欢迎回来，冒险者！");
      router.push("/village");
      router.refresh();
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/village` },
    });
    if (error) toast.error(error.message);
  };

  return (
    <Card className="w-full max-w-md border-2 border-amber-800/30 bg-gradient-to-b from-amber-950/95 to-stone-900/95 backdrop-blur">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl text-amber-300 font-serif">NeuroQuest</CardTitle>
        <CardDescription className="text-amber-200/60">准备好今天的冒险了吗？</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-amber-200">邮箱</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-600" />
              <Input id="email" type="email" placeholder="adventurer@email.com"
                className="pl-10 bg-stone-800/50 border-amber-800/40 text-amber-100"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-amber-200">密码</Label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-600" />
              <Input id="password" type="password" placeholder="••••••••"
                className="pl-10 bg-stone-800/50 border-amber-800/40 text-amber-100"
                value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
          </div>
          <Button type="submit" disabled={loading}
            className="w-full bg-amber-600 hover:bg-amber-500 text-stone-900 font-bold text-lg h-12">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><LogIn className="h-5 w-5 mr-2" />进入世界</>}
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-amber-800/30" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-stone-900/80 px-2 text-amber-200/50">或</span></div>
          </div>
          <Button type="button" variant="outline" onClick={handleGoogleLogin}
            className="w-full border-amber-800/40 text-amber-200 hover:bg-amber-900/30">
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Google 登录
          </Button>
          <p className="text-center text-sm text-amber-200/50">
            还没有账号？<a href="/signup" className="text-amber-400 hover:underline">注册成为冒险者</a>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
