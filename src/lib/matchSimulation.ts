import { supabase } from "@/integrations/supabase/client";

interface Player {
  id: string;
  name: string;
  natural_position: string;
  rating_gk: number;
  rating_df: number;
  rating_md: number;
  rating_at: number;
}

interface Team {
  id: string;
  country_name: string;
  team_rating: number;
  players?: Player[];
}

interface MatchResult {
  team1_score: number;
  team2_score: number;
  goals: Array<{
    player_id: string;
    player_name: string;
    team_id: string;
    minute: number;
  }>;
  winner_id: string | null;
  commentary?: string;
}

async function getTeamData(teamId: string): Promise<Team> {
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("id, country_name, team_rating")
    .eq("id", teamId)
    .single();

  if (teamError || !team) {
    throw new Error("Failed to fetch team data");
  }

  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("*")
    .eq("team_id", teamId);

  if (playersError) {
    throw new Error("Failed to fetch players");
  }

  return { ...team, players: players || [] };
}

function getPlayerPositionRating(player: Player, position: "GK" | "DF" | "MD" | "AT"): number {
  switch (position) {
    case "GK":
      return player.rating_gk;
    case "DF":
      return player.rating_df;
    case "MD":
      return player.rating_md;
    case "AT":
      return player.rating_at;
    default:
      return 50;
  }
}

function calculateGoalProbability(
  team1Rating: number,
  team2Rating: number,
  timeElapsed: number
): number {
  const ratingDiff = team1Rating - team2Rating;
  const ratingFactor = Math.max(0.5, Math.min(1.5, 1 + ratingDiff / 100));

  const timeFactor = Math.min(1.2, 0.6 + timeElapsed / 150);

  const baseProbability = 0.02;
  return Math.min(0.15, baseProbability * ratingFactor * timeFactor);
}

function selectGoalScorer(team: Team): Player | null {
  if (!team.players || team.players.length === 0) return null;

  const attackers = team.players.filter(
    (p) =>
      p.natural_position === "AT" || p.natural_position === "MD"
  );

  if (attackers.length === 0) return team.players[0];

  let totalRating = 0;
  const ratings = attackers.map((p) => {
    const rating = getPlayerPositionRating(p, p.natural_position as "GK" | "DF" | "MD" | "AT");
    totalRating += rating;
    return rating;
  });

  let random = Math.random() * totalRating;
  for (let i = 0; i < attackers.length; i++) {
    random -= ratings[i];
    if (random <= 0) {
      return attackers[i];
    }
  }

  return attackers[0];
}

