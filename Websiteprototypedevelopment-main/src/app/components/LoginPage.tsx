import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { HardHat } from 'lucide-react';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await onLogin(email, password);
      if (!success) {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Mock password reset
    await new Promise(resolve => setTimeout(resolve, 1000));
    setError('');
    alert('Password reset link has been sent to your email');
    setShowReset(false);
    setLoading(false);
  };

  if (showReset) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#CAEDF1] to-[#148ABB] p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="h-12 w-12 bg-[#075B7A] rounded-lg flex items-center justify-center">
                <HardHat className="h-7 w-7 text-white" />
              </div>
              <span className="text-2xl text-[#075B7A]" style={{ fontFamily: 'var(--font-family-heading)' }}>SmartSite</span>
            </div>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a reset link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="your.email@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-[#075B7A] hover:bg-[#064d66]" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setShowReset(false)}
              >
                Back to Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#CAEDF1] to-[#148ABB] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-12 w-12 bg-[#075B7A] rounded-lg flex items-center justify-center">
              <HardHat className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl text-[#075B7A]" style={{ fontFamily: 'var(--font-family-heading)' }}>SmartSite</span>
          </div>
          <CardTitle>Welcome to SmartSite</CardTitle>
          <CardDescription>
            Construction site management powered by AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full bg-[#075B7A] hover:bg-[#064d66]" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            <button
              type="button"
              onClick={() => setShowReset(true)}
              className="text-sm text-[#148ABB] hover:underline w-full text-center"
            >
              Forgot password?
            </button>
          </form>
          <div className="mt-6 p-4 bg-[#CAEDF1] rounded-md">
            <p className="text-xs mb-2">Demo accounts:</p>
            <div className="text-xs space-y-1 text-gray-700">
              <div>Super Admin: admin@smartsite.com</div>
              <div>Director: director@buildcorp.com</div>
              <div>Project Manager: pm@buildcorp.com</div>
              <div>QHSE Manager: qhse@buildcorp.com</div>
              <div>Client: client@investor.com</div>
              <div className="pt-2 text-[#075B7A]">Password: any</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
