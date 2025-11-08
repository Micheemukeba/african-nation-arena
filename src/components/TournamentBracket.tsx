import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";

interface Match {
  id: string;
  stage: string;
  team1: { id: string; name: string };
  team2: { id: string; name: string };
  team1_score: number | null;
  team2_score: number | null;
  winner_id: string | null;
  played_at: string | null;
}

interface TournamentBracketProps {
  matches: Match[];
}

const TournamentBracket = ({ matches }: TournamentBracketProps) => {
  const quarterFinals = matches.filter(m => m.stage === 'quarter_final');
  const semiFinals = matches.filter(m => m.stage === 'semi_final');
  const final = matches.find(m => m.stage === 'final');

  const MatchCard = ({ match }: { match: Match }) => {
    const isPlayed = match.played_at !== null;
    const team1Won = match.winner_id === match.team1.id;
    const team2Won = match.winner_id === match.team2.id;

    return (
      <Card className="bg-gradient-card border-border shadow-card hover:shadow-glow transition-all duration-300">
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Team 1 */}
            <div className={`flex items-center justify-between p-3 rounded-lg transition-all ${
              team1Won ? 'bg-primary/20 border-2 border-primary' : 'bg-muted/50'
            }`}>
              <span className={`font-semibold ${team1Won ? 'text-primary' : 'text-foreground'}`}>
                {match.team1.name}
              </span>
              {isPlayed && (
                <span className={`text-2xl font-bold ${team1Won ? 'text-primary' : 'text-muted-foreground'}`}>
                  {match.team1_score}
                </span>
              )}
            </div>

            {/* VS Divider */}
            <div className="flex items-center justify-center">
              <Badge variant={isPlayed ? "default" : "secondary"} className="text-xs">
                {isPlayed ? "FINAL" : "VS"}
              </Badge>
            </div>

            {/* Team 2 */}
            <div className={`flex items-center justify-between p-3 rounded-lg transition-all ${
              team2Won ? 'bg-primary/20 border-2 border-primary' : 'bg-muted/50'
            }`}>
              <span className={`font-semibold ${team2Won ? 'text-primary' : 'text-foreground'}`}>
                {match.team2.name}
              </span>
              {isPlayed && (
                <span className={`text-2xl font-bold ${team2Won ? 'text-primary' : 'text-muted-foreground'}`}>
                  {match.team2_score}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="w-full overflow-x-auto pb-8">
      <div className="min-w-[1200px] px-4">
        {/* Bracket Grid */}
        <div className="grid grid-cols-7 gap-8 items-center">
          {/* Quarter Finals */}
          <div className="col-span-2 space-y-24">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-primary mb-2">Quarter Finals</h3>
              <div className="h-1 w-full bg-gradient-primary rounded-full"></div>
            </div>
            {quarterFinals.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>

          {/* Connector Lines QF to SF */}
          <div className="col-span-1 relative h-full">
            <svg className="w-full h-full" style={{ minHeight: '800px' }}>
              {/* Top bracket line */}
              <path
                d="M 0 120 L 40 120 L 40 240 L 80 240"
                stroke="hsl(var(--primary))"
                strokeWidth="3"
                fill="none"
                opacity="0.5"
              />
              {/* Second bracket line */}
              <path
                d="M 0 360 L 40 360 L 40 240 L 80 240"
                stroke="hsl(var(--primary))"
                strokeWidth="3"
                fill="none"
                opacity="0.5"
              />
              {/* Third bracket line */}
              <path
                d="M 0 600 L 40 600 L 40 480 L 80 480"
                stroke="hsl(var(--primary))"
                strokeWidth="3"
                fill="none"
                opacity="0.5"
              />
              {/* Fourth bracket line */}
              <path
                d="M 0 840 L 40 840 L 40 480 L 80 480"
                stroke="hsl(var(--primary))"
                strokeWidth="3"
                fill="none"
                opacity="0.5"
              />
            </svg>
          </div>

          {/* Semi Finals */}
          <div className="col-span-2 space-y-48">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-secondary mb-2">Semi Finals</h3>
              <div className="h-1 w-full bg-gradient-secondary rounded-full"></div>
            </div>
            {semiFinals.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>

          {/* Connector Lines SF to Final */}
          <div className="col-span-1 relative h-full">
            <svg className="w-full h-full" style={{ minHeight: '800px' }}>
              {/* Top to final */}
              <path
                d="M 0 240 L 40 240 L 40 360 L 80 360"
                stroke="hsl(var(--secondary))"
                strokeWidth="3"
                fill="none"
                opacity="0.5"
              />
              {/* Bottom to final */}
              <path
                d="M 0 480 L 40 480 L 40 360 L 80 360"
                stroke="hsl(var(--secondary))"
                strokeWidth="3"
                fill="none"
                opacity="0.5"
              />
            </svg>
          </div>

          {/* Final */}
          <div className="col-span-1">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Trophy className="h-6 w-6 text-accent" />
                <h3 className="text-xl font-bold text-accent">Final</h3>
              </div>
              <div className="h-1 w-full bg-gradient-accent rounded-full"></div>
            </div>
            {final ? (
              <div className="mt-72">
                <MatchCard match={final} />
              </div>
            ) : (
              <div className="mt-72 p-8 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/30 text-center">
                <Trophy className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Final match pending</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentBracket;
