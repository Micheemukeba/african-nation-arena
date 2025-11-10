const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface NotificationPayload {
  matchId: string;
  team1Name: string;
  team2Name: string;
  team1Email: string;
  team2Email: string;
  team1Score: number;
  team2Score: number;
  goals: Array<{
    playerName: string;
    teamName: string;
    minute: number;
  }>;
  matchType: string;
}

function generateEmailBody(
  teamName: string,
  opponentName: string,
  teamScore: number,
  opponentScore: number,
  goals: NotificationPayload["goals"],
  matchType: string
): string {
  const goalsByTeam = goals.filter((g) => g.teamName === teamName);
  const opponentGoals = goals.filter((g) => g.teamName === opponentName);

  let body = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1f2937; color: white; padding: 20px; text-align: center; border-radius: 5px; }
    .score { font-size: 48px; font-weight: bold; text-align: center; margin: 30px 0; }
    .goals { background: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .goal-item { padding: 8px; border-bottom: 1px solid #e5e7eb; }
    .goal-item:last-child { border-bottom: none; }
    .footer { text-align: center; font-size: 12px; color: #999; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>African Nations League - Match Result</h1>
      <p>Match Type: ${matchType.charAt(0).toUpperCase() + matchType.slice(1)}</p>
    </div>

    <h2 style="text-align: center;">${teamName} vs ${opponentName}</h2>

    <div class="score">
      ${teamScore} - ${opponentScore}
    </div>

    <div style="text-align: center; margin: 20px 0;">
      <strong>Result: ${teamScore > opponentScore ? `${teamName} Win` : teamScore < opponentScore ? `${opponentName} Win` : "Draw"}</strong>
    </div>
  `;

  if (goals.length > 0) {
    body += `
    <div class="goals">
      <h3>Goal Scorers</h3>
      ${goals.map((g) => `<div class="goal-item"><strong>${g.playerName}</strong> (${g.teamName}) - ${g.minute}'</div>`).join("")}
    </div>
    `;
  }

  body += `
    <div class="footer">
      <p>African Nations League Tournament System</p>
      <p>This is an automated notification. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `;

  return body;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const payload: NotificationPayload = await req.json();

    const team1Body = generateEmailBody(
      payload.team1Name,
      payload.team2Name,
      payload.team1Score,
      payload.team2Score,
      payload.goals,
      payload.matchType
    );

    const team2Body = generateEmailBody(
      payload.team2Name,
      payload.team1Name,
      payload.team2Score,
      payload.team1Score,
      payload.goals,
      payload.matchType
    );

    console.log("Email notification prepared for match:", payload.matchId);
    console.log("Team 1 Email:", payload.team1Email);
    console.log("Team 2 Email:", payload.team2Email);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Match notification prepared",
        emails: [
          {
            to: payload.team1Email,
            subject: `African Nations League - ${payload.team1Name} vs ${payload.team2Name} Result`,
            body: team1Body,
          },
          {
            to: payload.team2Email,
            subject: `African Nations League - ${payload.team1Name} vs ${payload.team2Name} Result`,
            body: team2Body,
          },
        ],
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error processing notification:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to process notification",
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
