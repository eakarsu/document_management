#!/usr/bin/env python3
"""
Script to translate fields using mapping tables and calculate distances between addresses.
"""

import argparse
import pandas as pd
import sys
import re
from geopy.geocoders import Nominatim, ArcGIS, Photon
from geopy.distance import geodesic
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
import requests
import urllib.parse
import time
import warnings
warnings.filterwarnings('ignore')


def load_mapping_table(filepath, delimiter='auto'):
    """Load mapping table from CSV/Excel/TXT file."""
    try:
        if filepath.endswith('.xlsx') or filepath.endswith('.xls'):
            return pd.read_excel(filepath, header=None)
        
        # For text/CSV files
        if delimiter == 'auto':
            # Auto-detect delimiter
            try:
                df = pd.read_csv(filepath, header=None, sep='\t', engine='python')
            except:
                try:
                    df = pd.read_csv(filepath, header=None, sep=',')
                except:
                    df = pd.read_csv(filepath, header=None, sep='|')
        else:
            # Use specified delimiter
            sep_map = {'tab': '\t', 'comma': ',', 'pipe': '|'}
            df = pd.read_csv(filepath, header=None, sep=sep_map.get(delimiter, '\t'))
        
        # Clean up trailing commas in the first column if present
        if not df.empty:
            df.iloc[:, 0] = df.iloc[:, 0].str.rstrip(',')
            
        return df
    except Exception as e:
        print(f"Error loading mapping table {filepath}: {e}")
        return None


def translate_field(df, field_name, mapping_df):
    """Translate field values using mapping table (numeric in data -> text from mapping)."""
    if mapping_df is None or field_name not in df.columns:
        return df
    
    # Clean the mapping data
    mapping_df = mapping_df.dropna()  # Remove empty rows
    
    # Strip whitespace and commas from both columns
    mapping_df.iloc[:, 0] = mapping_df.iloc[:, 0].str.strip().str.rstrip(',')
    mapping_df.iloc[:, 1] = mapping_df.iloc[:, 1].astype(str).str.strip()
    
    # Create mapping dictionary (2nd column numeric -> 1st column text)
    mapping_dict = dict(zip(mapping_df.iloc[:, 1], mapping_df.iloc[:, 0]))
    
    # Convert field values to string for matching
    df[field_name] = df[field_name].astype(str).str.strip()
    
    # Apply translation
    df[f'{field_name}_translated'] = df[field_name].map(mapping_dict).fillna(df[field_name])
    
    # Count successful translations
    translated_count = (df[f'{field_name}_translated'] != df[field_name]).sum()
    print(f"  - Translated {field_name}: {translated_count}/{len(df)} rows using {len(mapping_dict)} mappings")
    
    return df


def clean_address(address):
    """Clean address by removing newlines and extra whitespace."""
    if pd.isna(address):
        return ''
    # Remove newlines, carriage returns, and multiple spaces
    cleaned = re.sub(r'[\n\r]+', ' ', str(address))
    cleaned = re.sub(r'\s+', ' ', cleaned)
    # Remove # symbol at the beginning which confuses geocoders
    cleaned = re.sub(r'^#', '', cleaned)
    return cleaned.strip()


