import 'dotenv/config'

if (!process.env.META_ACCESS_TOKEN || !process.env.META_APP_SECRET) {
  throw new Error(
    'Missing Meta credentials. Please set META_ACCESS_TOKEN and META_APP_SECRET in dashboard/.env (see .env.example).'
  )
}

export const META_ACCESS_TOKEN: string = process.env.META_ACCESS_TOKEN
export const META_APP_SECRET: string = process.env.META_APP_SECRET
export const META_API_VERSION = 'v21.0'
export const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`
