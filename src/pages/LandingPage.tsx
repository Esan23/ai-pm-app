import { Navbar } from '../components/Navbar'
import { Hero } from '../components/Hero'
import { Problem } from '../components/Problem'
import { Solution } from '../components/Solution'
import { Features } from '../components/Features'
import { ROICalculator } from '../components/ROICalculator'
import { SocialProof } from '../components/SocialProof'
import { Pricing } from '../components/Pricing'
import { IntegrationSecurity } from '../components/IntegrationSecurity'
import { DemoVideo } from '../components/DemoVideo'
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
        <Solution />
        <Features />
        <ROICalculator />
        <SocialProof />
        <Pricing />
        <IntegrationSecurity />
        <DemoVideo />
        <FinalCTA />
      </main>
      <Footer />
      <SignUpModal />
    </div>
  )
}
