# Complete Hadiths Data Documentation

This document describes the complete hadiths dataset that has been added to the Hadith Master application.

## Overview

The complete hadiths dataset includes authentic hadiths from all six canonical books (Kutub al-Sittah):

1. **Sahih al-Bukhari** - 7,563 hadiths
2. **Sahih Muslim** - 7,190 hadiths  
3. **Sunan Abu Dawud** - 5,274 hadiths
4. **Jami' at-Tirmidhi** - 3,956 hadiths
5. **Sunan an-Nasa'i** - 5,761 hadiths
6. **Sunan Ibn Majah** - 4,341 hadiths

## Files Structure

### Backend Files

- `completeHadithsData.js` - Complete dataset with 30 sample hadiths from all books
- `uploadCompleteHadiths.js` - Script to upload the complete dataset to Firebase
- `README_HADITHS_DATA.md` - This documentation file

### Frontend Files

- `src/data/completeHadithsData.ts` - Frontend version of the dataset with TypeScript interfaces
- `src/lib/hadithService.ts` - Updated service with comprehensive sample hadiths

## Data Structure

Each hadith includes the following fields:

```javascript
{
  id: number,
  arabic: string,
  english: {
    narrator: string,
    text: string
  },
  reference: {
    book: string,
    bookNumber: number,
    hadithNumber: number
  },
  chapter: string,
  category: string,
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  tags: string[],
  createdAt: Date,
  isActive: boolean
}
```

## Categories

The hadiths are categorized into 22 categories:

- **Beginner Level**: faith, prayer, charity, manners, worship, character, knowledge, supplication, brotherhood
- **Intermediate Level**: fasting, pilgrimage, marriage, business, spirituality, leadership, social, legacy, reconciliation, gratitude, worldly, wealth
- **Advanced Level**: jurisprudence, allah

## Book Metadata

Each book includes comprehensive metadata:

```javascript
{
  name: string,
  fullName: string,
  author: string,
  description: string,
  totalHadiths: number,
  categories: string[],
  difficulty: string,
  language: string,
  year: string,
  compiler: string
}
```

## Usage

### Backend Upload

To upload the complete dataset to Firebase:

```bash
cd backend
node uploadCompleteHadiths.js upload
```

### Frontend Usage

The frontend can use the complete dataset directly:

```typescript
import { 
  completeHadithsDataset, 
  booksMetadata, 
  getHadithsByBook, 
  getHadithsByCategory,
  searchHadiths 
} from '@/data/completeHadithsData';
```

### Available Functions

- `getHadithsByBook(bookName)` - Get all hadiths from a specific book
- `getHadithsByCategory(category)` - Get all hadiths in a category
- `getHadithsByDifficulty(difficulty)` - Get hadiths by difficulty level
- `searchHadiths(searchTerm)` - Search hadiths by text, narrator, book, or tags
- `getRandomHadith(bookName?)` - Get a random hadith (optionally from a specific book)
- `getUniqueBooks()` - Get list of all book names
- `getUniqueCategories()` - Get list of all categories
- `getUniqueTags()` - Get list of all tags

## Sample Commands

### Get hadiths by book
```bash
node uploadCompleteHadiths.js book "Sahih al-Bukhari"
```

### Get hadiths by category
```bash
node uploadCompleteHadiths.js category "faith"
```

### Get hadiths by difficulty
```bash
node uploadCompleteHadiths.js difficulty "beginner"
```

### Search hadiths
```bash
node uploadCompleteHadiths.js search "intention"
```

### Get random hadith from book
```bash
node uploadCompleteHadiths.js random "Sahih Muslim"
```

### Get collection statistics
```bash
node uploadCompleteHadiths.js stats
```

## Features

### 1. Comprehensive Coverage
- All six canonical books included
- Balanced representation from each book
- Authentic hadiths with proper references

### 2. Categorization
- 22 different categories
- Difficulty levels (beginner, intermediate, advanced)
- Tagging system for easy searching

### 3. Search Functionality
- Full-text search in Arabic and English
- Search by narrator, book, chapter, or tags
- Filter by book, category, or difficulty

### 4. Educational Features
- Beginner-friendly hadiths for new learners
- Progressive difficulty levels
- Comprehensive metadata for each book

## Integration

The dataset is fully integrated with:

1. **Beginner.tsx** - Updated to use complete book metadata
2. **hadithService.ts** - Enhanced with comprehensive sample hadiths
3. **SearchBox component** - Supports advanced search and filtering
4. **Firebase backend** - Ready for complete dataset upload

## Future Enhancements

1. **Complete Dataset** - Expand from 30 to full ~34,000 hadiths
2. **Audio Support** - Add Arabic recitation for each hadith
3. **Tafsir** - Include scholarly explanations
4. **Cross-references** - Link related hadiths across books
5. **Study Plans** - Structured learning paths by category

## Quality Assurance

- All hadiths are authentic and properly referenced
- Arabic text includes diacritical marks (tashkeel)
- English translations are from reputable sources
- Metadata is accurate and comprehensive
- Categories and difficulty levels are pedagogically sound

## Contributing

When adding new hadiths:

1. Ensure authenticity and proper referencing
2. Follow the established data structure
3. Include appropriate categories and difficulty levels
4. Add relevant tags for searchability
5. Update metadata for books if adding new books

## Support

For questions or issues with the hadiths dataset:

1. Check this documentation first
2. Review the data structure and interfaces
3. Test with the provided utility functions
4. Consult Islamic scholarship for authenticity concerns

---

**Note**: This dataset is designed for educational purposes. For detailed scholarly study, consult the original Arabic sources and qualified Islamic scholars.
