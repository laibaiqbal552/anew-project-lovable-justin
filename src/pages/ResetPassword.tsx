import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Lock } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

const ResetPassword = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Give Supabase a moment to parse the recovery token from URL fragment
    const timer = setTimeout(async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        toast.error('Invalid or expired reset link. Please request a new one.')
        navigate('/')
        return
      }
      setReady(true)
      setLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [navigate])

  const submit = async () => {
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      toast.error('Passwords do not match.')
      return
    }
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Password updated. You are now signed in.')
    navigate('/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Lock className="h-5 w-5" /> Reset your password
          </CardTitle>
          <CardDescription>Enter a new password to complete the reset.</CardDescription>
        </CardHeader>
        <CardContent>
          {!ready && (
            <Alert className="mb-4">
              <AlertDescription>Validating your reset link…</AlertDescription>
            </Alert>
          )}
          <div className="space-y-4">
            <div>
              <Label htmlFor="password">New password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <div>
              <Label htmlFor="confirm">Confirm password</Label>
              <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
            </div>
            <Button className="w-full" onClick={submit} disabled={!ready}>
              Update password
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ResetPassword
