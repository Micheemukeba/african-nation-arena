import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Trophy, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { z } from "zod";

const POSITIONS = ["GK", "DF", "MD", "AT"] as const;
const MIN_PLAYERS = 23;

type Player = {
  name: string;
  position: typeof POSITIONS[number];
  id: string;
};

const RegisterTeam = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [countryName, setCountryName] = useState("");
  const [managerName, setManagerName] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [captainId, setCaptainId] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      setLoading(false);
    };
    checkUser();
  }, [navigate]);

  const addPlayer = () => {
    if (players.length >= MIN_PLAYERS) {
      toast.error(`Maximum of ${MIN_PLAYERS} players allowed`);
      return;
    }
    setPlayers([...players, { name: "", position: "DF", id: crypto.randomUUID() }]);
  };

  const removePlayer = (id: string) => {
    setPlayers(players.filter(p => p.id !== id));
    if (captainId === id) {
      setCaptainId("");
    }
  };

  const updatePlayer = (id: string, field: keyof Player, value: string) => {
    setPlayers(players.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const generateRatings = (naturalPosition: string) => {
    const ratings: any = {};
    POSITIONS.forEach(pos => {
      if (pos === naturalPosition) {
        ratings[`rating_${pos.toLowerCase()}`] = Math.floor(Math.random() * 51) + 50; // 50-100
      } else {
        ratings[`rating_${pos.toLowerCase()}`] = Math.floor(Math.random() * 51); // 0-50
      }
    });
    return ratings;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!countryName.trim()) {
      toast.error("Country name is required");
      return;
    }
    
    if (!managerName.trim()) {
      toast.error("Manager name is required");
      return;
    }

    if (players.length !== MIN_PLAYERS) {
      toast.error(`You must have exactly ${MIN_PLAYERS} players`);
      return;
    }

    if (players.some(p => !p.name.trim())) {
      toast.error("All players must have names");
      return;
    }

    if (!captainId) {
      toast.error("Please select a captain");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create team
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .insert({
          country_name: countryName,
          representative_id: user.id,
          representative_name: user.user_metadata.full_name || user.email,
          manager_name: managerName,
        })
        .select()
        .single();

      if (teamError) {
        if (teamError.message.includes("duplicate key")) {
          toast.error("This country is already registered");
        } else {
          toast.error(teamError.message);
        }
        setIsSubmitting(false);
        return;
      }

      // Create players
      const playersData = players.map(player => ({
        team_id: team.id,
        name: player.name,
        natural_position: player.position,
        is_captain: player.id === captainId,
        ...generateRatings(player.position),
      }));

      const { error: playersError } = await supabase
        .from("players")
        .insert(playersData);

      if (playersError) {
        toast.error(playersError.message);
        setIsSubmitting(false);
        return;
      }

      toast.success("Team registered successfully!");
      navigate("/tournament");
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
      <div className="animate-pulse text-primary text-2xl">Loading...</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-hero py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <Card className="bg-card border-border shadow-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-2xl">Register Your Team</CardTitle>
                <CardDescription>
                  Complete your team registration with {MIN_PLAYERS} players
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">Country Name *</Label>
                  <Input
                    id="country"
                    value={countryName}
                    onChange={(e) => setCountryName(e.target.value)}
                    placeholder="e.g., Nigeria"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manager">Team Manager *</Label>
                  <Input
                    id="manager"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    placeholder="e.g., John Doe"
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Squad ({players.length}/{MIN_PLAYERS})</Label>
                  {players.length < MIN_PLAYERS && (
                    <Button type="button" onClick={addPlayer} variant="outline" size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Player
                    </Button>
                  )}
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {players.map((player, idx) => (
                    <Card key={player.id} className="bg-muted/20">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-12 gap-3 items-end">
                          <div className="col-span-1 text-center font-semibold text-muted-foreground">
                            {idx + 1}
                          </div>
                          <div className="col-span-5">
                            <Input
                              placeholder="Player Name"
                              value={player.name}
                              onChange={(e) => updatePlayer(player.id, "name", e.target.value)}
                              required
                            />
                          </div>
                          <div className="col-span-3">
                            <Select
                              value={player.position}
                              onValueChange={(val) => updatePlayer(player.id, "position", val)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="GK">GK</SelectItem>
                                <SelectItem value="DF">DF</SelectItem>
                                <SelectItem value="MD">MD</SelectItem>
                                <SelectItem value="AT">AT</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-2 flex gap-2">
                            <Button
                              type="button"
                              variant={captainId === player.id ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCaptainId(player.id)}
                              className="flex-1"
                            >
                              C
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removePlayer(player.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {players.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Click "Add Player" to start building your squad
                  </div>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={isSubmitting || players.length !== MIN_PLAYERS || !captainId}
              >
                {isSubmitting ? "Registering..." : "Register Team"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterTeam;
