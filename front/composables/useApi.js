import { useRuntimeConfig } from '#app' 

export const useApi = () => {
  const config = useRuntimeConfig()
  const apiBaseURL = config.public.apiBaseURL 

  if (!apiBaseURL) {
    console.error('NUXT_PUBLIC_API_BASE_URL is not defined in runtimeConfig. Check .env and nuxt.config.ts');
  }

  const customFetch = async (url, options = {}) => {
    const fullUrl = `${apiBaseURL}${url}`

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    }
    // ✅ ถ้ามี localStorage token (Guest/Employee login) ให้แนบ Authorization header

    const token = localStorage.getItem('token')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    // ✅ แปลง body เป็น JSON string (ถ้ามี)

    let body = options.body
    if (['POST', 'PUT', 'PATCH'].includes(options.method?.toUpperCase())) {
      if (body && typeof body === 'object') {
        body = JSON.stringify(body)
      }
    }

    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers,
        body,
        credentials: 'include', // เพื่อให้ cookie (จาก Google OAuth) ถูกส่งไปด้วย
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'API request failed')
      }

      return await response.json()
    } catch (error) {
      console.error('API call error:', error)
      throw error
    }
  }

  return customFetch
}

// ✅ แก้ getToken() ตรงนี้
export async function getBookingsByDate(date) {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBaseURL
  const accessToken = localStorage.getItem('token')

  const res = await fetch(`${baseURL}/bookings/daily/${date}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken && { Authorization: `Bearer ${accessToken}` })
    },
    credentials: 'include'
  })

  return await res.json()
}
