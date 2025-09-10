import { User } from '@clerk/nextjs/server'
import { type UserResource } from '@clerk/types'

export function extractEmailsFromClerk(
  clerk_user: any,
): string[] {
  // Extract all possible emails from Clerk user object.
  // Both manually set emails and social logins.
  if (!clerk_user) return []

  const externalEmails = clerk_user.externalAccounts?.map(
    (account: any) => account.emailAddress as string,
  ) as string[]
  const userEmails = clerk_user.emailAddresses?.map(
    (account: any) => account.emailAddress as string,
  ) as string[]

  const emails = [...externalEmails, ...userEmails].filter(
    (email) => email !== undefined,
  ) as string[]

  return Array.from(new Set(emails))
}
