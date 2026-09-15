import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Test database connection
    const { data, error } = await supabase
      .from('settings')
      .select('id')
      .limit(1);

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          database: 'disconnected',
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      database: 'connected',
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        database: 'disconnected',
        error: 'Failed to connect to database',
      },
      { status: 500 }
    );
  }
}
