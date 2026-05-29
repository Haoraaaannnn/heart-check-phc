import { Tilt_Warp } from 'next/font/google'
import { Baloo_2 } from 'next/font/google'

export const tiltWarp = Tilt_Warp({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-tilt-warp',
})

export const Baloo = Baloo_2({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-baloo-2',
    weight: ['400', '700', '800'],
})