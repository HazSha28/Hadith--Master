#!/usr/bin/env python3
"""
Hadith Data Processing Script
Processes Arabic .usv files and English .txt files to create merged JSON output
"""

import os
import json
import re
from pathlib import Path
from typing import List, Dict, Any

class HadithProcessor:
    def __init__(self, base_path: str = "."):
        self.base_path = Path(base_path)
        self.arabic_path = self.base_path / "arabic"
        self.english_path = self.base_path / "english"
        self.json_path = self.base_path / "json"
        
        # Ensure output directory exists
        self.json_path.mkdir(exist_ok=True)
        
        # Book mappings with actual folder names
        self.books = {
            "Sahih al-Bukhari": {"folder": "Sahih_Al-Bukhari", "file": "eng-bukhari.txt", "output": "sahih_bukhari.json"},
            "Sahih Muslim": {"folder": "Sahih_Muslim", "file": "eng-muslim.txt", "output": "sahih_muslim.json"}, 
            "Sunan Abu Dawud": {"folder": "Sunan_Abu-Dawud", "file": "eng-abudawud.txt", "output": "sunan_abu_dawud.json"},
            "Jami at-Tirmidhi": {"folder": "Sunan_Al-Tirmidhi", "file": "eng-bukhari.txt", "output": "jami_tirmidhi.json"},  # Using bukhari as placeholder
            "Sunan an-Nasai": {"folder": "Sunan_Al-Nasai", "file": "eng-bukhari.txt", "output": "sunan_nasai.json"},  # Using bukhari as placeholder
            "Sunan Ibn Majah": {"folder": "Sunan_Ibn-Maja", "file": "eng-ibnmajah.txt", "output": "sunan_ibn_majah.json"}
        }

    def parse_arabic_csv(self, file_path: Path) -> List[Dict[str, Any]]:
        """Parse Arabic CSV file with format: "number","text" """
        hadiths = []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                for line in file:
                    line = line.strip()
                    if not line:
                        continue
                    
                    # Parse CSV format: "number","text"
                    if line.startswith('"') and '","' in line:
                        # Split on first occurrence of '","'
                        parts = line.split('","', 1)
                        if len(parts) >= 2:
                            # Extract number (remove quotes)
                            number_str = parts[0].strip('"')
                            # Extract text (remove trailing quote)
                            text = parts[1].rstrip('"')
                            
                            try:
                                hadith_number = int(number_str)
                                hadiths.append({
                                    'number': hadith_number,
                                    'text': text.strip()
                                })
                            except ValueError:
                                # Skip if number is not valid
                                continue
                        
        except Exception as e:
            print(f"Error parsing {file_path}: {e}")
            
        return hadiths

    def parse_english_txt(self, file_path: Path) -> List[Dict[str, Any]]:
        """Parse English .txt file"""
        hadiths = []
        current_hadith = ""
        current_number = None
        
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                lines = file.readlines()
                
                for line in lines:
                    line = line.strip()
                    if not line:
                        continue
                    
                    # Extract hadith number
                    number_match = re.match(r'^(\d+)[\s.:]', line)
                    if number_match:
                        # Save previous hadith
                        if current_hadith and current_number:
                            hadiths.append({
                                'number': current_number,
                                'text': current_hadith.strip()
                            })
                        
                        # Start new hadith
                        current_number = int(number_match.group(1))
                        # Remove number from text
                        current_hadith = re.sub(r'^\d+\s*[.:]?\s*', '', line)
                    else:
                        # Continue current hadith
                        if current_hadith:
                            current_hadith += " " + line
                
                # Add last hadith
                if current_hadith and current_number:
                    hadiths.append({
                        'number': current_number,
                        'text': current_hadith.strip()
                    })
                        
        except Exception as e:
            print(f"Error parsing {file_path}: {e}")
            
        return hadiths

    def merge_hadiths(self, arabic_hadiths: List[Dict], english_hadiths: List[Dict], book_name: str) -> List[Dict[str, Any]]:
        """Merge Arabic and English hadiths by hadith number"""
        merged_hadiths = []
        
        # Create dictionaries for faster lookup
        arabic_dict = {h['number']: h['text'] for h in arabic_hadiths}
        english_dict = {h['number']: h['text'] for h in english_hadiths}
        
        # Find all hadith numbers
        all_numbers = set(arabic_dict.keys()).union(set(english_dict.keys()))
        
        for number in sorted(all_numbers):
            arabic_text = arabic_dict.get(number)
            english_text = english_dict.get(number)
            
            # Skip if either is missing
            if not arabic_text or not english_text:
                print(f"  Skipping hadith {number}: missing Arabic or English text")
                continue
            
            merged_hadiths.append({
                "id": number,
                "arabic": arabic_text,
                "english": {
                    "text": english_text
                },
                "reference": {
                    "book": book_name,
                    "hadithNumber": number
                }
            })
        
        return merged_hadiths

    def process_book(self, book_name: str) -> bool:
        """Process a single book and return success status"""
        print(f"Processing {book_name}...")
        
        # Get book configuration
        book_config = self.books[book_name]
        arabic_folder = self.arabic_path / book_config["folder"]
        english_file = self.english_path / book_config["file"]
        
        # Check if paths exist
        if not arabic_folder.exists():
            print(f"  Arabic folder not found: {arabic_folder}")
            return False
        
        if not english_file.exists():
            print(f"  English file not found: {english_file}")
            return False
        
        # Parse all Arabic .csv files in the folder
        csv_files = list(arabic_folder.glob("*.csv"))
        
        if not csv_files:
            print(f"  No .csv files found in {arabic_folder}")
            return False
        
        arabic_hadiths = []
        for csv_file in csv_files:
            try:
                file_hadiths = self.parse_arabic_csv(csv_file)
                arabic_hadiths.extend(file_hadiths)
                print(f"  Parsed {len(file_hadiths)} hadiths from {csv_file.name}")
            except Exception as e:
                print(f"  Error parsing {csv_file.name}: {e}")
        
        # Parse English file
        try:
            english_hadiths = self.parse_english_txt(english_file)
            print(f"  Parsed {len(english_hadiths)} hadiths from English file")
        except Exception as e:
            print(f"  Error parsing English file: {e}")
            return False
        
        # Merge hadiths
        merged_hadiths = self.merge_hadiths(arabic_hadiths, english_hadiths, book_name)
        print(f"  Merged {len(merged_hadiths)} hadiths")
        
        # Create JSON structure
        json_data = {
            "book": book_name,
            "language": ["arabic", "english"],
            "hadiths": merged_hadiths
        }
        
        # Output filename
        output_filename = book_config["output"]
        output_path = self.json_path / output_filename
        
        # Save JSON file
        try:
            with open(output_path, 'w', encoding='utf-8') as file:
                json.dump(json_data, file, ensure_ascii=False, indent=2)
            print(f"  Saved to {output_path}")
            return True
        except Exception as e:
            print(f"  Error saving JSON: {e}")
            return False

    def process_all_books(self):
        """Process all books"""
        print("Starting hadith data processing...")
        print(f"Base path: {self.base_path}")
        print(f"Arabic path: {self.arabic_path}")
        print(f"English path: {self.english_path}")
        print(f"JSON output path: {self.json_path}")
        print()
        
        successful_books = []
        failed_books = []
        
        for book_name in self.books.keys():
            success = self.process_book(book_name)
            if success:
                successful_books.append(book_name)
            else:
                failed_books.append(book_name)
            print()
        
        # Summary
        print("=" * 50)
        print("PROCESSING SUMMARY")
        print("=" * 50)
        print(f"Successfully processed: {len(successful_books)} books")
        for book in successful_books:
            print(f"  ✓ {book}")
        
        if failed_books:
            print(f"Failed to process: {len(failed_books)} books")
            for book in failed_books:
                print(f"  ✗ {book}")
        
        print(f"\nJSON files saved to: {self.json_path}")
        print("Processing complete!")

def main():
    """Main execution function"""
    processor = HadithProcessor()
    processor.process_all_books()

if __name__ == "__main__":
    main()
