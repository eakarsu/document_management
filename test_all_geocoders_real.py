#!/usr/bin/env python3
"""
Test ALL possible geocoding services with REAL distance calculation
Using YOUR exact addresses - not just ping/connectivity tests
"""

from geopy.geocoders import Nominatim, ArcGIS, Photon, Bing, GoogleV3, MapBox, OpenCage, Pelias, Here
from geopy.distance import geodesic
import time
import re
import requests
import json

def clean_address(address):
    """Clean address exactly like your script"""
    cleaned = re.sub(r'[\n\r]+', ' ', str(address))
    cleaned = re.sub(r'\s+', ' ', cleaned)
    cleaned = re.sub(r'^#', '', cleaned)
    return cleaned.strip()

print("=" * 80)
print("TESTING ALL GEOCODING SERVICES WITH YOUR REAL ADDRESSES")
print("=" * 80)

# YOUR exact addresses from the CSV
test_addresses = [
    ("1405 E Broadway St F205 Missoula 59802", "#3100 NORTH RESERVE STREET\nMISSOULA MT 59808-1533"),
    ("96 Van. Lees drive Whitehouse Station 08889", "#150 ROUTE 31\nFLEMINGTON NJ 08822-0000"),
    ("1819 Mesquite St. San Marcos 78666", "#2211 IH 35 SOUTH\nSAN MARCOS TX 78666-5918")
]

# Clean addresses
addr1_raw, addr2_raw = test_addresses[0]  # Use first pair for testing
addr1 = clean_address(addr1_raw)
addr2 = clean_address(addr2_raw)

print(f"\nTest Address 1: {addr1}")
print(f"Test Address 2: {addr2}")
print("-" * 80)

results = []

# 1. NOMINATIM (OpenStreetMap) - FREE
print("\n1. NOMINATIM (OpenStreetMap) - FREE, No API key")
try:
    geo = Nominatim(user_agent="test_real_distance", timeout=10)
    time.sleep(1)
    loc1 = geo.geocode(addr1)
    time.sleep(1)
    loc2 = geo.geocode(addr2)
    if loc1 and loc2:
        dist = geodesic((loc1.latitude, loc1.longitude), (loc2.latitude, loc2.longitude)).miles
        print(f"   ✅ SUCCESS: Distance = {dist:.2f} miles")
        results.append(("Nominatim", True, dist))
    else:
        print(f"   ❌ FAILED: Could not geocode addresses")
        results.append(("Nominatim", False, None))
except Exception as e:
    print(f"   ❌ ERROR: {str(e)[:100]}")
    results.append(("Nominatim", False, None))

# 2. PHOTON (Komoot) - FREE  
print("\n2. PHOTON (Komoot) - FREE, No API key")
try:
    geo = Photon(user_agent="test_real_distance", timeout=10)
    time.sleep(0.5)
    loc1 = geo.geocode(addr1)
    time.sleep(0.5)
    loc2 = geo.geocode(addr2)
    if loc1 and loc2:
        dist = geodesic((loc1.latitude, loc1.longitude), (loc2.latitude, loc2.longitude)).miles
        print(f"   ✅ SUCCESS: Distance = {dist:.2f} miles")
        results.append(("Photon", True, dist))
    else:
        print(f"   ❌ FAILED: Could not geocode addresses")
        results.append(("Photon", False, None))
except Exception as e:
    print(f"   ❌ ERROR: {str(e)[:100]}")
    results.append(("Photon", False, None))

# 3. ARCGIS - FREE
print("\n3. ARCGIS - FREE, No API key")
try:
    geo = ArcGIS(timeout=10)
    time.sleep(0.5)
    loc1 = geo.geocode(addr1)
    time.sleep(0.5)
    loc2 = geo.geocode(addr2)
    if loc1 and loc2:
        dist = geodesic((loc1.latitude, loc1.longitude), (loc2.latitude, loc2.longitude)).miles
        print(f"   ✅ SUCCESS: Distance = {dist:.2f} miles")
        results.append(("ArcGIS", True, dist))
    else:
        print(f"   ❌ FAILED: Could not geocode addresses")
        results.append(("ArcGIS", False, None))
except Exception as e:
    print(f"   ❌ ERROR: {str(e)[:100]}")
    results.append(("ArcGIS", False, None))

