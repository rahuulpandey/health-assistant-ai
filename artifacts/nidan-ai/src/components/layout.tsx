import { Link, useLocation } from "wouter";
import { UserButton, useUser } from "@clerk/react";
import { 
  Activity, 
  MessageSquare, 
  FileImage, 
  Files, 
  Stethoscope, 
  Settings as SettingsIcon,
  Menu,
  HeartPulse
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navigation = [
  { name: "Dashboard", href: "/", icon: Activity },
  { name: "Health Chat", href: "/chat", icon: MessageSquare },
  { name: "Image Analysis", href: "/analyze", icon: FileImage },
  { name: "Reports", href: "/reports", icon: Files },
  { name: "Doctors", href: "/doctors", icon: Stethoscope },
  { name: "Settings", href: "/settings", icon: SettingsIcon },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const NavLinks = () => (
    <>
      {navigation.map((item) => {
        const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
        return (
          <Link key={item.name} href={item.href}>
            <div
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors cursor-pointer",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "flex-shrink-0 -ml-1 mr-3 h-5 w-5",
                  isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                )}
                aria-hidden="true"
              />
              <span className="truncate">{item.name}</span>
            </div>
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile sidebar */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <div className="flex h-full flex-col">
            <div className="flex items-center px-6 py-6 h-16 shrink-0">
              <HeartPulse className="h-8 w-8 text-primary" />
              <span className="ml-3 text-xl font-bold tracking-tight text-foreground">NIDAN.ai</span>
            </div>
            <div className="px-4 py-4 space-y-1 overflow-y-auto flex-1">
              <NavLinks />
            </div>
            <div className="p-4 border-t flex items-center shrink-0">
              <UserButton afterSignOutUrl="/sign-in" />
              <div className="ml-3 flex flex-col">
                <span className="text-sm font-medium text-foreground">{user?.fullName}</span>
                <span className="text-xs text-muted-foreground truncate w-40">{user?.primaryEmailAddress?.emailAddress}</span>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col border-r bg-card h-full">
        <div className="flex items-center px-6 h-16 shrink-0 border-b">
          <HeartPulse className="h-8 w-8 text-primary" />
          <span className="ml-3 text-xl font-bold tracking-tight text-foreground">NIDAN.ai</span>
        </div>
        <div className="flex-1 flex flex-col overflow-y-auto px-4 py-6 space-y-1">
          <NavLinks />
        </div>
        <div className="p-4 border-t shrink-0 flex items-center">
          <UserButton afterSignOutUrl="/sign-in" />
          <div className="ml-3 flex flex-col overflow-hidden">
            <span className="text-sm font-medium text-foreground truncate">{user?.fullName}</span>
            <span className="text-xs text-muted-foreground truncate">{user?.primaryEmailAddress?.emailAddress}</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="md:hidden flex h-16 shrink-0 items-center border-b px-4 bg-card">
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)}>
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex items-center justify-center flex-1">
            <HeartPulse className="h-6 w-6 text-primary" />
            <span className="ml-2 text-lg font-bold">NIDAN.ai</span>
          </div>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>

        <main className="flex-1 overflow-y-auto bg-background focus:outline-none">
          <div className="py-6 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
