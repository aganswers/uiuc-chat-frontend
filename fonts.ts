import localFont from 'next/font/local'

// Local font imports to avoid network dependencies during build
export const montserrat_heading = localFont({
  src: [
    {
      path: './public/fonts/Montserrat-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-montserratHeading',
  display: 'swap',
})

export const montserrat_paragraph = localFont({
  src: [
    {
      path: './public/fonts/Montserrat-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
  ],
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
