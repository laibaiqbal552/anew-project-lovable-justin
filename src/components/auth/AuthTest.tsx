import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AuthTest = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testConnection = async () => {
    try {
      console.log('Testing Supabase connection...');
      console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
      console.log('Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
      
      const { data, error } = await supabase.from('profiles').select('count').single();
      console.log('Connection test result:', { data, error });
      
      if (error) {
        setResult({ type: 'error', message: error.message });
      } else {
        setResult({ type: 'success', message: 'Connection successful' });
      }
    } catch (err: any) {
      console.error('Connection test failed:', err);
      setResult({ type: 'error', message: err.message });
    }
  };

  const testSignUp = async () => {
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Testing sign up...');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: 'Test User',
            company_name: 'Test Company',
          }
        }
      });

      console.log('Sign up result:', { data, error });
      
      if (error) {
        setResult({ type: 'error', message: `Sign up error: ${error.message}` });
      } else {
        setResult({ type: 'success', message: `Sign up successful: ${data.user?.id}` });
      }
    } catch (err: any) {
      console.error('Sign up test failed:', err);
      setResult({ type: 'error', message: `Sign up failed: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const testSignIn = async () => {
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Testing sign in...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Sign in result:', { data, error });
      
      if (error) {
        setResult({ type: 'error', message: `Sign in error: ${error.message}` });
      } else {
        setResult({ type: 'success', message: `Sign in successful: ${data.user?.id}` });
      }
    } catch (err: any) {
      console.error('Sign in test failed:', err);
      setResult({ type: 'error', message: `Sign in failed: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Auth Debug Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        
        <div className="flex flex-col gap-2">
          <Button onClick={testConnection} variant="outline">
            Test Connection
          </Button>
          <Button 
            onClick={testSignUp} 
            disabled={isLoading}
            variant="secondary"
          >
            Test Sign Up
          </Button>
          <Button 
            onClick={testSignIn} 
            disabled={isLoading}
          >
            Test Sign In
          </Button>
        </div>

        {result && (
          <div className={`p-3 rounded text-sm ${
            result.type === 'error' 
              ? 'bg-red-100 text-red-800 border border-red-200' 
              : 'bg-green-100 text-green-800 border border-green-200'
          }`}>
            {result.message}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AuthTest;