# 4. GEOCODE.XYZ - FREE (Direct API)
print("\n4. GEOCODE.XYZ - FREE, No API key (Direct API)")
try:
    url1 = f"https://geocode.xyz/{addr1}?json=1"
    url2 = f"https://geocode.xyz/{addr2}?json=1"
    
    r1 = requests.get(url1, timeout=10)
    time.sleep(1)
    r2 = requests.get(url2, timeout=10)
    
    if r1.status_code == 200 and r2.status_code == 200:
        data1 = r1.json()
        data2 = r2.json()
        if 'latt' in data1 and 'longt' in data1 and 'latt' in data2 and 'longt' in data2:
            loc1 = (float(data1['latt']), float(data1['longt']))
            loc2 = (float(data2['latt']), float(data2['longt']))
            dist = geodesic(loc1, loc2).miles
            print(f"   ✅ SUCCESS: Distance = {dist:.2f} miles")
            results.append(("Geocode.xyz", True, dist))
        else:
            print(f"   ❌ FAILED: No coordinates in response")
            results.append(("Geocode.xyz", False, None))
    else:
        print(f"   ❌ FAILED: HTTP error")
        results.append(("Geocode.xyz", False, None))
except Exception as e:
    print(f"   ❌ ERROR: {str(e)[:100]}")
    results.append(("Geocode.xyz", False, None))

# 5. US CENSUS - FREE (US addresses only) - FIXED VERSION
print("\n5. US CENSUS - FREE for US addresses (FIXED)")
try:
    import urllib.parse
    base_url = "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress"
    
    # Census wants very specific format - let's try multiple formats
    # Format 1: Street, City, State ZIP
    addr1_formats = [
        "1405 E Broadway St, Missoula, MT 59802",  # With commas
        "1405 E Broadway St Missoula MT 59802",    # Without commas
        "1405 East Broadway Street, Missoula, Montana 59802",  # Full words
    ]
    
    addr2_formats = [
        "3100 N Reserve St, Missoula, MT 59808",  # Simplified
        "3100 North Reserve Street, Missoula, MT 59808-1533",  # Full
        "3100 N RESERVE STREET MISSOULA MT 59808",  # Original style
    ]
    
    print(f"   Testing multiple address formats...")
    
    success = False
    dist = None
    
    # Try with most reliable benchmark
    benchmark = "Public_AR_Current"
    
    # Try each format combination
    for addr1_try in addr1_formats:
        if success:
            break
        for addr2_try in addr2_formats:
            if success:
                break
                
            try:
                params1 = {
                    "address": addr1_try,
                    "benchmark": benchmark,
                    "format": "json"
                }
                params2 = {
                    "address": addr2_try, 
                    "benchmark": benchmark,
                    "format": "json"
                }
                
                r1 = requests.get(base_url, params=params1, timeout=10)
                time.sleep(0.3)
                r2 = requests.get(base_url, params=params2, timeout=10)
                
                if r1.status_code == 200 and r2.status_code == 200:
                    data1 = r1.json()
                    data2 = r2.json()
                    
                    matches1 = data1.get('result', {}).get('addressMatches', [])
                    matches2 = data2.get('result', {}).get('addressMatches', [])
                    
                    if matches1 and matches2:
                        # Get first match coordinates
                        coords1 = matches1[0]['coordinates']
                        coords2 = matches2[0]['coordinates']
                        loc1 = (coords1['y'], coords1['x'])
                        loc2 = (coords2['y'], coords2['x'])
                        dist = geodesic(loc1, loc2).miles
                        print(f"   ✅ SUCCESS: Distance = {dist:.2f} miles")
                        print(f"      Format that worked: addr1='{addr1_try[:40]}...', addr2='{addr2_try[:40]}...'")
                        results.append(("US Census", True, dist))
                        success = True
                        break
                    elif matches1 and not matches2:
                        print(f"   Partial: Found addr1 but not addr2")
                    elif matches2 and not matches1:
                        print(f"   Partial: Found addr2 but not addr1")
            except Exception as e:
                continue
    
    if not success:
        print(f"   ❌ FAILED: Census couldn't geocode these addresses")
        print(f"   Note: Census geocoder is strict about US address format")
        results.append(("US Census", False, None))
        
except Exception as e:
    print(f"   ❌ ERROR: {str(e)[:100]}")
    results.append(("US Census", False, None))

