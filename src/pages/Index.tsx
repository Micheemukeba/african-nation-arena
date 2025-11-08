import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Target, Zap } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="animate-pulse text-primary text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Trophy className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-primary">African Nations League</h1>
          </div>
          <div className="flex gap-3">
            {user ? (
              <>
                <Button variant="outline" onClick={() => navigate("/tournament")}>
                  View Tournament
                </Button>
                <Button variant="outline" onClick={() => navigate("/register-team")}>
                  Register Team
                </Button>
                <Button variant="destructive" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <Button onClick={() => navigate("/auth")}>
                Login / Sign Up
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <div className="inline-block">
            <div className="p-4 rounded-full bg-primary/10 shadow-gold">
              <Trophy className="h-16 w-16 text-primary" />
            </div>
          </div>
          
          <h2 className="text-5xl md:text-6xl font-bold bg-gradient-gold bg-clip-text text-transparent">
            African Nations League
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            The premier inter-country football competition bringing together the best African nations 
            in an exciting knockout tournament format.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            {!user && (
              <Button 
                size="lg" 
                className="text-lg px-8 shadow-gold"
                onClick={() => navigate("/auth")}
              >
                Get Started
              </Button>
            )}
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8"
              onClick={() => navigate("/tournament")}
            >
              View Tournament
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-gradient-card p-8 rounded-lg shadow-card border border-border">
            <div className="p-3 rounded-full bg-primary/10 w-fit mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3">Team Registration</h3>
            <p className="text-muted-foreground">
              Federation representatives can register their country and build a competitive 23-player squad.
            </p>
          </div>

          <div className="bg-gradient-card p-8 rounded-lg shadow-card border border-border">
            <div className="p-3 rounded-full bg-secondary/10 w-fit mb-4">
              <Target className="h-8 w-8 text-secondary" />
            </div>
            <h3 className="text-xl font-bold mb-3">Knockout Tournament</h3>
            <p className="text-muted-foreground">
              Experience the excitement of quarter-finals, semi-finals, and the grand final with automatic bracket generation.
            </p>
          </div>

          <div className="bg-gradient-card p-8 rounded-lg shadow-card border border-border">
            <div className="p-3 rounded-full bg-accent/10 w-fit mb-4">
              <Zap className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-xl font-bold mb-3">Live Simulation</h3>
            <p className="text-muted-foreground">
              Watch matches unfold with AI-generated commentary or view simulated results with complete goal details.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-primary mb-2">8+</div>
            <div className="text-muted-foreground">Teams</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-secondary mb-2">23</div>
            <div className="text-muted-foreground">Players per Squad</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-accent mb-2">7</div>
            <div className="text-muted-foreground">Matches</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary mb-2">1</div>
            <div className="text-muted-foreground">Champion</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
