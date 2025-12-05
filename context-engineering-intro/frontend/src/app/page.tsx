import { redirect } from 'next/navigation'

export default function RootPage() {
  // Redirect root to CRM login
  redirect('/login')
}
