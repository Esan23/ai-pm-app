import { Navbar } from '../components/Navbar'
import { Hero } from '../components/Hero'
import { Problem } from '../components/Problem'
import { HowItWorks } from '../components/HowItWorks'
import { Features } from '../components/Features'
import { SocialProof } from '../components/SocialProof'
import { Pricing } from '../components/Pricing'
import { FinalCTA } from '../components/FinalCTA'
import { Footer } from '../components/Footer'
import { SignUpModal } from '../components/SignUpModal'

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <Features />
        <SocialProof />
        <Pricing />
        <FinalCTA />
      </main>
      <Footer />
      <SignUpModal />
    </div>
  )
}