export async function simulateMatch(
  team1Id: string,
  team2Id: string,
  withCommentary: boolean = false
): Promise<MatchResult> {
  const [team1, team2] = await Promise.all([
    getTeamData(team1Id),
    getTeamData(team2Id),
  ]);

  const goals: MatchResult["goals"] = [];
  let team1Score = 0;
  let team2Score = 0;

  const matchDuration = 90;
  const extraTimeDuration = 30;
  const penaltyCount = 5;

  for (let minute = 1; minute <= matchDuration; minute++) {
    const team1GoalProb = calculateGoalProbability(
      team1.team_rating,
      team2.team_rating,
      minute
    );
    const team2GoalProb = calculateGoalProbability(
      team2.team_rating,
      team1.team_rating,
      minute
    );

    if (Math.random() < team1GoalProb) {
      const scorer = selectGoalScorer(team1);
      if (scorer) {
        team1Score++;
        goals.push({
          player_id: scorer.id,
          player_name: scorer.name,
          team_id: team1.id,
          minute,
        });
      }
    }

    if (Math.random() < team2GoalProb) {
      const scorer = selectGoalScorer(team2);
      if (scorer) {
        team2Score++;
        goals.push({
          player_id: scorer.id,
          player_name: scorer.name,
          team_id: team2.id,
          minute,
        });
      }
    }
  }

  let winner_id: string | null = null;

  if (team1Score !== team2Score) {
    winner_id = team1Score > team2Score ? team1.id : team2.id;
  } else {
    for (let minute = matchDuration + 1; minute <= matchDuration + extraTimeDuration; minute++) {
      const team1GoalProb = calculateGoalProbability(team1.team_rating, team2.team_rating, minute) * 0.7;
      const team2GoalProb = calculateGoalProbability(team2.team_rating, team1.team_rating, minute) * 0.7;

      if (Math.random() < team1GoalProb) {
        const scorer = selectGoalScorer(team1);
        if (scorer) {
          team1Score++;
          goals.push({
            player_id: scorer.id,
            player_name: scorer.name,
            team_id: team1.id,
            minute,
          });
        }
      }

      if (Math.random() < team2GoalProb) {
        const scorer = selectGoalScorer(team2);
        if (scorer) {
          team2Score++;
          goals.push({
            player_id: scorer.id,
            player_name: scorer.name,
            team_id: team2.id,
            minute,
          });
        }
      }

      if (team1Score !== team2Score) {
        winner_id = team1Score > team2Score ? team1.id : team2.id;
        break;
      }
    }

    if (team1Score === team2Score) {
      for (let shootout = 0; shootout < penaltyCount; shootout++) {
        const team1Scores = Math.random() < 0.75;
        const team2Scores = Math.random() < 0.75;

        if (team1Scores) team1Score++;
        if (team2Scores) team2Score++;

        if (team1Score > team2Score + (penaltyCount - shootout - 1)) {
          winner_id = team1.id;
          break;
        }
        if (team2Score > team1Score + (penaltyCount - shootout - 1)) {
          winner_id = team2.id;
          break;
        }
      }

      if (!winner_id) {
        winner_id = team1Score > team2Score ? team1.id : team2.id;
      }
    }
  }

  let commentary: string | undefined;
  if (withCommentary) {
    commentary = generateBasicCommentary(team1, team2, goals, team1Score, team2Score);
  }

  return {
    team1_score: team1Score,
    team2_score: team2Score,
    goals,
    winner_id,
    commentary,
  };
}

function generateBasicCommentary(
  team1: Team,
  team2: Team,
  goals: MatchResult["goals"],
  team1Score: number,
  team2Score: number
): string {
  const lines: string[] = [];

  lines.push(`MATCH: ${team1.country_name} vs ${team2.country_name}`);
  lines.push(`FINAL SCORE: ${team1Score} - ${team2Score}`);
  lines.push("");

  if (goals.length === 0) {
    lines.push("A tightly contested match with no goals scored.");
  } else {
    lines.push("GOAL TIMELINE:");
    goals.forEach((goal) => {
      const teamName = goal.team_id === team1.id ? team1.country_name : team2.country_name;
      const timeLabel =
        goal.minute > 90
          ? goal.minute > 120
            ? `Penalty ${goal.minute - 120}`
            : `${goal.minute - 90}' Extra Time`
          : `${goal.minute}'`;
      lines.push(`${timeLabel} - ${goal.player_name} (${teamName})`);
    });
  }

  lines.push("");
  const winner = team1Score > team2Score ? team1.country_name : team1Score < team2Score ? team2.country_name : "Draw";
  lines.push(`RESULT: ${winner}`);

  return lines.join("\n");
}

export async function recordMatchResult(
  matchId: string,
  result: MatchResult,
  matchType: "played" | "simulated"
): Promise<void> {
  const { error: matchError } = await supabase
    .from("matches")
    .update({
      team1_score: result.team1_score,
      team2_score: result.team2_score,
      winner_id: result.winner_id,
      match_type: matchType,
      commentary: result.commentary,
      played_at: new Date().toISOString(),
    })
    .eq("id", matchId);

  if (matchError) {
    throw new Error("Failed to update match result");
  }

  const { error: goalError } = await supabase
    .from("goal_events")
    .insert(
      result.goals.map((goal) => ({
        match_id: matchId,
        player_id: goal.player_id,
        team_id: goal.team_id,
        minute: goal.minute,
      }))
    );

  if (goalError) {
    throw new Error("Failed to record goal events");
  }
}
