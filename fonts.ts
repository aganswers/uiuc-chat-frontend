import { Montserrat } from 'next/font/google'

// Docs: https://nextjs.org/docs/pages/building-your-application/optimizing/fonts#with-tailwind-css

export const montserrat_heading = Montserrat({
  weight: '700',
  subsets: ['latin'],
  variable: '--font-montserratHeading',
  display: 'swap',
})

export const montserrat_paragraph = Montserrat({
  weight: '500',
  subsets: ['latin'],
  variable: '--font-montserratParagraph',
  display: 'swap',
})

// export const rubik_puddles = Rubik_Puddles({
//   weight: '400',
//   subsets: ['latin'],
//   display: 'swap',
//   variable: '--font-rubikPuddles',
// })

// export const inter = Inter({
//   subsets: ['latin'],
//   display: 'swap',
// })

// export const roboto_mono = Roboto_Mono({
//   subsets: ['latin'],
//   display: 'swap',
// })
