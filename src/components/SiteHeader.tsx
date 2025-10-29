import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { BarChart3, LogOut, User } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import topservLogo from "/assets/topserv-logo.png";

export default function SiteHeader() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const isGuest = localStorage.getItem('isGuestUser') === 'true'
  const isActive = (p: string) => pathname === p

  const handleLogout = async () => {
    if (isGuest) {
      // Clear all guest-related data from localStorage
      localStorage.removeItem('isGuestUser')
      localStorage.removeItem('currentBusinessId')
      localStorage.removeItem('businessName')
      localStorage.removeItem('businessWebsiteUrl')
      localStorage.removeItem('businessIndustry')
      localStorage.removeItem('businessAddress')
      localStorage.removeItem('businessPhone')
      localStorage.removeItem('businessDescription')
      localStorage.removeItem('guestAnalysisResults')
      localStorage.removeItem('registrationData')
      localStorage.removeItem('fromSocialMedia')
      localStorage.removeItem('socialUrls')
      localStorage.removeItem('detectedSocialMedia')
      localStorage.removeItem('detectedSocialMediaBusinessId')
      localStorage.removeItem('currentReportId')
      // Navigate to home
      navigate('/')
    } else {
      // Regular user sign out
      await signOut()
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <img src={topservLogo} alt="TopServ Digital" className="h-9 transition-transform group-hover:scale-105" />
          <div className="hidden sm:block">
            <span className="font-bold text-lg tracking-tight text-brand-700">TopServ Digital</span>
            <p className="text-xs text-gray-500">Brand Equity Analyzer</p>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          {user || isGuest ? (
            <>
              <Button
                asChild
                variant={isActive('/dashboard') ? 'default' : 'ghost'}
                className="hidden sm:flex"
              >
                <Link to="/dashboard" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Reports
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant={isActive('/account') ? 'default' : 'ghost'} size="icon">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-gray-800">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{isGuest ? 'Guest User' : 'My Account'}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email || 'guest@temp.com'}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="sm:hidden">
                    <Link to="/dashboard" className="flex items-center gap-2 cursor-pointer">
                      <BarChart3 className="h-4 w-4" />
                      Reports
                    </Link>
                  </DropdownMenuItem>
                  {user && !isGuest && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/account" className="flex items-center gap-2 cursor-pointer">
                          <User className="h-4 w-4" />
                          Account Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    {isGuest ? 'Exit Guest Mode' : 'Sign Out'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link to="/#features">Features</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link to="/#pricing">Pricing</Link>
              </Button>
              <Button asChild variant="default">
                <Link to="/start-scan">Get Started</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
