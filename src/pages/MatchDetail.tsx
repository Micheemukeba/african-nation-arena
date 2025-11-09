import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface Goal {
  id: string;
  player_id: string;
  team_id: string;
  player_name: string;
  minute: number;
}

interface Match {
  id: string;
  stage: string;
  team1_id: string;
  team2_id: string;
  team1_score: number;
  team2_score: number;
  winner_id?: string;
  match_type?: string;
  commentary?: string;
  played_at?: string;
  team1_name: string;
  team2_name: string;
  goals: Goal[];
}

const MatchDetail = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMatch = async () => {
      if (!matchId) {
        navigate("/tournament");
        return;
      }

      try {
        const { data: matchData, error: matchError } = await supabase
          .from("matches")
          .select(`
            id,
            stage,
            team1_id,
            team2_id,
            team1_score,
            team2_score,
            winner_id,
            match_type,
            commentary,
            played_at,
            teams!matches_team1_id_fkey(country_name),
            teams!matches_team2_id_fkey(country_name)
          `)
          .eq("id", matchId)
          .single();

        if (matchError || !matchData) {
          toast.error("Match not found");
          navigate("/tournament");
          return;
        }

        const { data: goals, error: goalsError } = await supabase
          .from("goal_events")
          .select(`
            id,
            player_id,
            team_id,
            minute,
            players(name)
          `)
          .eq("match_id", matchId)
          .order("minute");

        if (goalsError) {
          toast.error("Failed to load goals");
        }

        const formattedGoals = (goals || []).map((g: any) => ({
          id: g.id,
          player_id: g.player_id,
          team_id: g.team_id,
          player_name: g.players?.name || "Unknown",
          minute: g.minute,
        }));

        setMatch({
          id: matchData.id,
          stage: matchData.stage,
          team1_id: matchData.team1_id,
          team2_id: matchData.team2_id,
          team1_score: matchData.team1_score,
          team2_score: matchData.team2_score,
          winner_id: matchData.winner_id,
          match_type: matchData.match_type,
          commentary: matchData.commentary,
          played_at: matchData.played_at,
          team1_name: (matchData.teams as any)?.[0]?.country_name || "TBD",
          team2_name: (matchData.teams as any)?.[1]?.country_name || "TBD",
          goals: formattedGoals,
        });
      } catch (error) {
        console.error("Error loading match:", error);
        toast.error("Failed to load match details");
      } finally {
        setIsLoading(false);
      }
    };

    loadMatch();
  }, [matchId, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading match details...</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return null;
  }

  const stageLabel = {
    quarter_final: "Quarter Final",
    semi_final: "Semi Final",
    final: "Final",
  }[match.stage] || match.stage;

  const team1Goals = match.goals.filter((g) => g.team_id === match.team1_id);
  const team2Goals = match.goals.filter((g) => g.team_id === match.team2_id);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/tournament")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tournament
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{stageLabel}</CardTitle>
                <CardDescription>Match Details</CardDescription>
              </div>
              {match.match_type && (
                <Badge variant={match.match_type === "played" ? "default" : "secondary"}>
                  {match.match_type === "played" ? "Played with Commentary" : "Simulated"}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 items-center">
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">{match.team1_name}</h3>
                <p className="text-sm text-muted-foreground">Team 1</p>
              </div>

              <div className="text-center">
                {match.match_type ? (
                  <div>
                    <div className="text-5xl font-bold mb-2">
                      {match.team1_score} - {match.team2_score}
                    </div>
                    {match.winner_id && (
                      <Badge variant="outline">
                        {match.winner_id === match.team1_id ? match.team1_name : match.team2_name} Wins
                      </Badge>
                    )}
                  </div>
                ) : (
                  <div className="text-3xl font-bold text-muted-foreground">TBD</div>
                )}
              </div>

              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">{match.team2_name}</h3>
                <p className="text-sm text-muted-foreground">Team 2</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {match.match_type && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{match.team1_name} - Goalscorers</CardTitle>
                </CardHeader>
                <CardContent>
                  {team1Goals.length === 0 ? (
                    <p className="text-muted-foreground">No goals scored</p>
                  ) : (
                    <ul className="space-y-2">
                      {team1Goals.map((goal) => (
                        <li key={goal.id} className="flex justify-between items-center">
                          <span>{goal.player_name}</span>
                          <Badge variant="outline">{goal.minute}'</Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{match.team2_name} - Goalscorers</CardTitle>
                </CardHeader>
                <CardContent>
                  {team2Goals.length === 0 ? (
                    <p className="text-muted-foreground">No goals scored</p>
                  ) : (
                    <ul className="space-y-2">
                      {team2Goals.map((goal) => (
                        <li key={goal.id} className="flex justify-between items-center">
                          <span>{goal.player_name}</span>
                          <Badge variant="outline">{goal.minute}'</Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>

            {match.match_type === "played" && match.commentary && (
              <Card>
                <CardHeader>
                  <CardTitle>Match Commentary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-lg">
                    <pre className="text-sm whitespace-pre-wrap font-mono">
                      {match.commentary}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {!match.match_type && (
          <Card>
            <CardHeader>
              <CardTitle>Match Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">This match has not been played yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MatchDetail;
