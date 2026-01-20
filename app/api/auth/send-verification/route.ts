/**
 * Send Verification Code API
 * POST /api/auth/send-verification
 * 
 * Sends a verification code to the provided email address
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendVerificationEmail, generateVerificationCode } from '@/lib/email';
import { validateEmail } from '@/lib/validations';

// Rate limiting: max 3 requests per email per 10 minutes
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 3;

// Code expiration: 10 minutes
const CODE_EXPIRATION_MS = 10 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, lang = 'en' } = body;

    // Validate email
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check rate limiting
    const recentCodes = await prisma.verification_codes.count({
      where: {
        email: email.toLowerCase(),
        type: 'email',
        created_at: {
          gte: new Date(Date.now() - RATE_LIMIT_WINDOW_MS),
        },
      },
    });

    if (recentCodes >= MAX_REQUESTS_PER_WINDOW) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many verification requests. Please try again later.',
          retryAfter: 10, // minutes
        },
        { status: 429 }
      );
    }

    // Check if email is already registered
    const existingUser = await prisma.users.findFirst({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email is already registered' },
        { status: 400 }
      );
    }

    // Generate new code
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + CODE_EXPIRATION_MS);

    // Delete any existing unverified codes for this email
    await prisma.verification_codes.deleteMany({
      where: {
        email: email.toLowerCase(),
        type: 'email',
        verified: false,
      },
    });

    // Create new verification code
    await prisma.verification_codes.create({
      data: {
        email: email.toLowerCase(),
        code,
        type: 'email',
        expires_at: expiresAt,
        verified: false,
        attempts: 0,
      },
    });

    // Send verification email
    const emailResult = await sendVerificationEmail(email.toLowerCase(), code, lang);

    if (!emailResult.success) {
      console.error('[Verification] Failed to send email:', emailResult.error);
      return NextResponse.json(
        { success: false, error: 'Failed to send verification email. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent successfully',
      expiresIn: 10, // minutes
    });

  } catch (error) {
    console.error('[Verification] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
