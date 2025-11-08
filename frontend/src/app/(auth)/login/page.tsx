'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { auth, type UserRole } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('farmer');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Use auth utility to login - returns user with their actual role
      const user = await auth.login(email, password, role);

      // Ensure we have a valid user before redirecting
      if (!user || !user.role) {
        throw new Error('Login succeeded but user data is incomplete');
      }

      // Reset loading state before redirect
      setIsLoading(false);
      
      // Small delay to ensure state updates, then redirect
      setTimeout(() => {
        router.push(`/${user.role}`);
      }, 100);
    } catch (err: any) {
      // Display error in UI
      setError(err.message || 'Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
          {/* Left side - Branding */}
          <div className="hidden md:block space-y-6">
            <div className="space-y-4">
              <h1 className="text-5xl font-bold text-green-800">
                🌾 Farm-to-Table
              </h1>
              <p className="text-xl text-gray-600">
                Smart Supply Chain Platform
              </p>
              <p className="text-gray-500">
                Connecting farmers, distributors, restaurants, and health inspectors
                for a more sustainable and transparent food supply chain.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="p-4 bg-white rounded-lg shadow-sm">
                <div className="text-3xl mb-2">🌾</div>
                <div className="font-semibold text-gray-800">Farmers</div>
                <div className="text-sm text-gray-500">Manage inventory</div>
              </div>
              <div className="p-4 bg-white rounded-lg shadow-sm">
                <div className="text-3xl mb-2">🍽️</div>
                <div className="font-semibold text-gray-800">Restaurants</div>
                <div className="text-sm text-gray-500">Order fresh produce</div>
              </div>
              <div className="p-4 bg-white rounded-lg shadow-sm">
                <div className="text-3xl mb-2">🚚</div>
                <div className="font-semibold text-gray-800">Distributors</div>
                <div className="text-sm text-gray-500">Manage deliveries</div>
              </div>
              <div className="p-4 bg-white rounded-lg shadow-sm">
                <div className="text-3xl mb-2">🔍</div>
                <div className="font-semibold text-gray-800">Inspectors</div>
                <div className="text-sm text-gray-500">Ensure compliance</div>
              </div>
            </div>
          </div>

          {/* Right side - Login form */}
          <Card className="w-full shadow-xl">
            <CardHeader className="text-center space-y-2">
              <div className="md:hidden text-4xl mb-2">🌾</div>
              <CardTitle className="text-3xl font-bold">
                Welcome Back
              </CardTitle>
              <CardDescription>
                Sign in to your account to continue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="role">I am a...</Label>
                  <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="farmer">🌾 Farmer</SelectItem>
                      <SelectItem value="restaurant">🍽️ Restaurant</SelectItem>
                      <SelectItem value="distributor">🚚 Distributor</SelectItem>
                      <SelectItem value="inspector">🔍 Health Inspector</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="password">Password</Label>
                    <a href="#" className="text-sm text-primary hover:underline">
                      Forgot password?
                    </a>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>

                <p className="text-center text-sm text-gray-600">
                  Don't have an account?{' '}
                  <a href="/register" className="text-primary font-semibold hover:underline">
                    Sign up
                  </a>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
  );
}