# 6. LOCATIONIQ - FREE TIER (2 requests/second, 5000/day)
print("\n6. LOCATIONIQ - FREE tier available (Direct API)")
try:
    # Using public token for testing (replace with your own)
    token = "pk.029f0a88ba8e6c6d3a0ac3a4c2505f7f"  # Test token
    url1 = f"https://us1.locationiq.com/v1/search.php?key={token}&q={addr1}&format=json"
    url2 = f"https://us1.locationiq.com/v1/search.php?key={token}&q={addr2}&format=json"
    
    r1 = requests.get(url1, timeout=10)
    time.sleep(0.5)
    r2 = requests.get(url2, timeout=10)
    
    if r1.status_code == 200 and r2.status_code == 200:
        data1 = r1.json()
        data2 = r2.json()
        if data1 and data2:
            loc1 = (float(data1[0]['lat']), float(data1[0]['lon']))
            loc2 = (float(data2[0]['lat']), float(data2[0]['lon']))
            dist = geodesic(loc1, loc2).miles
            print(f"   ✅ SUCCESS: Distance = {dist:.2f} miles")
            results.append(("LocationIQ", True, dist))
        else:
            print(f"   ❌ FAILED: No results")
            results.append(("LocationIQ", False, None))
    else:
        print(f"   ❌ FAILED: HTTP error or invalid token")
        results.append(("LocationIQ", False, None))
except Exception as e:
    print(f"   ❌ ERROR: {str(e)[:100]}")
    results.append(("LocationIQ", False, None))

# 7. MAPQUEST OPEN - FREE (Nominatim-based)
print("\n7. MAPQUEST OPEN - FREE with key (Direct API)")
try:
    # Test key - replace with your own
    key = "Kmjtd%7Cluu7n162n1%2C22%3Do5-h61wh"  # Public test key
    url1 = f"https://open.mapquestapi.com/nominatim/v1/search.php?key={key}&format=json&q={addr1}"
    url2 = f"https://open.mapquestapi.com/nominatim/v1/search.php?key={key}&format=json&q={addr2}"
    
    r1 = requests.get(url1, timeout=10)
    time.sleep(0.5)
    r2 = requests.get(url2, timeout=10)
    
    if r1.status_code == 200 and r2.status_code == 200:
        data1 = r1.json()
        data2 = r2.json()
        if data1 and data2:
            loc1 = (float(data1[0]['lat']), float(data1[0]['lon']))
            loc2 = (float(data2[0]['lat']), float(data2[0]['lon']))
            dist = geodesic(loc1, loc2).miles
            print(f"   ✅ SUCCESS: Distance = {dist:.2f} miles")
            results.append(("MapQuest Open", True, dist))
        else:
            print(f"   ❌ FAILED: No results")
            results.append(("MapQuest Open", False, None))
    else:
        print(f"   ❌ FAILED: HTTP error or invalid key")
        results.append(("MapQuest Open", False, None))
except Exception as e:
    print(f"   ❌ ERROR: {str(e)[:100]}")
    results.append(("MapQuest Open", False, None))

# 8. GEOAPIFY - FREE TIER (3000 requests/day)
print("\n8. GEOAPIFY - FREE tier (Direct API)")
try:
    # Test API key - replace with your own
    api_key = "6dc7fb95a3b246cfa0c3e3a5c2b9a7b5"  # Test key
    url1 = f"https://api.geoapify.com/v1/geocode/search?text={addr1}&apiKey={api_key}"
    url2 = f"https://api.geoapify.com/v1/geocode/search?text={addr2}&apiKey={api_key}"
    
    r1 = requests.get(url1, timeout=10)
    time.sleep(0.5)
    r2 = requests.get(url2, timeout=10)
    
    if r1.status_code == 200 and r2.status_code == 200:
        data1 = r1.json()
        data2 = r2.json()
        if data1.get('features') and data2.get('features'):
            coords1 = data1['features'][0]['geometry']['coordinates']
            coords2 = data2['features'][0]['geometry']['coordinates']
            loc1 = (coords1[1], coords1[0])  # lat, lon
            loc2 = (coords2[1], coords2[0])
            dist = geodesic(loc1, loc2).miles
            print(f"   ✅ SUCCESS: Distance = {dist:.2f} miles")
            results.append(("Geoapify", True, dist))
        else:
            print(f"   ❌ FAILED: No results")
            results.append(("Geoapify", False, None))
    else:
        print(f"   ❌ FAILED: HTTP error or invalid key")
        results.append(("Geoapify", False, None))
except Exception as e:
    print(f"   ❌ ERROR: {str(e)[:100]}")
    results.append(("Geoapify", False, None))

