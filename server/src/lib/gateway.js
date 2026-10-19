import Razorpay from 'razorpay'
import { AppError } from '../utils/AppError.js'

// Created on demand so the server still boots if keys are missing
export function getRazorpay() {
  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new AppError('Payments are not configured on the server', 500)
  }
  return new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET })
}