import { createClient } from "@supabase/supabase-js";
import {NextResponse} from "next/server";

// IMPORTANT: Create a server-side client with the service role key
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: Request) {
    const { email, password, full_name, role, is_active } = await request.json();

    if (!email || !password || !full_name || !role) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name, role },
    });

    if (authError) {
        console.error("Error creating auth user:", authError);
        return NextResponse.json({ error: authError.message }, { status: 500 });
    }
    
    if (!authData.user) {
        return NextResponse.json({ error: 'Could not create auth user.' }, { status: 500 });
    }

    const { error: profileError } = await supabaseAdmin.from("staff_profiles").insert({
        user_id: authData.user.id,
        full_name: full_name,
        email: email,
        role: role,
        is_active: is_active,
    });

    if (profileError) {
        console.error("Error creating user profile:", profileError);
        // Rollback user creation
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return NextResponse.json({ error: "Failed to create user profile." }, { status: 500 });
    }
    
    return NextResponse.json({ message: "User created successfully" });
}

export async function DELETE(request: Request) {
    const { userId } = await request.json();

    if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // First, delete from staff_profiles to avoid foreign key constraints
    const { error: profileError } = await supabaseAdmin
        .from('staff_profiles')
        .delete()
        .eq('user_id', userId);

    if (profileError) {
        console.error('Error deleting profile:', profileError.message);
        // If the profile is already gone, that's okay. But other errors should be reported.
        // We'll proceed to delete the auth user regardless.
    }

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
        console.error("Error deleting user:", authError);
        // If profile was deleted but auth user deletion fails, we have an orphan profile.
        // This situation should be handled, maybe by re-creating profile or logging for manual action.
        // For now, we return an error.
        return NextResponse.json({ error: authError.message }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'User deleted successfully' });
} 