import { Navigation } from "@/components/layout/Navigation";
import { HeroSection } from "@/components/home/HeroSection";
import { Categories } from "@/components/home/Categories";
import { FeaturedFreelancers } from "@/components/home/FeaturedFreelancers";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Footer } from "@/components/home/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <HeroSection />
        <Categories />
        <FeaturedFreelancers />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
