import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { generateBracket, getBracketForTournament } from "@/lib/bracketGeneration";
import { simulateMatch, recordMatchResult } from "@/lib/matchSimulation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { AlertCircle, Play, Zap, RotateCcw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Tournament {
  id: string;
  name: string;
  status: string;
  current_stage?: string;
  started_at?: string;
}

interface Match {
  id: string;
  stage: string;
  team1_id: string;
  team2_id: string;
  team1_score: number;
  team2_score: number;
  winner_id?: string;
  team1_name?: string;
  team2_name?: string;
  match_type?: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [teamCount, setTeamCount] = useState(0);
  const [simulating, setSimulating] = useState<string | null>(null);

  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsAuthorized(true);
        await loadData();
      } catch (error) {
        console.error("Error initializing:", error);
        toast.error("Failed to load dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

  const loadData = async () => {
    try {
      const { data: tournaments, error: tournError } = await supabase
        .from("tournaments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!tournError && tournaments) {
        setTournament(tournaments);

        if (tournaments.status === "in_progress") {
          const { data: bracketMatches } = await supabase
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
              teams!matches_team1_id_fkey(country_name),
              teams!matches_team2_id_fkey(country_name)
            `)
            .eq("tournament_id", tournaments.id)
            .order("stage");

          if (!bracketMatches) {
            setMatches([]);
          } else {
            const formattedMatches = (bracketMatches as any[]).map((m) => ({
              id: m.id,
              stage: m.stage,
              team1_id: m.team1_id,
              team2_id: m.team2_id,
              team1_score: m.team1_score,
              team2_score: m.team2_score,
              winner_id: m.winner_id,
              match_type: m.match_type,
              team1_name: m.teams?.[0]?.country_name || "TBD",
              team2_name: m.teams?.[1]?.country_name || "TBD",
            }));
            setMatches(formattedMatches);
          }
        }
      }

      const { count } = await supabase
        .from("teams")
        .select("*", { count: "exact", head: true });

      setTeamCount(count || 0);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load admin data");
    }
  };

  const handleStartTournament = async () => {
    if (teamCount < 8) {
      toast.error(`Need 8 teams to start. Currently have ${teamCount}.`);
      return;
    }

    setIsLoading(true);
    try {
      const { data: newTournament, error: tournError } = await supabase
        .from("tournaments")
        .insert({
          name: "African Nations League",
          status: "in_progress",
          current_stage: "quarter_final",
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (tournError || !newTournament) {
        toast.error("Failed to create tournament");
        return;
      }

      await generateBracket(newTournament.id);
      toast.success("Tournament started! Bracket generated.");
      await loadData();
    } catch (error) {
      console.error("Error starting tournament:", error);
      toast.error("Failed to start tournament");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayMatch = async (matchId: string, withCommentary: boolean) => {
    setSimulating(matchId);
    try {
      const match = matches.find((m) => m.id === matchId);
      if (!match) {
        toast.error("Match not found");
        return;
      }

      const result = await simulateMatch(match.team1_id, match.team2_id, withCommentary);
      await recordMatchResult(matchId, result, withCommentary ? "played" : "simulated");

      toast.success(`Match completed! ${match.team1_name} ${result.team1_score} - ${result.team2_score} ${match.team2_name}`);
      await loadData();
    } catch (error) {
      console.error("Error playing match:", error);
      toast.error("Failed to simulate match");
    } finally {
      setSimulating(null);
    }
  };

  const handleResetTournament = async () => {
    if (!tournament) return;

    if (!confirm("Are you sure you want to reset the tournament? This cannot be undone.")) {
      return;
    }

    setIsLoading(true);
    try {
      await supabase.from("matches").delete().eq("tournament_id", tournament.id);
      await supabase
        .from("tournaments")
        .update({ status: "registration", current_stage: "quarter_final", started_at: null })
        .eq("id", tournament.id);

      toast.success("Tournament reset to registration stage");
      await loadData();
    } catch (error) {
      console.error("Error resetting tournament:", error);
      toast.error("Failed to reset tournament");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage tournament and matches</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Tournament Status</CardTitle>
              <CardDescription>Current tournament state</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-lg font-semibold capitalize">{tournament?.status || "Not Started"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Registered Teams</p>
                <p className="text-lg font-semibold">{teamCount}/8</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Stage</p>
                <p className="text-lg font-semibold capitalize">{tournament?.current_stage || "Pending"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tournament Controls</CardTitle>
              <CardDescription>Manage tournament flow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!tournament || tournament.status === "registration" ? (
                <Button
                  onClick={handleStartTournament}
                  disabled={teamCount < 8 || isLoading}
                  className="w-full"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Start Tournament
                </Button>
              ) : (
                <Button onClick={handleResetTournament} disabled={isLoading} variant="destructive" className="w-full">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset Tournament
                </Button>
              )}
              {teamCount < 8 && !tournament && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Need {8 - teamCount} more teams to start</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {tournament && tournament.status === "in_progress" && matches.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Matches</CardTitle>
              <CardDescription>Simulate or play matches</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="quarter_final">
                <TabsList>
                  <TabsTrigger value="quarter_final">Quarter Finals</TabsTrigger>
                  <TabsTrigger value="semi_final">Semi Finals</TabsTrigger>
                  <TabsTrigger value="final">Final</TabsTrigger>
                </TabsList>

                {["quarter_final", "semi_final", "final"].map((stage) => {
                  const stageMatches = matches.filter((m) => m.stage === stage);
                  return (
                    <TabsContent key={stage} value={stage} className="space-y-4">
                      {stageMatches.length === 0 ? (
                        <p className="text-muted-foreground">No matches in this stage</p>
                      ) : (
                        stageMatches.map((match) => (
                          <Card key={match.id} className="bg-muted/50">
                            <CardContent className="pt-6">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex-1">
                                  <p className="font-semibold">{match.team1_name}</p>
                                </div>
                                {match.match_type ? (
                                  <div className="text-center px-4">
                                    <p className="text-2xl font-bold">
                                      {match.team1_score} - {match.team2_score}
                                    </p>
                                    <p className="text-xs text-muted-foreground capitalize">
                                      {match.match_type}
                                    </p>
                                  </div>
                                ) : (
                                  <div className="text-center px-4">
                                    <p className="text-muted-foreground">TBD</p>
                                  </div>
                                )}
                                <div className="flex-1 text-right">
                                  <p className="font-semibold">{match.team2_name}</p>
                                </div>
                              </div>
                              {!match.match_type && (
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => handlePlayMatch(match.id, true)}
                                    disabled={simulating === match.id}
                                    size="sm"
                                    className="flex-1"
                                  >
                                    <Play className="mr-2 h-4 w-4" />
                                    Play with Commentary
                                  </Button>
                                  <Button
                                    onClick={() => handlePlayMatch(match.id, false)}
                                    disabled={simulating === match.id}
                                    size="sm"
                                    variant="outline"
                                    className="flex-1"
                                  >
                                    <Zap className="mr-2 h-4 w-4" />
                                    Simulate
                                  </Button>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </TabsContent>
                  );
                })}
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
