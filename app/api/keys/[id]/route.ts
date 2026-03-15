export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthWithUser } from '@/lib/server-auth';
import { revokeApiKey } from '@/lib/api-key';

/**
 * DELETE /api/keys/[id] - 禁用 API Key
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuthWithUser(request);
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await revokeApiKey(id, auth.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to revoke API key:', error);
    return NextResponse.json({ error: 'Failed to revoke API key' }, { status: 500 });
  }
}
