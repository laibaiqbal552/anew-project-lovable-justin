import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Loader2, Play, Eye, Plus } from 'lucide-react'
import { toast } from 'sonner'

interface Business { id: string; business_name: string }
interface Report { id: string; business_id: string; created_at: string; report_status: string; overall_score: number | null }

export default function AccountHub() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [reports, setReports] = useState<Report[]>([])

  useEffect(() => { init() }, [])

  const init = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) { navigate('/'); return }

      const { data: biz, error: bizErr } = await supabase
        .from('businesses')
        .select('id, business_name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (bizErr) throw bizErr
      setBusinesses(biz || [])

      const ids = (biz || []).map(b => b.id)
      if (ids.length) {
        const { data: reps, error: repErr } = await supabase
          .from('brand_reports')
          .select('id, business_id, created_at, report_status, overall_score')
          .in('business_id', ids)
          .order('created_at', { ascending: false })
        if (repErr) throw repErr
        setReports(reps || [])
      }
    } catch (e:any) {
      console.error(e)
      toast.error('Failed to load your account hub')
    } finally {
      setLoading(false)
    }
  }

  const runAnotherScan = (businessId: string) => {
    localStorage.setItem('currentBusinessId', businessId)
    localStorage.removeItem('currentReportId')
    navigate('/analysis')
  }

  const openReport = (businessId: string, reportId: string) => {
    localStorage.setItem('currentBusinessId', businessId)
    localStorage.setItem('currentReportId', reportId)
    navigate('/dashboard')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Account Hub</h1>
            <p className="text-gray-600">Manage your account, view all reports, and run new scans.</p>
          </div>
          <Button onClick={() => navigate('/setup')} variant="outline" className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> New Business
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Businesses</CardTitle>
            <CardDescription>Select a business to run another scan.</CardDescription>
          </CardHeader>
          <CardContent>
            {businesses.length === 0 ? (
              <p className="text-sm text-gray-600">No businesses yet. Start by creating one.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {businesses.map(b => (
                  <Button key={b.id} variant="secondary" onClick={() => runAnotherScan(b.id)} className="flex items-center gap-2">
                    <Play className="h-4 w-4" /> Run Scan — {b.business_name}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Brand Reports</CardTitle>
            <CardDescription>Open any report or run a new scan for its business.</CardDescription>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <p className="text-sm text-gray-600">No reports yet. Run your first scan.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map(r => {
                    const biz = businesses.find(b => b.id === r.business_id)
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{biz?.business_name || '—'}</TableCell>
                        <TableCell>{new Date(r.created_at).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={r.report_status === 'completed' ? 'secondary' : 'outline'}>
                            {r.report_status || 'unknown'} {r.overall_score ? `• ${r.overall_score}` : ''}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => runAnotherScan(r.business_id)}>
                              Run Again
                            </Button>
                            <Button size="sm" className="flex items-center gap-1" onClick={() => openReport(r.business_id, r.id)}>
                              <Eye className="h-4 w-4" /> Open
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
