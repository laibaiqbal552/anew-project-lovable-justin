import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Building2, ChevronDown, Plus } from 'lucide-react'
import { toast } from 'sonner'

interface Business {
  id: string
  business_name: string
}

interface BusinessSelectorProps {
  currentBusinessId?: string
  onBusinessChange?: (businessId: string) => void
}

export default function BusinessSelector({ currentBusinessId, onBusinessChange }: BusinessSelectorProps) {
  const navigate = useNavigate()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [currentBusiness, setCurrentBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBusinesses()
  }, [])

  useEffect(() => {
    if (currentBusinessId && businesses.length > 0) {
      const business = businesses.find(b => b.id === currentBusinessId)
      if (business) setCurrentBusiness(business)
    } else if (businesses.length > 0 && !currentBusiness) {
      setCurrentBusiness(businesses[0])
    }
  }, [currentBusinessId, businesses])

  const loadBusinesses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('businesses')
        .select('id, business_name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setBusinesses(data || [])
    } catch (error: any) {
      console.error('Error loading businesses:', error)
      toast.error('Failed to load businesses')
    } finally {
      setLoading(false)
    }
  }

  const handleBusinessSelect = (business: Business) => {
    setCurrentBusiness(business)
    localStorage.setItem('currentBusinessId', business.id)
    if (onBusinessChange) {
      onBusinessChange(business.id)
    }
  }

  const handleAddBusiness = () => {
    navigate('/setup')
  }

  if (loading || businesses.length === 0) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          <span className="max-w-[200px] truncate">
            {currentBusiness?.business_name || 'Select Business'}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[280px] bg-white dark:bg-gray-800">
        <DropdownMenuLabel>Your Businesses</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {businesses.map((business) => (
          <DropdownMenuItem
            key={business.id}
            onClick={() => handleBusinessSelect(business)}
            className={`cursor-pointer ${
              currentBusiness?.id === business.id ? 'bg-accent' : ''
            }`}
          >
            <Building2 className="h-4 w-4 mr-2" />
            {business.business_name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleAddBusiness} className="cursor-pointer text-brand-600">
          <Plus className="h-4 w-4 mr-2" />
          Add New Business
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
