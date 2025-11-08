import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";
import { toast } from "sonner";

interface TopScorer {
  id: string;
  name: string;
  country_name: string;
  goals_scored: number;
  total_minutes_played: number;
  position: number;
}

const TopScorers = () => {
  const [scorers, setScorers] = useState<TopScorer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadScorers = async () => {
      try {
        const { data: players, error } = await supabase
          .from("players")
          .select(`
            id,
            name,
            goals_scored,
            total_minutes_played,
            teams(country_name)
          `)
          .order("goals_scored", { ascending: false })
          .order("total_minutes_played", { ascending: false });

        if (error) {
          toast.error("Failed to load top scorers");
          console.error(error);
          return;
        }

        const topScorers = (players || [])
          .filter((p: any) => p.goals_scored > 0)
          .map((p: any, index: number) => ({
            id: p.id,
            name: p.name,
            country_name: (p.teams as any)?.country_name || "Unknown",
            goals_scored: p.goals_scored,
            total_minutes_played: p.total_minutes_played,
            position: index + 1,
          }));

        setScorers(topScorers);
      } catch (error) {
        console.error("Error loading scorers:", error);
        toast.error("Failed to load top scorers");
      } finally {
        setIsLoading(false);
      }
    };

    loadScorers();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading top scorers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Top Scorers</h1>
          </div>
          <p className="text-muted-foreground">Golden Boot Race</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Goal Scoring Leaderboard</CardTitle>
            <CardDescription>
              Players ranked by goals scored, with minutes played as tiebreaker
            </CardDescription>
          </CardHeader>
          <CardContent>
            {scorers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No goals scored yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {scorers.map((scorer) => (
                  <div
                    key={scorer.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-bold text-sm">{scorer.position}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{scorer.name}</p>
                        <p className="text-sm text-muted-foreground">{scorer.country_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="default" className="mr-2">
                        {scorer.goals_scored} Goals
                      </Badge>
                      {scorer.total_minutes_played > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {scorer.total_minutes_played} min
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TopScorers;
