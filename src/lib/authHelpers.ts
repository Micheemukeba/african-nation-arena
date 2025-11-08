import { supabase } from "@/integrations/supabase/client";

export async function assignFederationRepresentativeRole(userId: string): Promise<void> {
  const { error } = await supabase
    .from("user_roles")
    .insert({
      user_id: userId,
      role: "federation_representative",
    });

  if (error) {
    console.error("Error assigning role:", error);
    throw error;
  }
}

export async function checkUserRole(userId: string, role: "admin" | "federation_representative"): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", role)
    .maybeSingle();

  if (error) {
    console.error("Error checking role:", error);
    return false;
  }

  return !!data;
}

export async function isAdmin(userId: string): Promise<boolean> {
  return checkUserRole(userId, "admin");
}

export async function isFederationRepresentative(userId: string): Promise<boolean> {
  return checkUserRole(userId, "federation_representative");
}