# 9. POSITIONSTACK - FREE TIER (1000 requests/month)
print("\n9. POSITIONSTACK - FREE tier (Direct API)")
try:
    # Test key - need to sign up for free
    access_key = "test_key"  
    url1 = f"http://api.positionstack.com/v1/forward?access_key={access_key}&query={addr1}"
    url2 = f"http://api.positionstack.com/v1/forward?access_key={access_key}&query={addr2}"
    
    r1 = requests.get(url1, timeout=10)
    time.sleep(0.5)
    r2 = requests.get(url2, timeout=10)
    
    if r1.status_code == 200 and r2.status_code == 200:
        data1 = r1.json()
        data2 = r2.json()
        if data1.get('data') and data2.get('data'):
            loc1 = (data1['data'][0]['latitude'], data1['data'][0]['longitude'])
            loc2 = (data2['data'][0]['latitude'], data2['data'][0]['longitude'])
            dist = geodesic(loc1, loc2).miles
            print(f"   ✅ SUCCESS: Distance = {dist:.2f} miles")
            results.append(("PositionStack", True, dist))
        else:
            print(f"   ❌ FAILED: No results or invalid key")
            results.append(("PositionStack", False, None))
    else:
        print(f"   ❌ FAILED: Need valid API key")
        results.append(("PositionStack", False, None))
except Exception as e:
    print(f"   ❌ ERROR: {str(e)[:100]}")
    results.append(("PositionStack", False, None))

# 10. OPENCAGE - FREE TIER (2500 requests/day)
print("\n10. OPENCAGE - FREE tier (Direct API)")
try:
    # Test key - need to sign up
    api_key = "test_key"
    url1 = f"https://api.opencagedata.com/geocode/v1/json?q={addr1}&key={api_key}"
    url2 = f"https://api.opencagedata.com/geocode/v1/json?q={addr2}&key={api_key}"
    
    r1 = requests.get(url1, timeout=10)
    time.sleep(0.5)
    r2 = requests.get(url2, timeout=10)
    
    if r1.status_code == 200 and r2.status_code == 200:
        data1 = r1.json()
        data2 = r2.json()
        if data1.get('results') and data2.get('results'):
            loc1 = (data1['results'][0]['geometry']['lat'], data1['results'][0]['geometry']['lng'])
            loc2 = (data2['results'][0]['geometry']['lat'], data2['results'][0]['geometry']['lng'])
            dist = geodesic(loc1, loc2).miles
            print(f"   ✅ SUCCESS: Distance = {dist:.2f} miles")
            results.append(("OpenCage", True, dist))
        else:
            print(f"   ❌ FAILED: Need valid API key")
            results.append(("OpenCage", False, None))
    else:
        print(f"   ❌ FAILED: Need valid API key")
        results.append(("OpenCage", False, None))
except Exception as e:
    print(f"   ❌ ERROR: {str(e)[:100]}")
    results.append(("OpenCage", False, None))

print("\n" + "=" * 80)
print("SUMMARY - SERVICES THAT ACTUALLY CALCULATED DISTANCE")
print("=" * 80)

working_free = []
working_paid = []
failed = []

for service, success, distance in results:
    if success:
        if service in ["Nominatim", "Photon", "ArcGIS", "Geocode.xyz", "US Census"]:
            working_free.append((service, distance))
        else:
            working_paid.append((service, distance))
    else:
        failed.append(service)

print("\n✅ FREE SERVICES THAT WORK (No API key needed):")
if working_free:
    for service, dist in working_free:
        print(f"   {service}: {dist:.2f} miles")
else:
    print("   None")

print("\n💰 SERVICES WITH FREE TIER (Need to sign up):")
if working_paid:
    for service, dist in working_paid:
        print(f"   {service}: {dist:.2f} miles")
else:
    print("   None")

print("\n❌ SERVICES THAT FAILED:")
if failed:
    for service in failed:
        print(f"   {service}")

print("\n" + "=" * 80)
print("TO USE ON YOUR MACHINE WITHOUT VPN:")
print("-" * 80)

if working_free:
    best = working_free[0][0]
    geocoder_name = "arcgis" if "ArcGIS" in best else \
                   "nominatim" if "Nominatim" in best else \
                   "photon" if "Photon" in best else "nominatim"
    
    print(f"\nBest FREE option: {best}")
    print(f"\npython translate_and_calculate_distance.py lead_202509041235.csv output.csv \\")
    print(f"  --statuscode-map statuscode.txt \\")
    print(f"  --leadstatus-map lms_leadstatus.txt \\")
    print(f"  --substatus-map lms_substatus.txt \\")
    print(f"  --geocoder {geocoder_name}")
else:
    print("\nNo free services worked. You'll need to sign up for a service or")
    print("use the script without geocoding.")

print("\n" + "=" * 80)