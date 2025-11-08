import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const Tournament = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setTeams(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="animate-pulse text-primary text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero py-8">
      <div className="container mx-auto px-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <Card className="bg-card border-border shadow-card mb-8">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-2xl">Tournament Overview</CardTitle>
                <CardDescription>
                  {teams.length} teams registered • Minimum 8 teams required to start
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {teams.length < 8 && (
          <div className="bg-accent/10 border border-accent rounded-lg p-6 mb-8 text-center">
            <p className="text-lg font-semibold text-accent-foreground">
              Waiting for more teams to register
            </p>
            <p className="text-muted-foreground mt-2">
              {8 - teams.length} more {8 - teams.length === 1 ? "team" : "teams"} needed to start the tournament
            </p>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team, idx) => (
            <Card key={team.id} className="bg-gradient-card border-border shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{team.country_name}</CardTitle>
                  <div className="text-3xl font-bold text-primary">#{idx + 1}</div>
                </div>
                <CardDescription>
                  Manager: {team.manager_name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Team Rating</span>
                    <span className="font-bold text-lg text-secondary">
                      {team.team_rating ? team.team_rating.toFixed(1) : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Representative</span>
                    <span className="text-sm">{team.representative_name}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {teams.length === 0 && (
          <div className="text-center py-16">
            <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-2xl font-bold mb-2">No Teams Yet</h3>
            <p className="text-muted-foreground mb-6">
              Be the first to register your team for the tournament!
            </p>
            <Button onClick={() => navigate("/register-team")}>
              Register Your Team
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tournament;
