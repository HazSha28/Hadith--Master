import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";

const Help = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground text-center mb-8">
            How to Use Hadith Master
          </h1>

          {/* List of Books Section */}
          <Card className="bg-card shadow-lg mb-6">
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold text-card-foreground mb-4">1. List of Books</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                This section allows you to explore and manage your collection of Hadith books.
              </p>
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-card-foreground mb-2">Classification of Books:</h3>
                  <ul className="list-disc list-inside ml-5 space-y-1">
                    <li>Hadith</li>
                    <li>Sharh</li>
                    <li>Tafsir</li>
                    <li>Fiqh</li>
                    <li>History Books</li>
                    <li>Based on Language</li>
                    <li>Translated Books</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground mb-2">Browsing through Books:</h3>
                  <ul className="list-disc list-inside ml-5 space-y-1">
                    <li><strong>Download</strong> books for offline access</li>
                    <li>Add books <strong>To Read List</strong></li>
                    <li><strong>Reading the Book</strong> with options to:</li>
                    <ul className="list-disc list-inside ml-5 space-y-1">
                      <li><strong>Bookmark</strong> pages or sections</li>
                      <li><strong>Screenshot</strong> content</li>
                      <li><strong>Share</strong> to platforms (WhatsApp, Instagram, Facebook, Discord, Threads, Copy Link)</li>
                    </ul>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Searching Section */}
          <Card className="bg-card shadow-lg mb-6">
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold text-card-foreground mb-4">2. AI Searching</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Utilize our powerful AI search engine to find specific Hadiths or topics.
              </p>
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-card-foreground mb-2">Search Process:</h3>
                  <ol className="list-decimal list-inside ml-5 space-y-2">
                    <li>Start from the <strong>Home Page</strong></li>
                    <li>Use the <strong>AI Search Engine</strong> (Type in Gist)</li>
                    <li>Apply <strong>Filter Options</strong>:
                      <ul className="list-disc list-inside ml-5 space-y-1 mt-1">
                        <li>Book Name</li>
                        <li>Author/Compiler Name</li>
                        <li>Narrators</li>
                        <li>Character Names</li>
                        <li>Grading of the Narration</li>
                      </ul>
                    </li>
                    <li>Use <strong>Additional Filters (Optional)</strong> for refined results</li>
                    <li>Review <strong>Search Analysis</strong> results</li>
                    <li>If <strong>Result Satisfactory?</strong> - Yes: Done, No: Apply more filters</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Result Usage Section */}
          <Card className="bg-card shadow-lg mb-6">
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold text-card-foreground mb-4">3. Result Usage</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                After finding your desired Hadith, you have several options for using the results.
              </p>
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-card-foreground mb-2">Available Actions:</h3>
                  <ul className="list-disc list-inside ml-5 space-y-2">
                    <li><strong>Copy Hadith</strong> - Copy text or take screenshot</li>
                    <li><strong>Open Book</strong> - Navigate to the full book context</li>
                    <li><strong>Share Hadith</strong> - Share to various platforms:
                      <ul className="list-disc list-inside ml-5 space-y-1 mt-1">
                        <li>WhatsApp</li>
                        <li>Instagram</li>
                        <li>Facebook</li>
                        <li>Discord</li>
                        <li>Threads</li>
                        <li>Copy Link</li>
                      </ul>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground mb-2">Bookmark Options:</h3>
                  <ul className="list-disc list-inside ml-5 space-y-1">
                    <li><strong>According to Books</strong> - Organize bookmarks by book</li>
                    <li><strong>Custom List</strong> - Create personalized bookmark collections</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <Card className="bg-card shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold text-card-foreground mb-4">Quick Tips</h2>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-1">💡</span>
                  <span>Use specific keywords in the AI search for better results</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-1">💡</span>
                  <span>Combine multiple filters to narrow down your search</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-1">💡</span>
                  <span>Bookmark important Hadiths for quick access later</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-1">💡</span>
                  <span>Share findings with study groups or social media</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Help;
