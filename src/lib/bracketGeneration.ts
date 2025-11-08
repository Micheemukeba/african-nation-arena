import { supabase } from "@/integrations/supabase/client";

export interface BracketMatch {
  id?: string;
  stage: "quarter_final" | "semi_final" | "final";
  team1_id: string | null;
  team2_id: string | null;
  team1_name?: string;
  team2_name?: string;
  team1_score?: number;
  team2_score?: number;
  winner_id?: string | null;
}

export interface TournamentBracket {
  quarterFinals: BracketMatch[];
  semiFinals: BracketMatch[];
  final: BracketMatch[];
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function generateBracket(tournamentId: string): Promise<TournamentBracket> {
  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("id, country_name")
    .order("created_at", { ascending: true });

  if (teamsError || !teams || teams.length < 8) {
    throw new Error("Not enough teams to generate bracket");
  }

  const shuffledTeams = shuffleArray(teams.slice(0, 8));

  const quarterFinalMatches: BracketMatch[] = [
    {
      stage: "quarter_final",
      team1_id: shuffledTeams[0].id,
      team2_id: shuffledTeams[1].id,
      team1_name: shuffledTeams[0].country_name,
      team2_name: shuffledTeams[1].country_name,
    },
    {
      stage: "quarter_final",
      team1_id: shuffledTeams[2].id,
      team2_id: shuffledTeams[3].id,
      team1_name: shuffledTeams[2].country_name,
      team2_name: shuffledTeams[3].country_name,
    },
    {
      stage: "quarter_final",
      team1_id: shuffledTeams[4].id,
      team2_id: shuffledTeams[5].id,
      team1_name: shuffledTeams[4].country_name,
      team2_name: shuffledTeams[5].country_name,
    },
    {
      stage: "quarter_final",
      team1_id: shuffledTeams[6].id,
      team2_id: shuffledTeams[7].id,
      team1_name: shuffledTeams[6].country_name,
      team2_name: shuffledTeams[7].country_name,
    },
  ];

  const semiFinalsMatches: BracketMatch[] = [
    {
      stage: "semi_final",
      team1_id: null,
      team2_id: null,
    },
    {
      stage: "semi_final",
      team1_id: null,
      team2_id: null,
    },
  ];

  const finalMatch: BracketMatch[] = [
    {
      stage: "final",
      team1_id: null,
      team2_id: null,
    },
  ];

  const { error: matchError } = await supabase.from("matches").insert([
    ...quarterFinalMatches.map((m) => ({
      tournament_id: tournamentId,
      stage: m.stage,
      team1_id: m.team1_id,
      team2_id: m.team2_id,
      team1_score: 0,
      team2_score: 0,
    })),
    ...semiFinalsMatches.map((m) => ({
      tournament_id: tournamentId,
      stage: m.stage,
      team1_id: m.team1_id,
      team2_id: m.team2_id,
      team1_score: 0,
      team2_score: 0,
    })),
    ...finalMatch.map((m) => ({
      tournament_id: tournamentId,
      stage: m.stage,
      team1_id: m.team1_id,
      team2_id: m.team2_id,
      team1_score: 0,
      team2_score: 0,
    })),
  ]);

  if (matchError) {
    throw new Error("Failed to create bracket matches");
  }

  return {
    quarterFinals: quarterFinalMatches,
    semiFinals: semiFinalsMatches,
    final: finalMatch,
  };
}

export async function getBracketForTournament(tournamentId: string): Promise<TournamentBracket> {
  const { data: matches, error } = await supabase
    .from("matches")
    .select(
      `
      id,
      stage,
      team1_id,
      team2_id,
      team1_score,
      team2_score,
      winner_id,
      teams!matches_team1_id_fkey(country_name),
      teams!matches_team2_id_fkey(country_name)
    `
    )
    .eq("tournament_id", tournamentId)
    .order("stage", { ascending: true });

  if (error) {
    throw new Error("Failed to fetch bracket");
  }

  const quarterFinals: BracketMatch[] = [];
  const semiFinals: BracketMatch[] = [];
  const final: BracketMatch[] = [];

  matches?.forEach((match: any) => {
    const bracketMatch: BracketMatch = {
      id: match.id,
      stage: match.stage,
      team1_id: match.team1_id,
      team2_id: match.team2_id,
      team1_score: match.team1_score,
      team2_score: match.team2_score,
      winner_id: match.winner_id,
      team1_name: match.teams?.[0]?.country_name || "TBD",
      team2_name: match.teams?.[1]?.country_name || "TBD",
    };

    if (match.stage === "quarter_final") {
      quarterFinals.push(bracketMatch);
    } else if (match.stage === "semi_final") {
      semiFinals.push(bracketMatch);
    } else if (match.stage === "final") {
      final.push(bracketMatch);
    }
  });

  return { quarterFinals, semiFinals, final };
}
