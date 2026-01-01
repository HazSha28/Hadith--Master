import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Upload, 
  RefreshCw, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  BookOpen,
  Users,
  Search,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  getAllHadiths, 
  getDailyHadith, 
  forceRefreshDailyHadith,
  getHadithsByCategory,
  getHadithsByDifficulty,
  searchHadiths
} from '@/utils/dailyHadithFirebase';

interface Hadith {
  id: string;
  arabic: string;
  english: {
    narrator: string;
    text: string;
  };
  reference: {
    book: string;
    bookNumber: number;
    hadithNumber: number;
  };
  chapter: string;
  category: string;
  difficulty: string;
  tags: string[];
  createdAt: Date;
  isActive: boolean;
}

const HadithAdmin: React.FC = () => {
  const [hadiths, setHadiths] = useState<Hadith[]>([]);
  const [dailyHadith, setDailyHadith] = useState<Hadith | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingHadith, setEditingHadith] = useState<Hadith | null>(null);
  const { toast } = useToast();

  const [newHadith, setNewHadith] = useState<Partial<Hadith>>({
    arabic: '',
    english: { narrator: '', text: '' },
    reference: { book: '', bookNumber: 1, hadithNumber: 1 },
    chapter: '',
    category: 'faith',
    difficulty: 'beginner',
    tags: [],
    isActive: true
  });

  useEffect(() => {
    loadHadiths();
    loadDailyHadith();
  }, []);

  const loadHadiths = async () => {
    setLoading(true);
    try {
      const data = await getAllHadiths();
      setHadiths(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load hadiths',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDailyHadith = async () => {
    try {
      const data = await getDailyHadith();
      setDailyHadith(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load daily hadith',
        variant: 'destructive'
      });
    }
  };

  const handleRefreshDailyHadith = async () => {
    setLoading(true);
    try {
      const newHadith = await forceRefreshDailyHadith();
      setDailyHadith(newHadith);
      toast({
        title: 'Success',
        description: 'Daily hadith refreshed successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to refresh daily hadith',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (searchTerm.trim()) {
      setLoading(true);
      try {
        const results = await searchHadiths(searchTerm);
        setHadiths(results);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to search hadiths',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    } else {
      loadHadiths();
    }
  };

  const handleFilterByCategory = async (category: string) => {
    setSelectedCategory(category);
    if (category !== 'all') {
      setLoading(true);
      try {
        const results = await getHadithsByCategory(category);
        setHadiths(results);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to filter by category',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    } else {
      loadHadiths();
    }
  };

  const handleFilterByDifficulty = async (difficulty: string) => {
    setSelectedDifficulty(difficulty);
    if (difficulty !== 'all') {
      setLoading(true);
      try {
        const results = await getHadithsByDifficulty(difficulty);
        setHadiths(results);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to filter by difficulty',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    } else {
      loadHadiths();
    }
  };

  const getStatusBadge = (isActive: boolean) => (
    <Badge variant={isActive ? 'default' : 'secondary'} className="flex items-center gap-1">
      {isActive ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {isActive ? 'Active' : 'Inactive'}
    </Badge>
  );

  const getDifficultyBadge = (difficulty: string) => {
    const colors = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-red-100 text-red-800'
    };
    return (
      <Badge className={colors[difficulty as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {difficulty}
      </Badge>
    );
  };

  const filteredHadiths = hadiths.filter(hadith => {
    const matchesSearch = !searchTerm || 
      hadith.arabic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hadith.english.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hadith.english.narrator.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || hadith.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || hadith.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Hadith Administration</h1>
        <div className="flex gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Hadith
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Hadith</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Arabic Text</label>
                  <Textarea
                    value={newHadith.arabic}
                    onChange={(e) => setNewHadith(prev => ({ ...prev, arabic: e.target.value }))}
                    placeholder="Enter Arabic text..."
                    className="font-arabic text-right"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">English Text</label>
                  <Textarea
                    value={newHadith.english?.text}
                    onChange={(e) => setNewHadith(prev => ({ 
                      ...prev, 
                      english: { ...prev.english, text: e.target.value }
                    }))}
                    placeholder="Enter English translation..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Narrator</label>
                  <Input
                    value={newHadith.english?.narrator}
                    onChange={(e) => setNewHadith(prev => ({ 
                      ...prev, 
                      english: { ...prev.english, narrator: e.target.value }
                    }))}
                    placeholder="Enter narrator name..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Book</label>
                    <Input
                      value={newHadith.reference?.book}
                      onChange={(e) => setNewHadith(prev => ({ 
                        ...prev, 
                        reference: { ...prev.reference, book: e.target.value }
                      }))}
                      placeholder="Book name..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-sm font-medium">Book #</label>
                      <Input
                        type="number"
                        value={newHadith.reference?.bookNumber}
                        onChange={(e) => setNewHadith(prev => ({ 
                          ...prev, 
                          reference: { ...prev.reference, bookNumber: parseInt(e.target.value) }
                        }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Hadith #</label>
                      <Input
                        type="number"
                        value={newHadith.reference?.hadithNumber}
                        onChange={(e) => setNewHadith(prev => ({ 
                          ...prev, 
                          reference: { ...prev.reference, hadithNumber: parseInt(e.target.value) }
                        }))}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Chapter</label>
                  <Input
                    value={newHadith.chapter}
                    onChange={(e) => setNewHadith(prev => ({ ...prev, chapter: e.target.value }))}
                    placeholder="Chapter name..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <Select value={newHadith.category} onValueChange={(value) => setNewHadith(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="faith">Faith</SelectItem>
                        <SelectItem value="worship">Worship</SelectItem>
                        <SelectItem value="manners">Manners</SelectItem>
                        <SelectItem value="character">Character</SelectItem>
                        <SelectItem value="knowledge">Knowledge</SelectItem>
                        <SelectItem value="family">Family</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Difficulty</label>
                    <Select value={newHadith.difficulty} onValueChange={(value) => setNewHadith(prev => ({ ...prev, difficulty: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsAddDialogOpen(false)}>
                    Add Hadith
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="hadiths">Hadiths</TabsTrigger>
          <TabsTrigger value="daily">Daily Hadith</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Hadiths</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{hadiths.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Hadiths</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{hadiths.filter(h => h.isActive).length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Categories</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{[...new Set(hadiths.map(h => h.category))].length}</div>
              </CardContent>
            </Card>
          </div>

          {dailyHadith && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Today's Hadith
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-right text-lg font-arabic">
                  {dailyHadith.arabic}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Narrated by: {dailyHadith.english.narrator}
                  </p>
                  <p className="text-sm">{dailyHadith.english.text}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRefreshDailyHadith}
                    disabled={loading}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                  {getDifficultyBadge(dailyHadith.difficulty)}
                  {getStatusBadge(dailyHadith.isActive)}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="hadiths" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search hadiths..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={handleFilterByCategory}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="faith">Faith</SelectItem>
                <SelectItem value="worship">Worship</SelectItem>
                <SelectItem value="manners">Manners</SelectItem>
                <SelectItem value="character">Character</SelectItem>
                <SelectItem value="knowledge">Knowledge</SelectItem>
                <SelectItem value="family">Family</SelectItem>
                <SelectItem value="business">Business</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedDifficulty} onValueChange={handleFilterByDifficulty}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Search
            </Button>
          </div>

          <div className="space-y-4">
            {filteredHadiths.map((hadith) => (
              <Card key={hadith.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="text-right text-lg font-arabic mb-2">
                        {hadith.arabic}
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Narrated by: {hadith.english.narrator}
                      </p>
                      <p className="text-sm mb-2">{hadith.english.text}</p>
                      <p className="text-xs text-muted-foreground">
                        {hadith.reference.book} - {hadith.reference.bookNumber}:{hadith.reference.hadithNumber}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      {getStatusBadge(hadith.isActive)}
                      {getDifficultyBadge(hadith.difficulty)}
                      <Badge variant="outline">{hadith.category}</Badge>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Hadith Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Current Daily Hadith</h3>
                  <p className="text-sm text-muted-foreground">
                    {dailyHadith ? 'Active' : 'No daily hadith set'}
                  </p>
                </div>
                <Button onClick={handleRefreshDailyHadith} disabled={loading}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Daily Hadith
                </Button>
              </div>
              
              {dailyHadith && (
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="text-right text-lg font-arabic">
                    {dailyHadith.arabic}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Narrated by: {dailyHadith.english.narrator}
                    </p>
                    <p className="text-sm">{dailyHadith.english.text}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Last updated: {new Date(dailyHadith.createdAt).toLocaleDateString()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HadithAdmin;
