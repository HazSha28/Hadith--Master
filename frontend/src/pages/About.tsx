import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground text-center mb-8">
            About Hadith Master
          </h1>

          <Card className="bg-card shadow-lg mb-6">
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold text-card-foreground mb-4">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Hadith Master is dedicated to making authentic Islamic knowledge accessible to everyone. 
                We provide a comprehensive database of hadiths with advanced search capabilities to help 
                Muslims worldwide find guidance from the teachings of Prophet Muhammad (peace be upon him).
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Our platform offers both beginner-friendly and advanced search options, ensuring that 
                everyone from students to scholars can benefit from this invaluable resource.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold text-card-foreground mb-4">Features</h2>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-1">✓</span>
                  <span>Search across multiple authentic hadith collections</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-1">✓</span>
                  <span>Filter by book, author, and narrator</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-1">✓</span>
                  <span>Beginner and advanced search modes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-1">✓</span>
                  <span>User-friendly interface for easy navigation</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default About;
