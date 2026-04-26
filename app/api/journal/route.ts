import { NextRequest, NextResponse } from 'next/server';
import { getTrades } from '@/lib/journal';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pair = searchParams.get('pair') || undefined;
    const style = searchParams.get('style') || undefined;
    
    const filters = { pair, style };
    const trades = getTrades(filters);
    
    return NextResponse.json({ success: true, trades });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
