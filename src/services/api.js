// src/services/api.js
import { getToken } from '../utils/helpers'   

const BASE_URL = import.meta.env.VITE_API_URL

function getHeaders() {
  const token = getToken()                    
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

async function request(endpoint, method = 'GET', body = null) {
  const options = { method, headers: getHeaders() }
  if (body) options.body = JSON.stringify(body)

  const response = await fetch(`${BASE_URL}/${endpoint}`, options)
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || 'Something went wrong')
  }
  return response.json()
}
export function registerUser(formData) {
  const fd = new FormData()

  fd.append('full_name',        formData.fullName)
  fd.append('email',            formData.email)
  fd.append('phone_number',     formData.phone)
  fd.append('password',         formData.password)
  fd.append('confirm_password', formData.confirmPassword)
  fd.append('role',             formData.userType)

  if (formData.governmentIdNumber)
    fd.append('government_id',  formData.governmentIdNumber)
  if (formData.uploadIdDocument)
    fd.append('id_document',    formData.uploadIdDocument)
  return fetch(`${BASE_URL}/register/`, {
    method: 'POST',
    body: fd,
  })
  .then(async res => {
    const data = await res.json()
    if (!res.ok) throw new Error(JSON.stringify(data))
    return data
  })
}


// ── Send OTP (email or phone) ──────────────────────────
export async function sendOTP(type) {
  const token = getToken()
  const response = await fetch(`${BASE_URL}/otp/send/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ otp_type: type }),  // "email" or "phone"
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Failed to send OTP')
  return data
}

// ── Verify OTP ─────────────────────────────────────────
export async function verifyOTP(type, code) {
  const token = getToken()
  const response = await fetch(`${BASE_URL}/otp/verify/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ otp_type: type, otp_code: code }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Invalid OTP')
  return data
}

export async function loginUser(formData) {
  const response = await fetch(`${BASE_URL}/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.detail || data.message || 'Invalid email or password.')
  }

  return data
}
// ── Check if email/phone is registered + send OTP ──
export async function sendLoginOTP(identifier) {
  const response = await fetch(`${BASE_URL}/otp-login/send/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier })  // email or phone
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Failed to send OTP')
  return data
}

// ── Verify OTP and login ──
export async function verifyLoginOTP(identifier, otp_code) {
  const response = await fetch(`${BASE_URL}/otp-login/verify/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, otp_code })
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Invalid OTP')
  return data
}

export async function postTravelPlan(formData) {
    const token = getToken()
    const fd = new FormData()

  fd.append('from_city',        formData.fromCity)
  fd.append('to_city',          formData.toCity)
  fd.append('travel_date',      formData.travelDate)
  fd.append('available_weight', formData.availableWeight)
  fd.append('travel_mode',      formData.travelMode)

  if (formData.notes)
    fd.append('notes', formData.notes)

  const res = await fetch('${BASE_URL}/travel/', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  })
   .then(async res => {
     const data = await res.json()
     if (!res.ok) throw new Error(JSON.stringify(data))
     return data
  })
}
// src/services/api.js

export async function createShipment(formData) {
  const token = getToken()  // ✅ from helpers.js

  const fd = new FormData()

  // 📍 Package Route
  fd.append('pickup_city',       formData.pickupCity)
  fd.append('destination_city',  formData.destinationCity)
  fd.append('pickup_date',       formData.pickupDate)

  // 📦 Package Details
  fd.append('package_type',      formData.packageType)
  fd.append('package_weight',    formData.packageWeight)
  fd.append('package_description', formData.packageDescription)
  fd.append('offered_price',     formData.offeredPrice)
  fd.append('is_urgent',         formData.isUrgent ? 'true' : 'false')

  // 👤 Receiver Details
  fd.append('receiver_full_name',     formData.receiverName)
  fd.append('receiver_phone',    formData.receiverPhone)

  const res = await fetch(`${BASE_URL}/shipments/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }, // ✅ token
    body: fd,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(JSON.stringify(data))
  return await data
}
// ── Fetch top routes for Hero section ─────────────────────────
export async function getTopRoutes() {
  const response = await fetch(`${BASE_URL}/travel/top-routes/`)
  const data = await response.json()
  if (!response.ok) throw new Error('Failed to fetch routes')
  return data
}
// ── Send Registration OTP (no token needed) ────────────
export async function sendRegistrationOTP(email, type, code = '', phone = '') {
  const res = await fetch(`${BASE_URL}/otp/send-registration/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, type, code, phone }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'OTP error')
  return data
}

// ── Verify Registration OTPs → Create User in DB ───────
export async function verifyRegistrationOTP(email, emailOtp, phoneOtp) {
  const res = await fetch(`${BASE_URL}/register/verify/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      email_otp: emailOtp,
      phone_otp: phoneOtp,
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Verification failed')
  return data
}
// ── Admin ─────────────────────────────────────────────────────
export function getAllUsers()              { return request('admin/users') }
export function getAllShipments()          { return request('admin/shipments') }
export function getAllPlans()              { return request('admin/travel-plans') }
export function verifyUserId(userId)      { return request(`admin/users/${userId}/verify`, 'POST') }
export function blockUser(userId)         { return request(`admin/users/${userId}/block`, 'POST') }
export function resolveDispute(id)        { return request(`admin/disputes/${id}/resolve`, 'POST') }