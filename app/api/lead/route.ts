import { getLeadConfig } from '../../../lib/leadConfig';
import { handleLeadRequest } from '../../../lib/leadService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(request: Request) {
  return handleLeadRequest(request, getLeadConfig());
}
