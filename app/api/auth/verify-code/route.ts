/**
 * Verify Code API
 * POST /api/auth/verify-code
 * 
 * Verifies a code sent to email/phone
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isRateLimited, getIp, RATE_LIMITS } from '@/lib/rate-limiter';

// Max verification attempts before code is invalidated
const MAX_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
  const ip = getIp(request);
  if (await isRateLimited(`verify:code:${ip}`, RATE_LIMITS.AUTH_LOGIN)) { // Rigid limit
    return NextResponse.json({ success: false, error: 'Too many attempts. Please try again later.' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { email, code } = body;

    // Validate input
    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: 'Email and code are required' },
        { status: 400 }
      );
    }

    // Find the verification code
    const verificationRecord = await prisma.verification_codes.findFirst({
      where: {
        email: email.toLowerCase(),
        type: 'email',
        verified: false,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // No code found
    if (!verificationRecord) {
      return NextResponse.json(
        { success: false, error: 'No verification code found. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check if code has expired
    if (new Date() > verificationRecord.expires_at) {
      // Delete expired code
      await prisma.verification_codes.delete({
        where: { id: verificationRecord.id },
      });

      return NextResponse.json(
        { success: false, error: 'Verification code has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check max attempts
    if (verificationRecord.attempts >= MAX_ATTEMPTS) {
      // Delete the code after too many attempts
      await prisma.verification_codes.delete({
        where: { id: verificationRecord.id },
      });

      return NextResponse.json(
        { success: false, error: 'Too many failed attempts. Please request a new code.' },
        { status: 400 }
      );
    }

    // Verify the code
    if (verificationRecord.code !== code.trim()) {
      // Increment attempts
      await prisma.verification_codes.update({
        where: { id: verificationRecord.id },
        data: { attempts: verificationRecord.attempts + 1 },
      });

      const remainingAttempts = MAX_ATTEMPTS - verificationRecord.attempts - 1;

      return NextResponse.json(
        {
          success: false,
          error: 'Invalid verification code',
          remainingAttempts,
        },
        { status: 400 }
      );
    }

    // Code is correct - mark as verified
    await prisma.verification_codes.update({
      where: { id: verificationRecord.id },
      data: { verified: true },
    });

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      verified: true,
    });

  } catch (error) {
    console.error('[Verify Code] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