def prepare_address_for_geocoding(address):
    """Prepare address for better geocoding results."""
    if not address or pd.isna(address):
        return ''
    
    # Clean the address first
    cleaned = clean_address(address)
    
    # Remove apartment/suite/floor numbers that might confuse geocoder
    # Patterns: F205, Apt 3B, Suite 100, Unit 2A, etc.
    cleaned = re.sub(r'\b(apt|apartment|suite|ste|unit|floor|fl|#)\s*[\w-]+\b', '', cleaned, flags=re.IGNORECASE)
    # Also remove standalone apartment indicators like F205, B12, etc.
    cleaned = re.sub(r'\b[A-Z]\d+\b', '', cleaned)
    
    # Remove periods from abbreviations
    cleaned = cleaned.replace('.', '')
    
    # Fix "Van. Lees" type issues
    cleaned = re.sub(r'Van\s+Lees', 'Van Lees', cleaned)
    
    # Normalize directions
    cleaned = re.sub(r'\bNORTH\b', 'N', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\bSOUTH\b', 'S', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\bEAST\b', 'E', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\bWEST\b', 'W', cleaned, flags=re.IGNORECASE)
    
    # Clean up IH (Interstate Highway) format
    cleaned = re.sub(r'\bIH\s+(\d+)', r'Interstate \1', cleaned, flags=re.IGNORECASE)
    
    # Ensure state codes are uppercase
    cleaned = re.sub(r'\b([A-Z]{2})\b', lambda m: m.group(1).upper(), cleaned)
    
    # Remove extra spaces
    cleaned = re.sub(r'\s+', ' ', cleaned)
    
    # Add USA if no country specified and looks like US address
    if re.search(r'\b\d{5}(-\d{4})?\b', cleaned) and 'USA' not in cleaned.upper():
        cleaned += ' USA'
    
    return cleaned.strip()


def combine_address_fields(df):
    """Combine address fields into a single column."""
    address_fields = ['address1_line1', 'address1_line2', 'address1_city', 'address1_postalcode']
    
    # Check which fields exist
    existing_fields = [f for f in address_fields if f in df.columns]
    
    if existing_fields:
        # Combine fields, handling NaN values
        df['combined_address'] = df[existing_fields].fillna('').apply(
            lambda x: ' '.join(str(val).strip() for val in x if str(val).strip()), 
            axis=1
        )
    else:
        print("Warning: No address fields found for combination")
        df['combined_address'] = ''
    
    # Clean the lms_compositestorecontactdetails field
    if 'lms_compositestorecontactdetails' in df.columns:
        df['lms_compositestorecontactdetails'] = df['lms_compositestorecontactdetails'].apply(clean_address)
    
    return df


def geocode_address(address, geolocator, wait_time=1.0, max_retries=3, verbose=False):
    """Geocode an address with retry logic."""
    if not address or pd.isna(address) or str(address).strip() == '':
        return None
    
    # Prepare address for better geocoding
    geocoding_address = prepare_address_for_geocoding(address)
    
    if verbose:
        print(f"    Geocoding: {geocoding_address[:80]}...")
    
    for attempt in range(max_retries):
        try:
            time.sleep(wait_time)  # Rate limiting based on service
            location = geolocator.geocode(geocoding_address, timeout=10)
            if location:
                return (location.latitude, location.longitude)
            
            # If first attempt fails, try with less specific address
            if attempt < max_retries - 1:  # Still have retries left
                if ',' in geocoding_address or ' ' in geocoding_address:
                    # Try with just city, state, zip
                    parts = geocoding_address.split()
                    if len(parts) > 3:
                        # Take last 3-4 parts (usually city state zip)
                        geocoding_address = ' '.join(parts[-4:]) if len(parts) > 4 else ' '.join(parts[-3:])
                        if verbose:
                            print(f"    Retry with simpler: {geocoding_address}")
                        continue
            
            if verbose:
                print(f"    No result found")
            return None
            
        except (GeocoderTimedOut, GeocoderServiceError) as e:
            if attempt == max_retries - 1:
                if verbose:
                    print(f"    Timeout/Service error after {max_retries} attempts: {str(e)[:50]}")
                return None
            time.sleep(2 ** attempt)  # Exponential backoff
            
        except Exception as e:
            if verbose:
                print(f"    Geocoding error: {str(e)[:100]}")
            # Don't retry on other exceptions
            return None
    
    return None


def geocode_with_census(address):
    """Use US Census geocoder - completely free, no API key needed."""
    try:
        base_url = "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress"
        params = {"address": address, "benchmark": "Public_AR_Current", "format": "json"}
        url = f"{base_url}?{urllib.parse.urlencode(params)}"
        
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get('result', {}).get('addressMatches'):
                match = data['result']['addressMatches'][0]['coordinates']
                return (match['y'], match['x'])  # lat, lon
        return None
    except Exception:
        return None


def calculate_distances(df, geocoder_type='photon', sample_size=None):
    """Calculate distances between combined address and lms_compositestorecontactdetails."""
    # Choose geocoder based on type
    if geocoder_type == 'census':
        # US Census geocoder - completely free, no limits
        geolocator = None  # Will use custom function
        print("Using US Census geocoder (FREE, no API key, US addresses only)")
        wait_time = 0.2  # No documented rate limits
    elif geocoder_type == 'arcgis':
        try:
            geolocator = ArcGIS(timeout=15)
            print("Using ArcGIS geocoder (most accurate but may be blocked by VPN)")
            wait_time = 0.5  # Faster rate limit
        except Exception as e:
            print(f"Failed to initialize ArcGIS: {e}")
            geocoder_type = 'photon'  # Fallback to photon
    
    if geocoder_type == 'nominatim':
        geolocator = Nominatim(user_agent="address_distance_calculator", timeout=15)
        print("Using Nominatim geocoder (OpenStreetMap) - 1 request/second limit")
        wait_time = 1.0  # Strict rate limit
    elif geocoder_type == 'photon':
        # Try to handle proxy/SSL issues with VPN
        import ssl
        import certifi
        from geopy.adapters import URLLibAdapter
        
        try:
            # Create SSL context that's more permissive for VPN environments
            ctx = ssl.create_default_context(cafile=certifi.where())
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
            
            geolocator = Photon(
                user_agent="address_distance_calculator", 
                timeout=30,  # Increased timeout for VPN
                adapter_factory=lambda proxies=None: URLLibAdapter(proxies=proxies, ssl_context=ctx)
            )
            print("Using Photon geocoder (fast, configured for VPN)")
        except:
            # Fallback to simple Photon
            geolocator = Photon(user_agent="address_distance_calculator", timeout=30)
            print("Using Photon geocoder (fast, VPN-friendly, more relaxed rate limits)")
        
        wait_time = 0.5  # Slightly slower for VPN stability
    
    # Option to process only a sample for testing
    if sample_size:
        df_to_process = df.head(sample_size).copy()
        print(f"Processing sample of {sample_size} rows for testing")
    else:
        df_to_process = df
    
    distances = []
    total_rows = len(df_to_process)
    successful_geocodes = 0
    failed_geocodes = 0
    
    print(f"\nCalculating distances for {total_rows} rows... This may take a while.")
    print("=" * 70)
    
    for idx, row in df_to_process.iterrows():
        # Get addresses
        addr1 = row.get('combined_address', '')
        addr2 = row.get('lms_compositestorecontactdetails', '')
        
        # Show first few addresses for reference
        if idx < 3:
            print(f"\nRow {idx+1}:")
            print(f"  Address 1 (combined): {addr1[:100]}{'...' if len(addr1) > 100 else ''}")
            print(f"  Address 2 (lms_composite): {addr2[:100]}{'...' if len(addr2) > 100 else ''}")
        elif idx % 10 == 0:
            print(f"Processing row {idx+1}/{total_rows}...")
        
        # Geocode addresses (verbose for first 3 rows)
        if geocoder_type == 'census':
            # Use US Census geocoder
            if idx < 3:
                print(f"    Geocoding with Census: {addr1[:80]}...")
            coords1 = geocode_with_census(prepare_address_for_geocoding(addr1))
            time.sleep(wait_time)
            
            if idx < 3:
                print(f"    Geocoding with Census: {addr2[:80]}...")
            coords2 = geocode_with_census(prepare_address_for_geocoding(addr2))
            time.sleep(wait_time)
        else:
            # Use geopy geocoders
            coords1 = geocode_address(addr1, geolocator, wait_time, verbose=(idx < 3))
            coords2 = geocode_address(addr2, geolocator, wait_time, verbose=(idx < 3))
        
        # Calculate distance
        if coords1 and coords2:
            try:
                distance_miles = geodesic(coords1, coords2).miles
                distances.append(round(distance_miles, 2))
                successful_geocodes += 1
                if idx < 3:
                    print(f"  Distance: {round(distance_miles, 2)} miles")
            except Exception as e:
                print(f"  Error calculating distance: {e}")
                distances.append(None)
                failed_geocodes += 1
        else:
            if idx < 3:
                print(f"  Distance: Could not geocode {'both' if not coords1 and not coords2 else 'one of the'} addresses")
            distances.append(None)
            failed_geocodes += 1
            
        # Progress update every 100 rows
        if (idx + 1) % 100 == 0:
            success_rate = (successful_geocodes / (idx + 1)) * 100
            print(f"Progress: {idx+1}/{total_rows} rows - Success rate: {success_rate:.1f}%")
    
    print("=" * 70)
    print(f"Geocoding complete: {successful_geocodes} successful, {failed_geocodes} failed")
    
    # If processing a sample, apply None to the rest
    if sample_size:
        full_distances = [None] * len(df)
        full_distances[:len(distances)] = distances
        df['distance_miles'] = full_distances
    else:
        df['distance_miles'] = distances
        
    return df


def main():
    parser = argparse.ArgumentParser(
        description='Translate CSV/Excel fields using mapping tables and calculate address distances.'
    )
    parser.add_argument('input_file', help='Input CSV or Excel file path')
    parser.add_argument('output_file', help='Output CSV or Excel file path')
    parser.add_argument('--statuscode-map', help='Mapping table for statuscode field')
    parser.add_argument('--leadstatus-map', help='Mapping table for lms_leadstatus field')
    parser.add_argument('--substatus-map', help='Mapping table for lms_substatus field')
    parser.add_argument('--custom-map', action='append', nargs=2, metavar=('FIELD', 'FILE'),
                       help='Add custom field mapping (can be used multiple times)')
    parser.add_argument('--skip-distance', action='store_true', 
                       help='Skip distance calculation (faster processing)')
    parser.add_argument('--geocoder', choices=['photon', 'nominatim', 'arcgis', 'census'], default='photon',
                       help='Choose geocoder: photon (fast, default), nominatim (slower), arcgis (accurate), census (US only, free)')
    parser.add_argument('--sample', type=int, 
                       help='Process only first N rows for testing geocoding')
    parser.add_argument('--address-fields', nargs='+', 
                       default=['address1_line1', 'address1_line2', 'address1_city', 'address1_postalcode'],
                       help='Specify address fields to combine (default: address1_line1 address1_line2 address1_city address1_postalcode)')
    parser.add_argument('--address2-field', default='lms_compositestorecontactdetails',
                       help='Field containing second address for distance calc (default: lms_compositestorecontactdetails)')
    parser.add_argument('--delimiter', choices=['tab', 'comma', 'pipe', 'auto'], default='auto',
                       help='Delimiter for mapping files (default: auto-detect)')
    parser.add_argument('--keep-original', action='store_true',
                       help='Keep original fields alongside translated ones')
    
    args = parser.parse_args()
    
    # Load input file (CSV or Excel)
    print(f"Loading input file: {args.input_file}")
    try:
        if args.input_file.endswith('.csv'):
            df = pd.read_csv(args.input_file)
        else:
            df = pd.read_excel(args.input_file)
        print(f"Loaded {len(df)} rows with {len(df.columns)} columns")
    except Exception as e:
        print(f"Error loading input file: {e}")
        sys.exit(1)
    
    # Apply translations
    if args.statuscode_map:
        print(f"Applying statuscode translation from: {args.statuscode_map}")
        mapping_df = load_mapping_table(args.statuscode_map)
        if mapping_df is not None:
            df = translate_field(df, 'statuscode', mapping_df)
    
    if args.leadstatus_map:
        print(f"Applying lms_leadstatus translation from: {args.leadstatus_map}")
        mapping_df = load_mapping_table(args.leadstatus_map)
        if mapping_df is not None:
            df = translate_field(df, 'lms_leadstatus', mapping_df)
    
    if args.substatus_map:
        print(f"Applying lms_substatus translation from: {args.substatus_map}")
        mapping_df = load_mapping_table(args.substatus_map)
        if mapping_df is not None:
            df = translate_field(df, 'lms_substatus', mapping_df)
    
    # Combine address fields
    print("Combining address fields...")
    df = combine_address_fields(df)
    
    # Calculate distances
    if not args.skip_distance:
        if 'lms_compositestorecontactdetails' in df.columns:
            print("Calculating distances between addresses...")
            # Use specified geocoder (default: photon for speed)
            df = calculate_distances(df, geocoder_type=args.geocoder, sample_size=args.sample)
        else:
            print("Warning: lms_compositestorecontactdetails field not found, skipping distance calculation")
            df['distance_miles'] = None
    else:
        print("Skipping distance calculation as requested")
    
    # Save output
    print(f"\nSaving output to: {args.output_file}")
    try:
        if args.output_file.endswith('.csv'):
            df.to_csv(args.output_file, index=False)
        else:
            df.to_excel(args.output_file, index=False)
        print(f"Successfully saved {len(df)} rows to {args.output_file}")
        
        # Print summary
        print("\nSummary:")
        print(f"- Original columns: {len(df.columns)}")
        if 'statuscode_translated' in df.columns:
            print(f"- Translated statuscode values")
        if 'lms_leadstatus_translated' in df.columns:
            print(f"- Translated lms_leadstatus values")
        if 'lms_substatus_translated' in df.columns:
            print(f"- Translated lms_substatus values")
        if 'combined_address' in df.columns:
            print(f"- Created combined_address column")
        if 'distance_miles' in df.columns:
            non_null_distances = df['distance_miles'].notna().sum()
            print(f"- Calculated {non_null_distances} distances successfully")
            
    except Exception as e:
        print(f"Error saving output file: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()