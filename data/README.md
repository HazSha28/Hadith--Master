# Hadith Data Processing Instructions

## Overview
This script processes Arabic `.usv` files and English `.txt` files to create merged JSON outputs with the exact structure you specified.

## Prerequisites
- Python 3.6 or higher
- Your data folder structure must be set up as:
```
data/
├─ Arabic/
│  ├─ Sahih al-Bukhari/
│  │  ├─ *.usv files
│  ├─ Sahih Muslim/
│  │  ├─ *.usv files
│  ├─ Sunan Abu Dawud/
│  │  ├─ *.usv files
│  ├─ Jami at-Tirmidhi/
│  │  ├─ *.usv files
│  ├─ Sunan an-Nasai/
│  │  ├─ *.usv files
│  ├─ Sunan Ibn Majah/
│  │  ├─ *.usv files
├─ English/
│  ├─ Sahih al-Bukhari.txt
│  ├─ Sahih Muslim.txt
│  ├─ Sunan Abu Dawud.txt
│  ├─ Jami at-Tirmidhi.txt
│  ├─ Sunan an-Nasai.txt
│  ├─ Sunan Ibn Majah.txt
└─ json/ (will be created automatically)
```

## Usage

### Quick Start
```bash
cd data
python process_hadiths_enhanced.py
```

### Alternative (Basic Script)
```bash
cd data
python process_hadiths.py
```

## Output Files
The script will generate JSON files in the `data/json/` folder:
- `sahih_bukhari.json`
- `sahih_muslim.json`
- `sunan_abu_dawud.json`
- `jami_tirmidhi.json`
- `sunan_nasai.json`
- `sunan_ibn_majah.json`

## JSON Structure
Each output file follows your exact specification:
```json
{
  "book": "Sahih al-Bukhari",
  "language": ["arabic", "english"],
  "hadiths": [
    {
      "id": 1,
      "arabic": "Arabic hadith text here",
      "english": {
        "text": "English translation here"
      },
      "reference": {
        "book": "Sahih al-Bukhari",
        "hadithNumber": 1
      }
    }
  ]
}
```

## Features

### Enhanced Script (`process_hadiths_enhanced.py`)
- ✅ Better error handling and logging
- ✅ Progress reporting for each file
- ✅ Unicode separator detection
- ✅ Summary report at the end
- ✅ Robust hadith number extraction
- ✅ Automatic directory creation

### Processing Logic
1. **Arabic Files**: Parses all `.usv` files in each book folder
2. **English Files**: Parses corresponding `.txt` file
3. **Merging**: Combines Arabic and English by hadith number
4. **Validation**: Skips hadiths missing either language
5. **Output**: Creates properly formatted JSON files

## Error Handling
- Missing files are reported and skipped
- Invalid hadith numbers are logged
- Missing Arabic/English pairs are skipped with warning
- Unicode encoding issues are handled gracefully

## Notes
- Arabic Unicode is preserved exactly
- No text content is modified or summarized
- Hadith numbers must align between Arabic and English files
- Processing is case-sensitive for book names

## Troubleshooting

### Common Issues
1. **"Arabic folder not found"**: Check folder names match exactly
2. **"No .usv files found"**: Ensure files have `.usv` extension
3. **"English file not found"**: Verify English files exist and names match
4. **Encoding errors**: Ensure files are saved as UTF-8

### Debug Mode
Add print statements to see intermediate data:
```python
print(f"Arabic hadiths found: {len(arabic_hadiths)}")
print(f"English hadiths found: {len(english_hadiths)}")
print(f"Sample Arabic: {arabic_hadiths[0] if arabic_hadiths else 'None'}")
```

## Customization
You can modify the script to:
- Change separator patterns for different USV formats
- Adjust hadith number regex patterns
- Add additional metadata fields
- Change output formatting

The script is designed to be flexible while maintaining your exact JSON structure requirements.
